-- ============================================================================
-- AKSHAYA PATRA FOOD DISTRIBUTION MANAGEMENT SYSTEM
-- PostgreSQL Relational Database Schema (DDL)
-- ============================================================================
-- Designed for Academic DBMS Excellence: Fully Normalized (BCNF),
-- Strict Referential Integrity, Domain & Tuple Constraints, Performance Indexes.
-- ============================================================================

-- Clean teardown if tables exist (cascade drops dependent constraints/views)
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP TABLE IF EXISTS dispatch_deliveries CASCADE;
DROP TABLE IF EXISTS daily_indents CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;
DROP TABLE IF EXISTS delivery_routes CASCADE;
DROP TABLE IF EXISTS stock_transactions CASCADE;
DROP TABLE IF EXISTS meal_batches CASCADE;
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS stock_inventory CASCADE;
DROP TABLE IF EXISTS food_items CASCADE;

-- ----------------------------------------------------------------------------
-- 1. MASTER FOOD ITEMS CATALOG
-- ----------------------------------------------------------------------------
CREATE TABLE food_items (
    item_id SERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (
        category IN ('GRAIN', 'PULSE', 'VEGETABLE', 'OIL_SPICE', 'DAIRY', 'CONDIMENT')
    ),
    uom VARCHAR(20) NOT NULL CHECK (
        uom IN ('KG', 'LITER', 'GRAM', 'PACKET')
    ),
    min_stock_threshold NUMERIC(10,2) NOT NULL DEFAULT 15.00 CHECK (min_stock_threshold >= 0),
    shelf_life_days INT NOT NULL DEFAULT 30 CHECK (shelf_life_days > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 2. WAREHOUSE STOCK INVENTORY (Batch-Tracked)
-- ----------------------------------------------------------------------------
CREATE TABLE stock_inventory (
    stock_id SERIAL PRIMARY KEY,
    item_id INT NOT NULL REFERENCES food_items(item_id) ON DELETE RESTRICT,
    batch_number VARCHAR(50) NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    initial_qty NUMERIC(10,2) NOT NULL CHECK (initial_qty > 0),
    current_qty NUMERIC(10,2) NOT NULL CHECK (current_qty >= 0),
    unit_price_inr NUMERIC(10,2) NOT NULL CHECK (unit_price_inr >= 0),
    storage_location VARCHAR(100) DEFAULT 'Main Kitchen Warehouse',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_stock_expiry CHECK (expiry_date >= received_date),
    CONSTRAINT chk_stock_qty_integrity CHECK (current_qty <= initial_qty),
    CONSTRAINT uq_item_batch UNIQUE (item_id, batch_number)
);

-- ----------------------------------------------------------------------------
-- 3. FOOD MENUS (Standardized Kitchen Recipes)
-- ----------------------------------------------------------------------------
CREATE TABLE menus (
    menu_id SERIAL PRIMARY KEY,
    menu_name VARCHAR(100) NOT NULL UNIQUE,
    meal_category VARCHAR(30) NOT NULL CHECK (
        meal_category IN ('REGULAR_LUNCH', 'SPECIAL_FESTIVE', 'NUTRITION_BOOST')
    ),
    description TEXT,
    standard_calories INT CHECK (standard_calories > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. RECIPE INGREDIENTS (Bill of Materials - BOM)
-- ----------------------------------------------------------------------------
CREATE TABLE recipe_ingredients (
    recipe_id SERIAL PRIMARY KEY,
    menu_id INT NOT NULL REFERENCES menus(menu_id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES food_items(item_id) ON DELETE RESTRICT,
    qty_per_meal NUMERIC(8,4) NOT NULL CHECK (qty_per_meal > 0), -- in UOM (e.g. 0.0800 kg per meal)
    uom VARCHAR(20) NOT NULL CHECK (uom IN ('KG', 'LITER', 'GRAM')),
    CONSTRAINT uq_menu_item UNIQUE (menu_id, item_id)
);

-- ----------------------------------------------------------------------------
-- 5. MEAL BATCH PRODUCTION (Daily Mega-Kitchen Cooking Runs)
-- ----------------------------------------------------------------------------
CREATE TABLE meal_batches (
    batch_id SERIAL PRIMARY KEY,
    batch_code VARCHAR(50) NOT NULL UNIQUE,
    menu_id INT NOT NULL REFERENCES menus(menu_id) ON DELETE RESTRICT,
    prep_date DATE NOT NULL DEFAULT CURRENT_DATE,
    cooking_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    cooking_end_time TIMESTAMP WITH TIME ZONE,
    target_servings INT NOT NULL CHECK (target_servings > 0),
    actual_servings INT CHECK (actual_servings IS NULL OR actual_servings >= 0),
    food_temp_celsius NUMERIC(5,2) CHECK (
        food_temp_celsius IS NULL OR (food_temp_celsius BETWEEN 50.0 AND 100.0)
    ),
    head_cook_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PLANNED' CHECK (
        status IN ('PLANNED', 'COOKING', 'COMPLETED', 'DISCARDED')
    ),
    quality_inspected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cooking_time CHECK (
        cooking_end_time IS NULL OR cooking_end_time >= cooking_start_time
    )
);

-- ----------------------------------------------------------------------------
-- 6. STOCK TRANSACTIONS LEDGER (Inward & Outward Movements)
-- ----------------------------------------------------------------------------
CREATE TABLE stock_transactions (
    transaction_id SERIAL PRIMARY KEY,
    stock_id INT REFERENCES stock_inventory(stock_id) ON DELETE SET NULL,
    item_id INT NOT NULL REFERENCES food_items(item_id) ON DELETE RESTRICT,
    transaction_type VARCHAR(30) NOT NULL CHECK (
        transaction_type IN ('PROCUREMENT', 'COOKING_CONSUMPTION', 'SPOILAGE_DISPOSAL', 'AUDIT_CORRECTION')
    ),
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    reference_batch_id INT REFERENCES meal_batches(batch_id) ON DELETE SET NULL,
    transaction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    logged_by VARCHAR(100) DEFAULT 'Kitchen Inventory Officer',
    remarks TEXT
);

-- ----------------------------------------------------------------------------
-- 7. DELIVERY ROUTES (Logistics & Fleet)
-- ----------------------------------------------------------------------------
CREATE TABLE delivery_routes (
    route_id SERIAL PRIMARY KEY,
    route_code VARCHAR(30) NOT NULL UNIQUE,
    route_name VARCHAR(100) NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(20) NOT NULL,
    max_capacity_meals INT NOT NULL CHECK (max_capacity_meals > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ----------------------------------------------------------------------------
-- 8. INSTITUTIONS (Schools, Hostels, Colleges Served)
-- ----------------------------------------------------------------------------
CREATE TABLE institutions (
    institution_id SERIAL PRIMARY KEY,
    school_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    institution_type VARCHAR(50) NOT NULL CHECK (
        institution_type IN ('GOVERNMENT_PRIMARY', 'GOVERNMENT_HIGH_SCHOOL', 'AIDED_SCHOOL', 'COLLEGE_HOSTEL')
    ),
    route_id INT REFERENCES delivery_routes(route_id) ON DELETE SET NULL,
    principal_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL DEFAULT 'Bangalore',
    total_enrolled INT NOT NULL CHECK (total_enrolled > 0),
    active_status BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. DAILY INDENTS (Daily Morning Attendance / Meal Requests from Schools)
-- ----------------------------------------------------------------------------
CREATE TABLE daily_indents (
    indent_id SERIAL PRIMARY KEY,
    institution_id INT NOT NULL REFERENCES institutions(institution_id) ON DELETE CASCADE,
    indent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_meals INT NOT NULL CHECK (requested_meals > 0),
    actual_present_students INT CHECK (actual_present_students IS NULL OR actual_present_students >= 0),
    leftover_meals INT DEFAULT 0 CHECK (leftover_meals >= 0),
    submission_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    wastage_reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'APPROVED' CHECK (
        status IN ('PENDING', 'APPROVED', 'REJECTED')
    ),
    CONSTRAINT uq_institution_date_indent UNIQUE (institution_id, indent_date)
);

-- ----------------------------------------------------------------------------
-- 10. DISPATCH DELIVERIES (Logistics Tracking & Handover)
-- ----------------------------------------------------------------------------
CREATE TABLE dispatch_deliveries (
    dispatch_id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL REFERENCES meal_batches(batch_id) ON DELETE RESTRICT,
    route_id INT NOT NULL REFERENCES delivery_routes(route_id) ON DELETE RESTRICT,
    institution_id INT NOT NULL REFERENCES institutions(institution_id) ON DELETE RESTRICT,
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meals_dispatched INT NOT NULL CHECK (meals_dispatched > 0),
    departure_time TIMESTAMP WITH TIME ZONE,
    arrival_time TIMESTAMP WITH TIME ZONE,
    delivery_temp_celsius NUMERIC(5,2) CHECK (
        delivery_temp_celsius IS NULL OR (delivery_temp_celsius BETWEEN 50.0 AND 95.0)
    ),
    received_by_signature VARCHAR(100),
    delivery_status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (
        delivery_status IN ('SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'FAILED')
    ),
    notes TEXT,
    CONSTRAINT chk_delivery_times CHECK (
        arrival_time IS NULL OR departure_time IS NULL OR arrival_time >= departure_time
    )
);

-- ----------------------------------------------------------------------------
-- 11. SPONSORS (Donors & CSR Partners)
-- ----------------------------------------------------------------------------
CREATE TABLE sponsors (
    sponsor_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    organization_type VARCHAR(50) NOT NULL CHECK (
        organization_type IN ('INDIVIDUAL', 'CORPORATE_CSR', 'TRUST_FOUNDATION', 'GOVERNMENT_GRANT')
    ),
    pan_number VARCHAR(20),
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 12. DONATIONS (Financial Ledger & Impact Earmarking)
-- ----------------------------------------------------------------------------
CREATE TABLE donations (
    donation_id SERIAL PRIMARY KEY,
    sponsor_id INT NOT NULL REFERENCES sponsors(sponsor_id) ON DELETE RESTRICT,
    amount_inr NUMERIC(12,2) NOT NULL CHECK (amount_inr > 0),
    donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode VARCHAR(30) NOT NULL CHECK (
        payment_mode IN ('NEFT_RTGS', 'UPI', 'CHEQUE', 'ONLINE_GATEWAY', 'DEMAND_DRAFT')
    ),
    earmarked_institution_id INT REFERENCES institutions(institution_id) ON DELETE SET NULL,
    tax_exemption_80g_receipt VARCHAR(50) NOT NULL UNIQUE,
    donor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PERFORMANCE & INTEGRITY INDEXES
-- ============================================================================
CREATE INDEX idx_stock_item ON stock_inventory(item_id);
CREATE INDEX idx_stock_expiry ON stock_inventory(expiry_date);
CREATE INDEX idx_recipes_menu ON recipe_ingredients(menu_id);
CREATE INDEX idx_batches_date ON meal_batches(prep_date);
CREATE INDEX idx_batches_status ON meal_batches(status);
CREATE INDEX idx_indents_date_inst ON daily_indents(indent_date, institution_id);
CREATE INDEX idx_dispatch_date ON dispatch_deliveries(dispatch_date);
CREATE INDEX idx_dispatch_batch ON dispatch_deliveries(batch_id);
CREATE INDEX idx_donations_sponsor ON donations(sponsor_id);
CREATE INDEX idx_institutions_route ON institutions(route_id);
