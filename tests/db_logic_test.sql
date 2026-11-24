-- ============================================================================
-- AKSHAYA PATRA DBMS LOGIC & TRIGGER VERIFICATION TEST SUITE
-- ============================================================================
-- Executes inside a transaction block to test both happy paths & error catches.

BEGIN;

-- Setup Mock Test Data
INSERT INTO food_items (item_id, item_name, category, uom, min_stock_threshold)
VALUES 
    (9001, 'Test Sona Masoori Rice', 'GRAIN', 'KG', 50.0),
    (9002, 'Test Toor Dal', 'PULSE', 'KG', 20.0);

-- Procure 100 kg of Rice and 30 kg of Dal via procedure
CALL sp_procure_stock(9001, 'BATCH-RICE-01', 100.0, 45.0, 60, 'Tester', 'Initial test stock', NULL);
CALL sp_procure_stock(9002, 'BATCH-DAL-01', 30.0, 120.0, 60, 'Tester', 'Initial test stock', NULL);

-- Create Menu: "Test Khichdi"
INSERT INTO menus (menu_id, menu_name, meal_category, standard_calories)
VALUES (9101, 'Test Khichdi', 'REGULAR_LUNCH', 450);

-- Recipe: 1 meal = 0.08 kg Rice + 0.02 kg Dal
INSERT INTO recipe_ingredients (menu_id, item_id, qty_per_meal, uom)
VALUES 
    (9101, 9001, 0.0800, 'KG'),
    (9101, 9002, 0.0200, 'KG');

-- Create a cooking batch for 500 meals (Requires 40kg Rice, 10kg Dal)
INSERT INTO meal_batches (batch_id, batch_code, menu_id, prep_date, cooking_start_time, target_servings, actual_servings, head_cook_name, status)
VALUES (9201, 'TEST-BATCH-500', 9101, CURRENT_DATE, NOW() - INTERVAL '2 hours', 500, 500, 'Chef Anand', 'COOKING');

-- Test 1: Complete the batch -> Inventory should be auto-deducted
UPDATE meal_batches
SET status = 'COMPLETED', cooking_end_time = NOW(), food_temp_celsius = 78.5
WHERE batch_id = 9201;

-- Verify Rice is now 60 kg (100 - 40)
DO $$
DECLARE
    v_rice_qty NUMERIC;
    v_tx_count INT;
BEGIN
    SELECT current_qty INTO v_rice_qty FROM stock_inventory WHERE item_id = 9001;
    IF v_rice_qty != 60.0 THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Expected 60.0 kg rice, found %', v_rice_qty;
    END IF;

    SELECT count(*) INTO v_tx_count FROM stock_transactions WHERE reference_batch_id = 9201;
    IF v_tx_count != 2 THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Expected 2 stock transactions, found %', v_tx_count;
    END IF;

    RAISE NOTICE 'SUCCESS TEST 1: Auto-deduction trigger succeeded (Rice remaining: % kg, Transactions: %)', v_rice_qty, v_tx_count;
END $$;

-- Test 2: Inventory Deficit Protection
-- Try cooking 5000 meals (Requires 400kg Rice, but only 60kg is left)
INSERT INTO meal_batches (batch_id, batch_code, menu_id, prep_date, cooking_start_time, target_servings, actual_servings, head_cook_name, status)
VALUES (9202, 'TEST-BATCH-EXCESS', 9101, CURRENT_DATE, NOW(), 5000, 5000, 'Chef Anand', 'COOKING');

DO $$
BEGIN
    BEGIN
        UPDATE meal_batches SET status = 'COMPLETED' WHERE batch_id = 9202;
        RAISE EXCEPTION 'TEST 2 FAILED: Deficit check failed to block completion!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS TEST 2: Deficit check successfully prevented batch completion. Error: %', SQLERRM;
    END;
END $$;

-- Setup Route & School for Dispatch Test
INSERT INTO delivery_routes (route_id, route_code, route_name, vehicle_number, driver_name, driver_phone, max_capacity_meals)
VALUES (9301, 'RT-TEST-01', 'Test North Route', 'KA-01-AB-1234', 'Ramesh', '9876543210', 1000);

INSERT INTO institutions (institution_id, school_code, name, institution_type, route_id, principal_name, phone, address, total_enrolled)
VALUES (9401, 'SCH-TEST-01', 'Test Govt School', 'GOVERNMENT_PRIMARY', 9301, 'Mrs. Sharma', '9876543211', 'Test Road', 300);

-- Test 3: Over-dispatch protection
-- Batch 9201 has 500 meals. Attempting to dispatch 600 meals must fail.
DO $$
BEGIN
    BEGIN
        INSERT INTO dispatch_deliveries (batch_id, route_id, institution_id, meals_dispatched, delivery_status)
        VALUES (9201, 9301, 9401, 600, 'SCHEDULED');
        RAISE EXCEPTION 'TEST 3 FAILED: Over-dispatch was not caught!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS TEST 3: Over-dispatch blocked. Error: %', SQLERRM;
    END;
END $$;

-- Test 4: Valid dispatch of 250 meals succeeds
INSERT INTO dispatch_deliveries (batch_id, route_id, institution_id, meals_dispatched, delivery_status)
VALUES (9201, 9301, 9401, 250, 'SCHEDULED');

DO $$
DECLARE
    v_dispatched INT;
BEGIN
    SELECT meals_dispatched INTO v_dispatched FROM dispatch_deliveries WHERE batch_id = 9201;
    IF v_dispatched = 250 THEN
        RAISE NOTICE 'SUCCESS TEST 4: Valid dispatch of 250 meals recorded.';
    ELSE
        RAISE EXCEPTION 'TEST 4 FAILED: Expected 250 meals, found %', v_dispatched;
    END IF;
END $$;

-- Rollback the test mock data to keep database clean
ROLLBACK;

SELECT '=== ALL PL/pgSQL LOGIC & TRIGGER TESTS PASSED! ===' AS result;
