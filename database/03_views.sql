-- ============================================================================
-- AKSHAYA PATRA FOOD DISTRIBUTION MANAGEMENT SYSTEM
-- Relational Views for Analytical Reporting & Real-time Dashboards
-- ============================================================================

-- 1. Daily Kitchen Production & Safety Summary
CREATE OR REPLACE VIEW v_daily_kitchen_summary AS
SELECT 
    mb.prep_date,
    COUNT(mb.batch_id) AS total_batches,
    SUM(mb.target_servings) AS total_target_meals,
    SUM(COALESCE(mb.actual_servings, 0)) AS total_actual_meals,
    ROUND(AVG(mb.food_temp_celsius), 1) AS avg_cooking_temp_celsius,
    COUNT(CASE WHEN mb.status = 'COMPLETED' THEN 1 END) AS completed_batches,
    COUNT(CASE WHEN mb.status = 'COOKING' THEN 1 END) AS in_progress_batches,
    COUNT(CASE WHEN mb.status = 'PLANNED' THEN 1 END) AS planned_batches
FROM meal_batches mb
GROUP BY mb.prep_date
ORDER BY mb.prep_date DESC;

-- 2. Low Stock & Perishable Expiry Alerts
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT 
    fi.item_id,
    fi.item_name,
    fi.category,
    fi.uom,
    fi.min_stock_threshold,
    COALESCE(SUM(si.current_qty), 0) AS total_available_qty,
    CASE 
        WHEN COALESCE(SUM(si.current_qty), 0) = 0 THEN 'OUT_OF_STOCK'
        WHEN COALESCE(SUM(si.current_qty), 0) <= fi.min_stock_threshold THEN 'CRITICAL_LOW'
        ELSE 'NORMAL'
    END AS stock_health_status,
    MIN(si.expiry_date) AS nearest_expiry_date,
    CASE 
        WHEN MIN(si.expiry_date) <= CURRENT_DATE THEN 'EXPIRED_LOTS_PRESENT'
        WHEN MIN(si.expiry_date) <= (CURRENT_DATE + 3) THEN 'EXPIRING_WITHIN_72H'
        ELSE 'SAFE'
    END AS expiry_risk_level
FROM food_items fi
LEFT JOIN stock_inventory si ON fi.item_id = si.item_id AND si.current_qty > 0
GROUP BY fi.item_id, fi.item_name, fi.category, fi.uom, fi.min_stock_threshold
ORDER BY stock_health_status ASC, total_available_qty ASC;

-- 3. Live School Distribution & Route Status
CREATE OR REPLACE VIEW v_school_distribution_status AS
SELECT 
    dd.dispatch_id,
    dd.dispatch_date,
    inst.name AS school_name,
    inst.school_code,
    inst.institution_type,
    dr.route_code,
    dr.route_name,
    dr.driver_name,
    dr.driver_phone,
    dr.vehicle_number,
    mb.batch_code,
    m.menu_name,
    dd.meals_dispatched,
    dd.delivery_status,
    dd.departure_time,
    dd.arrival_time,
    dd.delivery_temp_celsius,
    dd.received_by_signature
FROM dispatch_deliveries dd
JOIN institutions inst ON dd.institution_id = inst.institution_id
JOIN delivery_routes dr ON dd.route_id = dr.route_id
JOIN meal_batches mb ON dd.batch_id = mb.batch_id
JOIN menus m ON mb.menu_id = m.menu_id
ORDER BY dd.dispatch_date DESC, dr.route_code ASC;

-- 4. Sponsor Contribution & Impact Leaderboard
CREATE OR REPLACE VIEW v_donor_leaderboard AS
SELECT 
    s.sponsor_id,
    s.name AS sponsor_name,
    s.organization_type,
    COUNT(d.donation_id) AS total_donations_count,
    COALESCE(SUM(d.amount_inr), 0) AS total_donated_inr,
    (COALESCE(SUM(d.amount_inr), 0) / 20.0)::BIGINT AS meals_subsidized,
    COUNT(DISTINCT d.earmarked_institution_id) AS schools_supported,
    MAX(d.donation_date) AS last_donation_date
FROM sponsors s
LEFT JOIN donations d ON s.sponsor_id = d.sponsor_id
GROUP BY s.sponsor_id, s.name, s.organization_type
ORDER BY total_donated_inr DESC;

-- 5. Ingredient Consumption & Cost Analytics
CREATE OR REPLACE VIEW v_ingredient_consumption_stats AS
SELECT 
    fi.item_id,
    fi.item_name,
    fi.category,
    fi.uom,
    COUNT(st.transaction_id) AS consumption_events,
    COALESCE(SUM(st.quantity), 0) AS total_qty_consumed,
    ROUND(AVG(si.unit_price_inr), 2) AS avg_unit_cost_inr,
    ROUND(COALESCE(SUM(st.quantity), 0) * COALESCE(AVG(si.unit_price_inr), 0), 2) AS estimated_cost_inr
FROM food_items fi
JOIN stock_transactions st ON fi.item_id = st.item_id AND st.transaction_type = 'COOKING_CONSUMPTION'
LEFT JOIN stock_inventory si ON st.stock_id = si.stock_id
GROUP BY fi.item_id, fi.item_name, fi.category, fi.uom
ORDER BY estimated_cost_inr DESC;
