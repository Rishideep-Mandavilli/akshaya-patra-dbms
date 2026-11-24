-- ============================================================================
-- AKSHAYA PATRA FOOD DISTRIBUTION MANAGEMENT SYSTEM
-- Advanced Analytical SQL Queries for Academic DBMS Evaluation
-- ============================================================================
-- Demonstrates: Multi-table JOINs, Window Functions, CTEs, Aggregates with HAVING,
-- Subqueries, Grouping Sets, and Analytical Insights.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: End-to-End Traceability (5-Table JOIN)
-- Traces what meal was cooked, by which chef, dispatched via which van, to which school.
-- ----------------------------------------------------------------------------
SELECT 
    mb.batch_code,
    m.menu_name,
    mb.head_cook_name,
    inst.name AS school_name,
    inst.school_code,
    dr.route_code,
    dr.driver_name,
    dr.vehicle_number,
    dd.meals_dispatched,
    dd.delivery_status,
    dd.delivery_temp_celsius
FROM dispatch_deliveries dd
JOIN meal_batches mb ON dd.batch_id = mb.batch_id
JOIN menus m ON mb.menu_id = m.menu_id
JOIN institutions inst ON dd.institution_id = inst.institution_id
JOIN delivery_routes dr ON dd.route_id = dr.route_id
ORDER BY mb.batch_code, dd.dispatch_id;


-- ----------------------------------------------------------------------------
-- QUERY 2: School Wastage & Attendance Gap Analysis (HAVING Clause)
-- Identifies schools where student absenteeism led to meal wastage.
-- ----------------------------------------------------------------------------
SELECT 
    inst.name AS school_name,
    inst.school_code,
    COUNT(di.indent_id) AS recorded_days,
    SUM(di.requested_meals) AS total_meals_requested,
    SUM(di.actual_present_students) AS total_students_present,
    SUM(di.leftover_meals) AS total_leftover_meals,
    ROUND((SUM(di.leftover_meals)::NUMERIC / NULLIF(SUM(di.requested_meals), 0)) * 100, 2) AS wastage_percentage
FROM institutions inst
JOIN daily_indents di ON inst.institution_id = di.institution_id
GROUP BY inst.name, inst.school_code
HAVING SUM(di.leftover_meals) > 0
ORDER BY wastage_percentage DESC;


-- ----------------------------------------------------------------------------
-- QUERY 3: Route Capacity Utilization & Load Balancing
-- Checks if delivery vans are being overloaded or underutilized.
-- ----------------------------------------------------------------------------
SELECT 
    dr.route_code,
    dr.route_name,
    dr.vehicle_number,
    dr.max_capacity_meals,
    COALESCE(SUM(dd.meals_dispatched), 0) AS total_meals_loaded,
    ROUND((COALESCE(SUM(dd.meals_dispatched), 0)::NUMERIC / dr.max_capacity_meals) * 100, 2) AS capacity_utilization_pct,
    CASE 
        WHEN (COALESCE(SUM(dd.meals_dispatched), 0)::NUMERIC / dr.max_capacity_meals) > 0.90 THEN 'NEAR_CAPACITY'
        WHEN (COALESCE(SUM(dd.meals_dispatched), 0)::NUMERIC / dr.max_capacity_meals) BETWEEN 0.50 AND 0.90 THEN 'OPTIMAL'
        ELSE 'UNDER_UTILIZED'
    END AS fleet_status
FROM delivery_routes dr
LEFT JOIN dispatch_deliveries dd ON dr.route_id = dd.route_id AND dd.dispatch_date = CURRENT_DATE
GROUP BY dr.route_code, dr.route_name, dr.vehicle_number, dr.max_capacity_meals
ORDER BY capacity_utilization_pct DESC;


-- ----------------------------------------------------------------------------
-- QUERY 4: Window Function - School Meal Demand Ranking per Route (DENSE_RANK)
-- Ranks institutions within each distribution corridor by their student enrollment.
-- ----------------------------------------------------------------------------
SELECT 
    dr.route_code,
    inst.name AS school_name,
    inst.institution_type,
    inst.total_enrolled,
    DENSE_RANK() OVER (PARTITION BY dr.route_id ORDER BY inst.total_enrolled DESC) AS rank_in_route
FROM institutions inst
JOIN delivery_routes dr ON inst.route_id = dr.route_id
ORDER BY dr.route_code, rank_in_route;


-- ----------------------------------------------------------------------------
-- QUERY 5: Window Function - Cumulative Running Total of Meals Cooked
-- Computes the progressive sum of meals prepared across batches over time.
-- ----------------------------------------------------------------------------
SELECT 
    mb.batch_id,
    mb.batch_code,
    mb.prep_date,
    m.menu_name,
    mb.actual_servings,
    SUM(mb.actual_servings) OVER (
        ORDER BY mb.prep_date, mb.cooking_start_time
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_meals_cooked
FROM meal_batches mb
JOIN menus m ON mb.menu_id = m.menu_id
WHERE mb.status = 'COMPLETED';


-- ----------------------------------------------------------------------------
-- QUERY 6: Common Table Expression (CTE) - Batch Production Economics
-- Calculates the total raw ingredient cost of each cooking batch using BOM & stock prices.
-- ----------------------------------------------------------------------------
WITH BatchIngredientCosts AS (
    SELECT 
        st.reference_batch_id AS batch_id,
        st.item_id,
        st.quantity AS qty_consumed,
        si.unit_price_inr,
        (st.quantity * si.unit_price_inr) AS total_item_cost
    FROM stock_transactions st
    JOIN stock_inventory si ON st.stock_id = si.stock_id
    WHERE st.transaction_type = 'COOKING_CONSUMPTION'
)
SELECT 
    mb.batch_code,
    m.menu_name,
    mb.actual_servings,
    ROUND(SUM(bic.total_item_cost), 2) AS total_batch_cost_inr,
    ROUND(SUM(bic.total_item_cost) / NULLIF(mb.actual_servings, 0), 2) AS raw_cost_per_meal_inr
FROM meal_batches mb
JOIN menus m ON mb.menu_id = m.menu_id
JOIN BatchIngredientCosts bic ON mb.batch_id = bic.batch_id
GROUP BY mb.batch_code, m.menu_name, mb.actual_servings
ORDER BY mb.batch_code;


-- ----------------------------------------------------------------------------
-- QUERY 7: Correlated Subquery - Schools Exceeding Average Wastage
-- Finds schools whose meal wastage exceeds the district-wide average.
-- ----------------------------------------------------------------------------
SELECT 
    inst.name AS school_name,
    inst.school_code,
    di.indent_date,
    di.leftover_meals
FROM daily_indents di
JOIN institutions inst ON di.institution_id = inst.institution_id
WHERE di.leftover_meals > (
    SELECT AVG(sub_di.leftover_meals)
    FROM daily_indents sub_di
    WHERE sub_di.indent_date = di.indent_date
)
ORDER BY di.leftover_meals DESC;


-- ----------------------------------------------------------------------------
-- QUERY 8: Grouping Sets / ROLLUP - Donor Contribution Analysis
-- Aggregates total funding by organization type and earmarked school with subtotals.
-- ----------------------------------------------------------------------------
SELECT 
    COALESCE(s.organization_type, 'TOTAL (ALL TYPES)') AS org_type,
    COALESCE(inst.name, 'GENERAL FUND (UNEARMARKED)') AS earmarked_school,
    COUNT(d.donation_id) AS total_donations,
    SUM(d.amount_inr) AS total_amount_inr
FROM sponsors s
JOIN donations d ON s.sponsor_id = d.sponsor_id
LEFT JOIN institutions inst ON d.earmarked_institution_id = inst.institution_id
GROUP BY ROLLUP(s.organization_type, inst.name);


-- ----------------------------------------------------------------------------
-- QUERY 9: Food Safety Compliance Audit
-- Flags any deliveries where food temperature dropped below safety standard (< 65°C).
-- ----------------------------------------------------------------------------
SELECT 
    dd.dispatch_id,
    mb.batch_code,
    inst.name AS school_name,
    dr.vehicle_number,
    dr.driver_name,
    mb.food_temp_celsius AS cooking_temp,
    dd.delivery_temp_celsius AS arrival_temp,
    ROUND((mb.food_temp_celsius - dd.delivery_temp_celsius), 1) AS temp_drop_celsius,
    CASE 
        WHEN dd.delivery_temp_celsius < 65.0 THEN 'NON_COMPLIANT_WARNING'
        ELSE 'SAFE_TEMPERATURE'
    END AS safety_compliance
FROM dispatch_deliveries dd
JOIN meal_batches mb ON dd.batch_id = mb.batch_id
JOIN institutions inst ON dd.institution_id = inst.institution_id
JOIN delivery_routes dr ON dd.route_id = dr.route_id
WHERE dd.delivery_temp_celsius IS NOT NULL;


-- ----------------------------------------------------------------------------
-- QUERY 10: Inventory Depletion Velocity & Days of Supply Remaining
-- Calculates daily consumption rate and estimated days before stock runs out.
-- ----------------------------------------------------------------------------
SELECT 
    fi.item_name,
    fi.category,
    fi.uom,
    COALESCE(SUM(si.current_qty), 0) AS current_stock,
    fi.min_stock_threshold,
    ROUND(COALESCE(AVG(st.quantity), 0), 2) AS avg_consumption_per_batch,
    CASE 
        WHEN COALESCE(AVG(st.quantity), 0) = 0 THEN 'NO_RECENT_USAGE'
        ELSE ROUND((COALESCE(SUM(si.current_qty), 0) / NULLIF(AVG(st.quantity), 0)), 1)::TEXT || ' batches'
    END AS estimated_batches_remaining
FROM food_items fi
LEFT JOIN stock_inventory si ON fi.item_id = si.item_id
LEFT JOIN stock_transactions st ON fi.item_id = st.item_id AND st.transaction_type = 'COOKING_CONSUMPTION'
GROUP BY fi.item_id, fi.item_name, fi.category, fi.uom, fi.min_stock_threshold
ORDER BY current_stock ASC;


-- ----------------------------------------------------------------------------
-- QUERY 11: Top 2 Donors Partitioned by Organization Category
-- Uses ROW_NUMBER() OVER (PARTITION BY ...) to identify top benefactors.
-- ----------------------------------------------------------------------------
WITH RankedDonors AS (
    SELECT 
        s.organization_type,
        s.name AS sponsor_name,
        SUM(d.amount_inr) AS total_donated,
        ROW_NUMBER() OVER (
            PARTITION BY s.organization_type 
            ORDER BY SUM(d.amount_inr) DESC
        ) AS category_rank
    FROM sponsors s
    JOIN donations d ON s.sponsor_id = d.sponsor_id
    GROUP BY s.organization_type, s.name
)
SELECT organization_type, sponsor_name, total_donated, category_rank
FROM RankedDonors
WHERE category_rank <= 2
ORDER BY organization_type, category_rank;


-- ----------------------------------------------------------------------------
-- QUERY 12: Next Day BOM Ingredient Forecast Simulator
-- Computes exact raw ingredients required if tomorrow's menu is Bisi Bele Bath (Menu ID 2)
-- for an estimated total demand of 5,000 students.
-- ----------------------------------------------------------------------------
SELECT 
    m.menu_name,
    fi.item_name,
    fi.category,
    ri.qty_per_meal,
    5000 AS simulated_meals_count,
    ROUND(ri.qty_per_meal * 5000, 2) AS total_required_qty,
    ri.uom,
    COALESCE(SUM(si.current_qty), 0) AS current_warehouse_qty,
    CASE 
        WHEN COALESCE(SUM(si.current_qty), 0) >= (ri.qty_per_meal * 5000) THEN 'ADEQUATE_STOCK'
        ELSE 'DEFICIT_REQUIRES_PROCUREMENT'
    END AS procurement_status
FROM menus m
JOIN recipe_ingredients ri ON m.menu_id = ri.menu_id
JOIN food_items fi ON ri.item_id = fi.item_id
LEFT JOIN stock_inventory si ON fi.item_id = si.item_id AND si.current_qty > 0
WHERE m.menu_id = 2
GROUP BY m.menu_name, fi.item_name, fi.category, ri.qty_per_meal, ri.uom
ORDER BY total_required_qty DESC;
