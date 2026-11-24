-- ============================================================================
-- AKSHAYA PATRA FOOD DISTRIBUTION MANAGEMENT SYSTEM
-- Realistic Production-Grade Seed Data (Indian Mega-Kitchen Operations)
-- ============================================================================

-- 1. MASTER FOOD ITEMS
INSERT INTO food_items (item_id, item_name, category, uom, min_stock_threshold, shelf_life_days) VALUES
(1, 'Sona Masoori Raw Rice', 'GRAIN', 'KG', 500.00, 180),
(2, 'Premium Toor Dal (Pigeon Pea)', 'PULSE', 'KG', 200.00, 120),
(3, 'Yellow Moong Dal (Split)', 'PULSE', 'KG', 150.00, 120),
(4, 'Farm Fresh Vegetables (Carrot, Beans, Drumstick)', 'VEGETABLE', 'KG', 300.00, 4),
(5, 'Cooking Potatoes & Onions', 'VEGETABLE', 'KG', 250.00, 14),
(6, 'Country Tomatoes', 'VEGETABLE', 'KG', 150.00, 5),
(7, 'Refined Sunflower Cooking Oil', 'OIL_SPICE', 'LITER', 100.00, 90),
(8, 'Whole Spices (Mustard, Cumin, Fenugreek)', 'OIL_SPICE', 'KG', 30.00, 180),
(9, 'Akshaya Patra Sambar Masala Powder', 'CONDIMENT', 'KG', 50.00, 90),
(10, 'Fresh Pasteurized Curd (Yogurt)', 'DAIRY', 'LITER', 200.00, 3),
(11, 'Iodized Cooking Salt', 'CONDIMENT', 'KG', 80.00, 365)
ON CONFLICT (item_id) DO NOTHING;

SELECT setval('food_items_item_id_seq', (SELECT MAX(item_id) FROM food_items));

-- 2. WAREHOUSE INVENTORY BATCHES (Substantial quantities so cooking batches succeed)
INSERT INTO stock_inventory (stock_id, item_id, batch_number, received_date, expiry_date, initial_qty, current_qty, unit_price_inr, storage_location) VALUES
(1, 1, 'BATCH-RICE-2026-11A', CURRENT_DATE - 5, CURRENT_DATE + 175, 5000.00, 5000.00, 42.50, 'Silo A-1 (Main Grain Silo)'),
(2, 2, 'BATCH-TOOR-2026-11A', CURRENT_DATE - 5, CURRENT_DATE + 115, 2000.00, 2000.00, 125.00, 'Rack P-2 (Pulse Storage)'),
(3, 3, 'BATCH-MOONG-2026-11A', CURRENT_DATE - 4, CURRENT_DATE + 116, 1500.00, 1500.00, 110.00, 'Rack P-3 (Pulse Storage)'),
(4, 4, 'BATCH-VEG-2026-11B', CURRENT_DATE, CURRENT_DATE + 4, 1800.00, 1800.00, 35.00, 'Cold Storage Vault 1'),
(5, 5, 'BATCH-POTATO-2026-11A', CURRENT_DATE - 2, CURRENT_DATE + 12, 1200.00, 1200.00, 28.00, 'Dry Produce Cellar'),
(6, 6, 'BATCH-TOMATO-2026-11B', CURRENT_DATE, CURRENT_DATE + 5, 1000.00, 1000.00, 32.00, 'Cold Storage Vault 2'),
(7, 7, 'BATCH-OIL-2026-10C', CURRENT_DATE - 15, CURRENT_DATE + 75, 800.00, 800.00, 130.00, 'Oil Drum Section'),
(8, 8, 'BATCH-SPICE-2026-10A', CURRENT_DATE - 20, CURRENT_DATE + 160, 250.00, 250.00, 240.00, 'Spice Vault'),
(9, 9, 'BATCH-MASALA-2026-11A', CURRENT_DATE - 6, CURRENT_DATE + 84, 400.00, 400.00, 180.00, 'Spice Vault'),
(10, 10, 'BATCH-CURD-2026-11B', CURRENT_DATE, CURRENT_DATE + 3, 1200.00, 1200.00, 45.00, 'Chilled Dairy Tank D-1'),
(11, 11, 'BATCH-SALT-2026-09A', CURRENT_DATE - 60, CURRENT_DATE + 305, 1000.00, 1000.00, 18.00, 'Dry Storage Rack S-1')
ON CONFLICT (stock_id) DO NOTHING;

SELECT setval('stock_inventory_stock_id_seq', (SELECT MAX(stock_id) FROM stock_inventory));

-- Log Initial Procurement Transactions
INSERT INTO stock_transactions (stock_id, item_id, transaction_type, quantity, logged_by, remarks) VALUES
(1, 1, 'PROCUREMENT', 5000.00, 'Procurement Officer Rakesh', 'Monthly APMC Rice intake'),
(2, 2, 'PROCUREMENT', 2000.00, 'Procurement Officer Rakesh', 'Dal direct farm procurement'),
(4, 4, 'PROCUREMENT', 1800.00, 'Quality Inspector Divya', 'Morning fresh harvest intake'),
(10, 10, 'PROCUREMENT', 1200.00, 'Quality Inspector Divya', 'KMF Nandini Dairy delivery');

-- 3. MENUS
INSERT INTO menus (menu_id, menu_name, meal_category, description, standard_calories, is_active) VALUES
(1, 'Nutritious Sambar Rice & Curd', 'REGULAR_LUNCH', 'Steamed Sona Masoori rice served with vegetable-rich drumstick toor dal sambar and fresh curd.', 580, TRUE),
(2, 'Traditional Karnataka Bisi Bele Bath', 'REGULAR_LUNCH', 'Wholesome rice, lentils, and mixed farm vegetables cooked with aromatic ghee and spices.', 620, TRUE),
(3, 'Vegetable Pulao with Moong Dal Tadka', 'NUTRITION_BOOST', 'Mild spiced cumin vegetable rice paired with high-protein yellow moong dal gravy.', 550, TRUE),
(4, 'Festive Sweet Pongal & Savory Feast', 'SPECIAL_FESTIVE', 'Jaggery-infused sweet rice preparation served during festival celebrations with festive meal.', 680, TRUE)
ON CONFLICT (menu_id) DO NOTHING;

SELECT setval('menus_menu_id_seq', (SELECT MAX(menu_id) FROM menus));

-- 4. RECIPE INGREDIENTS (BOM - Bill of Materials per meal)
-- Menu 1: Sambar Rice & Curd
INSERT INTO recipe_ingredients (menu_id, item_id, qty_per_meal, uom) VALUES
(1, 1, 0.0800, 'KG'),      -- 80g Rice
(1, 2, 0.0250, 'KG'),      -- 25g Toor Dal
(1, 4, 0.0400, 'KG'),      -- 40g Mixed Veggies
(1, 6, 0.0150, 'KG'),      -- 15g Tomatoes
(1, 7, 0.0060, 'LITER'),   -- 6ml Oil
(1, 9, 0.0040, 'KG'),      -- 4g Sambar Masala
(1, 10, 0.0500, 'LITER'),  -- 50ml Curd
(1, 11, 0.0030, 'KG')      -- 3g Salt
ON CONFLICT (menu_id, item_id) DO NOTHING;

-- Menu 2: Bisi Bele Bath
INSERT INTO recipe_ingredients (menu_id, item_id, qty_per_meal, uom) VALUES
(2, 1, 0.0750, 'KG'),
(2, 2, 0.0280, 'KG'),
(2, 4, 0.0450, 'KG'),
(2, 5, 0.0200, 'KG'),
(2, 7, 0.0080, 'LITER'),
(2, 8, 0.0030, 'KG'),
(2, 9, 0.0050, 'KG'),
(2, 11, 0.0035, 'KG')
ON CONFLICT (menu_id, item_id) DO NOTHING;

-- 5. DELIVERY ROUTES
INSERT INTO delivery_routes (route_id, route_code, route_name, vehicle_number, driver_name, driver_phone, max_capacity_meals) VALUES
(1, 'RT-NORTH-01', 'Rajajinagar & Malleshwaram Corridor', 'KA-04-AP-1001', 'Manjunath K', '9845012345', 3500),
(2, 'RT-SOUTH-02', 'Jayanagar & Basavanagudi Schools', 'KA-05-AP-2002', 'Venkatesh R', '9845023456', 4000),
(3, 'RT-EAST-03', 'Indiranagar & Ulsoor Educational Zone', 'KA-03-AP-3003', 'Suresh Gowda', '9845034567', 3000),
(4, 'RT-WEST-04', 'Yeshwanthpur & Peenya Belt', 'KA-02-AP-4004', 'Anand Kumar', '9845045678', 4500)
ON CONFLICT (route_id) DO NOTHING;

SELECT setval('delivery_routes_route_id_seq', (SELECT MAX(route_id) FROM delivery_routes));

-- 6. INSTITUTIONS (Schools Served)
INSERT INTO institutions (institution_id, school_code, name, institution_type, route_id, principal_name, phone, email, address, total_enrolled) VALUES
(1, 'SCH-BLR-001', 'Government Higher Primary School, Rajajinagar', 'GOVERNMENT_PRIMARY', 1, 'Dr. Geetha Kumari', '080-23321100', 'ghps.rajaji@karnataka.gov.in', '3rd Block, Rajajinagar, Bangalore - 560010', 480),
(2, 'SCH-BLR-002', 'Malleshwaram Govt High School for Girls', 'GOVERNMENT_HIGH_SCHOOL', 1, 'Mrs. Pushpa Narayana', '080-23342211', 'gghs.malleshm@karnataka.gov.in', '15th Cross, Malleshwaram, Bangalore - 560003', 620),
(3, 'SCH-BLR-003', 'National Composite High School, Basavanagudi', 'AIDED_SCHOOL', 2, 'Sri S. Krishnamurthy', '080-26613322', 'nchs.basavanagudi@edu.in', 'Near Gandhi Bazaar, Basavanagudi, Bangalore - 560004', 750),
(4, 'SCH-BLR-004', 'Jayanagar Model Primary School', 'GOVERNMENT_PRIMARY', 2, 'Mr. B. M. Siddaramaiah', '080-26634433', 'jmps.jayanagar@karnataka.gov.in', '9th Main, 4th Block Jayanagar, Bangalore - 560011', 510),
(5, 'SCH-BLR-005', 'Halasuru Tamil Government Higher Primary School', 'GOVERNMENT_PRIMARY', 3, 'Mrs. V. Revathi', '080-25555544', 'halasuru.primary@karnataka.gov.in', 'Someshwara Temple Rd, Halasuru, Bangalore - 560008', 390),
(6, 'SCH-BLR-006', 'Indiranagar Composite College & High School', 'COLLEGE_HOSTEL', 3, 'Prof. Mohan Deshpande', '080-25286655', 'indiranagar.college@edu.in', '100ft Road, Indiranagar, Bangalore - 560038', 840),
(7, 'SCH-BLR-007', 'Peenya Industrial Town Government School', 'GOVERNMENT_PRIMARY', 4, 'Mrs. Shailaja Hegde', '080-28397766', 'peenya.primary@karnataka.gov.in', 'Phase 2, Peenya Industrial Area, Bangalore - 560058', 560),
(8, 'SCH-BLR-008', 'Yeshwanthpur Railway Colony Public School', 'AIDED_SCHOOL', 4, 'Mr. R. Raghavan', '080-23478877', 'yrps.railway@edu.in', 'Railway Colony, Yeshwanthpur, Bangalore - 560022', 680)
ON CONFLICT (institution_id) DO NOTHING;

SELECT setval('institutions_institution_id_seq', (SELECT MAX(institution_id) FROM institutions));

-- 7. DAILY INDENTS (Daily Demand & Wastage)
INSERT INTO daily_indents (indent_id, institution_id, indent_date, requested_meals, actual_present_students, leftover_meals, wastage_reason, status) VALUES
(1, 1, CURRENT_DATE, 460, 448, 12, '12 students absent due to rain', 'APPROVED'),
(2, 2, CURRENT_DATE, 590, 582, 8, 'Students on sports field', 'APPROVED'),
(3, 3, CURRENT_DATE, 710, 705, 5, 'Marginal absence', 'APPROVED'),
(4, 4, CURRENT_DATE, 490, 480, 10, 'Normal fluctuations', 'APPROVED'),
(5, 5, CURRENT_DATE, 370, 362, 8, 'Absenteeism', 'APPROVED'),
(6, 6, CURRENT_DATE, 810, 800, 10, 'Hostel students exam leave', 'APPROVED'),
(7, 7, CURRENT_DATE, 530, 515, 15, 'Seasonal sickness', 'APPROVED'),
(8, 8, CURRENT_DATE, 650, 640, 10, 'Absenteeism', 'APPROVED')
ON CONFLICT (indent_id) DO NOTHING;

SELECT setval('daily_indents_indent_id_seq', (SELECT MAX(indent_id) FROM daily_indents));

-- 8. MEAL BATCHES (Production runs)
-- Inserting directly as COOKING first, then updating to COMPLETED so the inventory deduction trigger fires!
INSERT INTO meal_batches (batch_id, batch_code, menu_id, prep_date, cooking_start_time, target_servings, actual_servings, food_temp_celsius, head_cook_name, status, quality_inspected) VALUES
(1, 'BATCH-BLR-20261124-01', 1, CURRENT_DATE, NOW() - INTERVAL '3 hours', 3000, 3000, 82.5, 'Master Chef N. R. Narayana', 'COOKING', TRUE),
(2, 'BATCH-BLR-20261124-02', 2, CURRENT_DATE, NOW() - INTERVAL '2 hours', 2500, 2500, 79.0, 'Chef S. Somasekhar', 'COOKING', TRUE)
ON CONFLICT (batch_id) DO NOTHING;

SELECT setval('meal_batches_batch_id_seq', (SELECT MAX(batch_id) FROM meal_batches));

-- Complete Batch 1 (Triggers automatic inventory deduction for Sambar Rice)
UPDATE meal_batches
SET status = 'COMPLETED', cooking_end_time = NOW() - INTERVAL '1 hour'
WHERE batch_id = 1 AND status != 'COMPLETED';

-- Complete Batch 2 (Triggers automatic inventory deduction for Bisi Bele Bath)
UPDATE meal_batches
SET status = 'COMPLETED', cooking_end_time = NOW() - INTERVAL '30 minutes'
WHERE batch_id = 2 AND status != 'COMPLETED';

-- 9. DISPATCH DELIVERIES
INSERT INTO dispatch_deliveries (dispatch_id, batch_id, route_id, institution_id, dispatch_date, meals_dispatched, departure_time, arrival_time, delivery_temp_celsius, received_by_signature, delivery_status, notes) VALUES
(1, 1, 1, 1, CURRENT_DATE, 460, NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '45 minutes', 68.5, 'Dr. Geetha Kumari', 'DELIVERED', 'Delivered hot and on schedule'),
(2, 1, 1, 2, CURRENT_DATE, 590, NOW() - INTERVAL '90 minutes', NOW() - INTERVAL '35 minutes', 67.0, 'Mrs. Pushpa Narayana', 'DELIVERED', 'Inspected by school food committee'),
(3, 1, 2, 3, CURRENT_DATE, 710, NOW() - INTERVAL '80 minutes', NOW() - INTERVAL '20 minutes', 66.5, 'Sri S. Krishnamurthy', 'DELIVERED', 'Good quality verified'),
(4, 1, 2, 4, CURRENT_DATE, 490, NOW() - INTERVAL '80 minutes', NOW() - INTERVAL '15 minutes', 65.8, 'Mr. B. M. Siddaramaiah', 'DELIVERED', 'All containers sealed'),
(5, 2, 3, 5, CURRENT_DATE, 370, NOW() - INTERVAL '60 minutes', NULL, 71.0, NULL, 'IN_TRANSIT', 'Van nearing Halasuru'),
(6, 2, 3, 6, CURRENT_DATE, 810, NOW() - INTERVAL '60 minutes', NULL, 71.5, NULL, 'IN_TRANSIT', 'Van en route to Indiranagar'),
(7, 2, 4, 7, CURRENT_DATE, 530, NOW() - INTERVAL '40 minutes', NULL, NULL, NULL, 'SCHEDULED', 'Awaiting van departure'),
(8, 2, 4, 8, CURRENT_DATE, 650, NOW() - INTERVAL '40 minutes', NULL, NULL, NULL, 'SCHEDULED', 'Containers loaded')
ON CONFLICT (dispatch_id) DO NOTHING;

SELECT setval('dispatch_deliveries_dispatch_id_seq', (SELECT MAX(dispatch_id) FROM dispatch_deliveries));

-- 10. SPONSORS (Donors & CSR Partners)
INSERT INTO sponsors (sponsor_id, name, organization_type, pan_number, email, phone, address) VALUES
(1, 'Sudha Gopalakrishnan Charitable Trust', 'TRUST_FOUNDATION', 'AAATS1234F', 'contact@sgtrust.org', '080-41128899', 'Koramangala 3rd Block, Bangalore'),
(2, 'Infosys Foundation CSR Initiative', 'CORPORATE_CSR', 'AAACI5678K', 'csr@infosys.com', '080-28520261', 'Electronics City Phase 1, Bangalore'),
(3, 'Wipro Cares Foundation', 'CORPORATE_CSR', 'AAACW9876P', 'wipro.cares@wipro.com', '080-28440011', 'Sarjapur Road, Bangalore'),
(4, 'Dr. K. Radhakrishnan (Ex-ISRO Chairman)', 'INDIVIDUAL', 'ABCPR4321M', 'dr.radhakrishnan@email.com', '9845099881', 'Sadashivanagar, Bangalore'),
(5, 'Azim Premji Philanthropic Initiatives', 'TRUST_FOUNDATION', 'AAATA8765Q', 'initiatives@azimpremjifoundation.org', '080-66144900', 'Bellandur, Bangalore')
ON CONFLICT (sponsor_id) DO NOTHING;

SELECT setval('sponsors_sponsor_id_seq', (SELECT MAX(sponsor_id) FROM sponsors));

-- 11. DONATIONS
INSERT INTO donations (donation_id, sponsor_id, amount_inr, donation_date, payment_mode, earmarked_institution_id, tax_exemption_80g_receipt, donor_notes) VALUES
(1, 1, 500000.00, CURRENT_DATE - 30, 'NEFT_RTGS', 1, '80G-AP-2026-0091', 'Earmarked for Rajajinagar Primary School for 3 months'),
(2, 2, 1500000.00, CURRENT_DATE - 20, 'NEFT_RTGS', 2, '80G-AP-2026-0092', 'CSR support for Malleshwaram Girls High School midday meals'),
(3, 3, 800000.00, CURRENT_DATE - 15, 'ONLINE_GATEWAY', 3, '80G-AP-2026-0093', 'Nutrition boost support for Basavanagudi school students'),
(4, 4, 100000.00, CURRENT_DATE - 10, 'UPI', NULL, '80G-AP-2026-0094', 'General kitchen operations and spice procurement fund'),
(5, 5, 2500000.00, CURRENT_DATE - 5, 'NEFT_RTGS', NULL, '80G-AP-2026-0095', 'Annual central mega-kitchen modern vessel endowment')
ON CONFLICT (donation_id) DO NOTHING;

SELECT setval('donations_donation_id_seq', (SELECT MAX(donation_id) FROM donations));
