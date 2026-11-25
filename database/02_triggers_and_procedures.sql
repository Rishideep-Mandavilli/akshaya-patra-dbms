-- ============================================================================
-- AKSHAYA PATRA FOOD DISTRIBUTION MANAGEMENT SYSTEM
-- PL/pgSQL Triggers, Stored Procedures, and Functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRIGGER: Auto-Deduct Raw Inventory on Meal Batch Completion (FIFO)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_deduct_inventory_on_batch_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_recipe RECORD;
    v_stock RECORD;
    v_required_qty NUMERIC(10,2);
    v_remaining_to_deduct NUMERIC(10,2);
    v_available_stock NUMERIC(10,2);
    v_deduct_from_batch NUMERIC(10,2);
BEGIN
    -- Only trigger when batch transitions to 'COMPLETED'
    IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
        
        -- Validate actual_servings
        IF NEW.actual_servings IS NULL OR NEW.actual_servings <= 0 THEN
            RAISE EXCEPTION 'Cannot complete batch %: actual_servings must be greater than 0', NEW.batch_code;
        END IF;

        -- Step A: Pre-validation - Ensure all ingredients have sufficient non-expired stock
        FOR v_recipe IN 
            SELECT r.item_id, f.item_name, f.uom, r.qty_per_meal
            FROM recipe_ingredients r
            JOIN food_items f ON r.item_id = f.item_id
            WHERE r.menu_id = NEW.menu_id
        LOOP
            v_required_qty := ROUND(v_recipe.qty_per_meal * NEW.actual_servings, 2);

            SELECT COALESCE(SUM(current_qty), 0)
            INTO v_available_stock
            FROM stock_inventory
            WHERE item_id = v_recipe.item_id
              AND expiry_date >= NEW.prep_date
              AND current_qty > 0;

            IF v_available_stock < v_required_qty THEN
                RAISE EXCEPTION 'INVENTORY DEFICIT: Cannot complete batch % (Menu: %). Ingredient "%" requires % %, but only % % is available in non-expired stock.',
                    NEW.batch_code, NEW.menu_id, v_recipe.item_name, v_required_qty, v_recipe.uom, v_available_stock, v_recipe.uom;
            END IF;
        END LOOP;

        -- Step B: Execution - Deduct stock using FIFO (earliest expiry first) and log audit ledger
        FOR v_recipe IN 
            SELECT r.item_id, f.item_name, r.qty_per_meal
            FROM recipe_ingredients r
            JOIN food_items f ON r.item_id = f.item_id
            WHERE r.menu_id = NEW.menu_id
        LOOP
            v_remaining_to_deduct := ROUND(v_recipe.qty_per_meal * NEW.actual_servings, 2);

            FOR v_stock IN 
                SELECT stock_id, current_qty
                FROM stock_inventory
                WHERE item_id = v_recipe.item_id
                  AND expiry_date >= NEW.prep_date
                  AND current_qty > 0
                ORDER BY expiry_date ASC, stock_id ASC
            LOOP
                EXIT WHEN v_remaining_to_deduct <= 0;

                IF v_stock.current_qty <= v_remaining_to_deduct THEN
                    v_deduct_from_batch := v_stock.current_qty;
                ELSE
                    v_deduct_from_batch := v_remaining_to_deduct;
                END IF;

                -- Decrement stock in warehouse
                UPDATE stock_inventory
                SET current_qty = current_qty - v_deduct_from_batch
                WHERE stock_id = v_stock.stock_id;

                -- Log transaction in immutable audit ledger
                INSERT INTO stock_transactions (
                    stock_id,
                    item_id,
                    transaction_type,
                    quantity,
                    reference_batch_id,
                    remarks
                ) VALUES (
                    v_stock.stock_id,
                    v_recipe.item_id,
                    'COOKING_CONSUMPTION',
                    v_deduct_from_batch,
                    NEW.batch_id,
                    'Auto-deducted for batch ' || NEW.batch_code || ' (' || NEW.actual_servings || ' servings)'
                );

                v_remaining_to_deduct := v_remaining_to_deduct - v_deduct_from_batch;
            END LOOP;
        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_deduct_inventory ON meal_batches;
CREATE TRIGGER trg_deduct_inventory
    AFTER UPDATE ON meal_batches
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_deduct_inventory_on_batch_completion();


-- ----------------------------------------------------------------------------
-- 2. TRIGGER: Prevent Over-Dispatch Beyond Cooked Batch Servings
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_prevent_over_dispatch()
RETURNS TRIGGER AS $$
DECLARE
    v_actual_servings INT;
    v_batch_status VARCHAR(30);
    v_batch_code VARCHAR(50);
    v_total_dispatched INT;
BEGIN
    -- Check batch existence and status
    SELECT status, actual_servings, batch_code
    INTO v_batch_status, v_actual_servings, v_batch_code
    FROM meal_batches
    WHERE batch_id = NEW.batch_id;

    IF v_batch_status != 'COMPLETED' THEN
        RAISE EXCEPTION 'DISPATCH REJECTED: Batch % is in "%" status. Meals can only be dispatched from COMPLETED batches.',
            v_batch_code, v_batch_status;
    END IF;

    -- Calculate total already dispatched for this batch (excluding current row on UPDATE)
    SELECT COALESCE(SUM(meals_dispatched), 0)
    INTO v_total_dispatched
    FROM dispatch_deliveries
    WHERE batch_id = NEW.batch_id
      AND dispatch_id != COALESCE(NEW.dispatch_id, -1);

    IF (v_total_dispatched + NEW.meals_dispatched) > v_actual_servings THEN
        RAISE EXCEPTION 'OVER-DISPATCH INTEGRITY VIOLATION: Batch % produced % meals. Already dispatched: % meals. Attempting to add % meals exceeds capacity by % meals.',
            v_batch_code, v_actual_servings, v_total_dispatched, NEW.meals_dispatched, 
            ((v_total_dispatched + NEW.meals_dispatched) - v_actual_servings);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_dispatch ON dispatch_deliveries;
CREATE TRIGGER trg_check_dispatch
    BEFORE INSERT OR UPDATE ON dispatch_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_prevent_over_dispatch();


-- ----------------------------------------------------------------------------
-- 3. TRIGGER: Auto-Calculate Leftovers & Wastage on Daily Indent
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_trg_audit_daily_leftovers()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.actual_present_students IS NOT NULL THEN
        -- Leftover = Max(0, Requested - Present)
        NEW.leftover_meals := GREATEST(0, NEW.requested_meals - NEW.actual_present_students);

        IF NEW.leftover_meals > 0 AND (NEW.wastage_reason IS NULL OR TRIM(NEW.wastage_reason) = '') THEN
            NEW.wastage_reason := 'Student absenteeism / Over-estimation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_leftovers ON daily_indents;
CREATE TRIGGER trg_audit_leftovers
    BEFORE INSERT OR UPDATE ON daily_indents
    FOR EACH ROW
    EXECUTE FUNCTION fn_trg_audit_daily_leftovers();


-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURE: Automated Daily Dispatch Plan Generation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_auto_generate_daily_dispatch(
    IN p_date DATE,
    IN p_batch_id INT,
    OUT p_scheduled_count INT
) AS $$
DECLARE
    v_indent RECORD;
    v_batch_code VARCHAR(50);
    v_batch_status VARCHAR(30);
    v_available_servings INT;
    v_already_dispatched INT;
    v_remaining_servings INT;
    v_count INT := 0;
BEGIN
    -- Validate Batch
    SELECT batch_code, status, actual_servings
    INTO v_batch_code, v_batch_status, v_available_servings
    FROM meal_batches
    WHERE batch_id = p_batch_id;

    IF v_batch_status IS NULL THEN
        RAISE EXCEPTION 'Batch ID % does not exist.', p_batch_id;
    END IF;

    IF v_batch_status != 'COMPLETED' THEN
        RAISE EXCEPTION 'Batch % is not COMPLETED (current status: %)', v_batch_code, v_batch_status;
    END IF;

    SELECT COALESCE(SUM(meals_dispatched), 0)
    INTO v_already_dispatched
    FROM dispatch_deliveries
    WHERE batch_id = p_batch_id;

    v_remaining_servings := v_available_servings - v_already_dispatched;

    -- Iterate through approved daily indents for the date that haven't been dispatched yet
    FOR v_indent IN
        SELECT di.institution_id, di.requested_meals, inst.route_id
        FROM daily_indents di
        JOIN institutions inst ON di.institution_id = inst.institution_id
        WHERE di.indent_date = p_date
          AND di.status = 'APPROVED'
          AND inst.route_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1 FROM dispatch_deliveries dd
              WHERE dd.institution_id = di.institution_id
                AND dd.dispatch_date = p_date
          )
        ORDER BY inst.route_id, di.requested_meals DESC
    LOOP
        IF v_remaining_servings >= v_indent.requested_meals THEN
            INSERT INTO dispatch_deliveries (
                batch_id,
                route_id,
                institution_id,
                dispatch_date,
                meals_dispatched,
                departure_time,
                delivery_status,
                notes
            ) VALUES (
                p_batch_id,
                v_indent.route_id,
                v_indent.institution_id,
                p_date,
                v_indent.requested_meals,
                NOW(),
                'SCHEDULED',
                'Auto-scheduled by sp_auto_generate_daily_dispatch'
            );

            v_remaining_servings := v_remaining_servings - v_indent.requested_meals;
            v_count := v_count + 1;
        ELSE
            -- Insufficient batch capacity remaining
            EXIT;
        END IF;
    END LOOP;

    p_scheduled_count := v_count;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 5. STORED PROCEDURE: Safe Stock Inward Procurement
-- ----------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_procure_stock(
    IN p_item_id INT,
    IN p_batch_number VARCHAR(50),
    IN p_quantity NUMERIC(10,2),
    IN p_unit_price NUMERIC(10,2),
    IN p_shelf_life_days INT,
    IN p_logged_by VARCHAR(100),
    IN p_remarks TEXT,
    OUT p_new_stock_id INT
) AS $$
DECLARE
    v_expiry_date DATE;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Procurement quantity must be greater than zero.';
    END IF;

    v_expiry_date := CURRENT_DATE + COALESCE(p_shelf_life_days, 30);

    INSERT INTO stock_inventory (
        item_id,
        batch_number,
        received_date,
        expiry_date,
        initial_qty,
        current_qty,
        unit_price_inr
    ) VALUES (
        p_item_id,
        p_batch_number,
        CURRENT_DATE,
        v_expiry_date,
        p_quantity,
        p_quantity,
        p_unit_price
    ) RETURNING stock_id INTO p_new_stock_id;

    INSERT INTO stock_transactions (
        stock_id,
        item_id,
        transaction_type,
        quantity,
        logged_by,
        remarks
    ) VALUES (
        p_new_stock_id,
        p_item_id,
        'PROCUREMENT',
        p_quantity,
        COALESCE(p_logged_by, 'Procurement Officer'),
        COALESCE(p_remarks, 'Standard Stock Inward')
    );
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 6. ANALYTICAL FUNCTION: School Meal Wastage Rate Calculation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_school_wastage_rate(
    p_institution_id INT,
    p_days INT DEFAULT 30
)
RETURNS NUMERIC AS $$
DECLARE
    v_total_requested NUMERIC;
    v_total_leftover NUMERIC;
    v_wastage_pct NUMERIC;
BEGIN
    SELECT 
        COALESCE(SUM(requested_meals), 0),
        COALESCE(SUM(leftover_meals), 0)
    INTO v_total_requested, v_total_leftover
    FROM daily_indents
    WHERE institution_id = p_institution_id
      AND indent_date >= (CURRENT_DATE - p_days);

    IF v_total_requested = 0 THEN
        RETURN 0.00;
    END IF;

    v_wastage_pct := ROUND((v_total_leftover / v_total_requested) * 100.0, 2);
    RETURN v_wastage_pct;
END;
$$ LANGUAGE plpgsql STABLE;


-- ----------------------------------------------------------------------------
-- 7. ANALYTICAL FUNCTION: Sponsor Contribution & Impact Summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_donor_impact_summary(p_sponsor_id INT)
RETURNS TABLE (
    sponsor_name VARCHAR(150),
    total_donated_inr NUMERIC(12,2),
    meals_subsidized BIGINT,
    schools_supported BIGINT,
    earmarked_school_name VARCHAR(150),
    first_donation_date DATE,
    latest_donation_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name::VARCHAR(150) AS sponsor_name,
        COALESCE(SUM(d.amount_inr), 0)::NUMERIC(12,2) AS total_donated_inr,
        (COALESCE(SUM(d.amount_inr), 0) / 20.0)::BIGINT AS meals_subsidized, -- standard subsidy @ ₹20/meal
        COUNT(DISTINCT d.earmarked_institution_id)::BIGINT AS schools_supported,
        MAX(inst.name)::VARCHAR(150) AS earmarked_school_name,
        MIN(d.donation_date) AS first_donation_date,
        MAX(d.donation_date) AS latest_donation_date
    FROM sponsors s
    LEFT JOIN donations d ON s.sponsor_id = d.sponsor_id
    LEFT JOIN institutions inst ON d.earmarked_institution_id = inst.institution_id
    WHERE s.sponsor_id = p_sponsor_id
    GROUP BY s.sponsor_id, s.name;
END;
$$ LANGUAGE plpgsql STABLE;
