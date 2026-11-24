# Specification & Design: Akshaya Patra Food Distribution Management System

**Project Type:** DBMS Subject Awareness & Academic Capstone Project  
**Student:** Rutwik  
**Database Engine:** PostgreSQL 16 (PL/pgSQL)  
**Backend:** Node.js (v25) / Express REST API with `pg` driver  
**Frontend:** React (Vite) + Tailwind CSS + Lucide Icons  
**Target:** Production-grade full-stack web application with complete academic DBMS deliverables (ER Diagram, Normalization, DDL/DML, PL/pgSQL Triggers/Procedures, Complex Queries, and Live Viva Playground).

---

## 1. Problem Statement & Operational Domain

The **Akshaya Patra Foundation** operates centralized mega-kitchens that cook and deliver standardized, nutritious mid-day meals to thousands of government and government-aided schools daily.

### Core Challenges:
1. **Supply Chain & BOM**: Converting raw agricultural commodities (rice, dal, spices, vegetables, oil) into cooked meal portions based on defined recipes.
2. **Dynamic Demand & Attendance**: Schools submit daily morning indents (attendance count) rather than relying on static enrollment numbers.
3. **Logistics & Perishability**: Cooked meals must reach schools within 2-3 hours at safe holding temperatures (≥60°C) via optimized delivery routes.
4. **Food Wastage & Accountability**: Tracking preparation vs. dispatched vs. consumed vs. wasted quantities to eliminate food loss.
5. **Donor Transparency**: Mapping sponsor donations to tangible metrics ("Sponsor X funded 5,000 meals for 3 rural schools in November").

---

## 2. System Architecture & Relational Entities

### 2.1 Entity Model (12 Normalized Tables)

1. **`food_items`** (Master catalog of raw ingredients: item_id, item_name, category, uom, min_stock_threshold, shelf_life_days)
2. **`stock_inventory`** (Warehouse batches: stock_id, item_id, batch_number, received_date, expiry_date, current_qty, unit_price_inr)
3. **`stock_transactions`** (Ledger of inward & outward movements: transaction_id, stock_id, item_id, transaction_type [PROCUREMENT/COOKING_CONSUMPTION/SPOILAGE_DISPOSAL], qty, transaction_date, notes)
4. **`menus`** (Meal recipes: menu_id, menu_name, meal_category [LUNCH/SPECIAL], is_active)
5. **`recipe_ingredients`** (BOM mapping: recipe_id, menu_id, item_id, qty_per_meal, uom)
6. **`meal_batches`** (Cooking production runs: batch_id, menu_id, prep_date, cooking_start, cooking_end, target_servings, actual_servings, food_temp_celsius, head_cook_name, status [COOKING/COMPLETED/DISCARDED])
7. **`delivery_routes`** (Logistics paths: route_id, route_name, vehicle_number, driver_name, driver_phone, max_capacity_meals)
8. **`institutions`** (Schools/Colleges: institution_id, route_id, name, school_code, institution_type [PRIMARY/SECONDARY/COMPOSITE], principal_name, phone, email, address, total_enrolled)
9. **`daily_indents`** (Daily demand from schools: indent_id, institution_id, indent_date, requested_meals, actual_present_students, leftover_meals, reason_for_wastage)
10. **`dispatch_deliveries`** (Delivery tracking: dispatch_id, batch_id, route_id, institution_id, meals_dispatched, departure_time, arrival_time, delivery_temp_celsius, received_by_signature, delivery_status [SCHEDULED/DISPATCHED/DELIVERED/FAILED])
11. **`sponsors`** (Donor profiles: sponsor_id, name, org_name, pan_number, email, phone, address)
12. **`donations`** (Financial ledger: donation_id, sponsor_id, amount_inr, donation_date, payment_mode, earmarked_institution_id, tax_receipt_no, notes)

---

## 3. Relational Schema & Normalization (1NF -> 2NF -> 3NF -> BCNF)

- **1NF**: Atomic attributes, no repeating groups. All fields are single-valued; composite primary keys decomposed.
- **2NF**: No partial functional dependencies. In tables like `recipe_ingredients`, the non-key attributes (`qty_per_meal`) depend on the whole composite candidate key (`menu_id`, `item_id`).
- **3NF**: No transitive functional dependencies. Attributes like `driver_name` are kept in `delivery_routes`, not duplicated in `dispatch_deliveries` or `institutions`. `item_name` and `uom` reside in `food_items`, not duplicated across inventory tables.
- **BCNF**: Every determinant is a candidate key.

---

## 4. PL/pgSQL Triggers, Procedures, and Functions

### Triggers:
1. **`trg_deduct_inventory_on_batch_completion`**:
   - Fires `AFTER UPDATE ON meal_batches` when `status` transitions to `'COMPLETED'`.
   - Iterates through `recipe_ingredients` for the batch's `menu_id`.
   - Validates that sufficient inventory exists across non-expired stock batches (FIFO logic).
   - Decrements stock from `stock_inventory` and logs audit entries in `stock_transactions`.
   - Raises an exception (`RAISE EXCEPTION`) if stock is insufficient, rolling back the transaction.
2. **`trg_prevent_over_dispatch`**:
   - Fires `BEFORE INSERT OR UPDATE ON dispatch_deliveries`.
   - Asserts that total `meals_dispatched` for `batch_id` does not exceed `meal_batches.actual_servings`.
3. **`trg_low_stock_audit`**:
   - Fires `AFTER UPDATE ON stock_inventory`.
   - Checks if `current_qty <= food_items.min_stock_threshold` and records a notification flag.

### Stored Procedures & Functions:
1. **`sp_auto_generate_daily_dispatch(p_date DATE)`**:
   - Reads all approved `daily_indents` for `p_date`.
   - Matches with corresponding ready `meal_batches`.
   - Populates `dispatch_deliveries` mapped to school `route_id`s.
2. **`fn_school_wastage_report(p_start_date DATE, p_end_date DATE)`**:
   - Returns a table calculating percentage of meal wastage per institution.
3. **`fn_get_donor_impact_summary(p_sponsor_id INT)`**:
   - Computes total donated, meals subsidized (using standard INR per meal), and schools benefited.

---

## 5. User Interface Modules & Pages

1. **Executive Dashboard**: Real-time KPI counters (Meals Cooked Today, Dispatched, Schools Served, Active Low-Stock Alerts, Total Donations).
2. **Food Menu & Recipe Builder**: Visual recipe manager showing ingredient proportions per meal.
3. **Warehouse Inventory**: Real-time stock levels, expiry indicators, inward procurement form, transaction ledger.
4. **Kitchen Production & Batches**: Batch scheduler with 1-click "Complete Cooking" that triggers live PL/pgSQL inventory deduction.
5. **Logistics & School Deliveries**: Route mapping, dispatch logging, delivery status tracking with temperature recording.
6. **Institutions & Daily Indent**: School directory with daily attendance and leftover meal reporting.
7. **Sponsors & Donations**: Donor registry, donation entry, and donor impact certificate generator.
8. **DBMS Viva & Academic Playground**:
   - Interactive SQL query runner with pre-loaded queries (JOINs, Window Functions, Triggers, Views).
   - Full ER Diagram visualizer (Mermaid & ASCII).
   - Step-by-step Normalization proofs (1NF to BCNF).
   - Trigger & Procedure source code inspector with execution tests.

---

## 6. Verification & Quality Plan

- Automated database setup and migration scripts.
- Unit testing for all triggers and stored procedures via SQL test suites.
- End-to-end API testing for CRUD and procedural endpoints.
- Subagent verification for relational integrity, frontend responsiveness, and DBMS academic criteria.
