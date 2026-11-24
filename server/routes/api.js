const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper wrapper for async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error('API Error:', err.message);
    res.status(400).json({
      error: err.message,
      detail: err.detail || null,
      code: err.code || 'DB_ERROR'
    });
  });
};

// ============================================================================
// 1. DASHBOARD & KPI STATS
// ============================================================================
router.get('/dashboard/stats', asyncHandler(async (req, res) => {
  const [mealsRes, dispatchRes, schoolsRes, alertRes, donationRes] = await Promise.all([
    db.query(`SELECT COALESCE(SUM(actual_servings), 0) AS total_cooked_today, COUNT(*) AS batches_count FROM meal_batches WHERE prep_date = CURRENT_DATE AND status = 'COMPLETED'`),
    db.query(`SELECT COALESCE(SUM(meals_dispatched), 0) AS total_dispatched_today, COUNT(DISTINCT institution_id) AS schools_delivered_today FROM dispatch_deliveries WHERE dispatch_date = CURRENT_DATE`),
    db.query(`SELECT COUNT(*) AS total_schools, COALESCE(SUM(total_enrolled), 0) AS total_students FROM institutions WHERE active_status = TRUE`),
    db.query(`SELECT COUNT(*) AS low_stock_count FROM v_low_stock_alerts WHERE stock_health_status != 'NORMAL'`),
    db.query(`SELECT COALESCE(SUM(amount_inr), 0) AS total_donations_inr, COUNT(*) AS donations_count FROM donations`)
  ]);

  const recentBatches = await db.query(`
    SELECT mb.*, m.menu_name 
    FROM meal_batches mb 
    JOIN menus m ON mb.menu_id = m.menu_id 
    ORDER BY mb.prep_date DESC, mb.batch_id DESC LIMIT 5
  `);

  const liveDispatches = await db.query(`
    SELECT * FROM v_school_distribution_status LIMIT 6
  `);

  res.json({
    kpis: {
      totalCookedToday: parseInt(mealsRes.rows[0].total_cooked_today, 10),
      batchesToday: parseInt(mealsRes.rows[0].batches_count, 10),
      totalDispatchedToday: parseInt(dispatchRes.rows[0].total_dispatched_today, 10),
      schoolsDeliveredToday: parseInt(dispatchRes.rows[0].schools_delivered_today, 10),
      totalSchools: parseInt(schoolsRes.rows[0].total_schools, 10),
      totalStudents: parseInt(schoolsRes.rows[0].total_students, 10),
      lowStockAlerts: parseInt(alertRes.rows[0].low_stock_count, 10),
      totalDonationsInr: parseFloat(donationRes.rows[0].total_donations_inr),
      donationsCount: parseInt(donationRes.rows[0].donations_count, 10)
    },
    recentBatches: recentBatches.rows,
    liveDispatches: liveDispatches.rows
  });
}));

// ============================================================================
// 2. MASTER FOOD ITEMS & STOCK INVENTORY
// ============================================================================
router.get('/items', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT fi.*, 
           COALESCE(SUM(si.current_qty), 0) AS total_available_stock,
           CASE 
             WHEN COALESCE(SUM(si.current_qty), 0) <= fi.min_stock_threshold THEN true 
             ELSE false 
           END AS is_low_stock
    FROM food_items fi
    LEFT JOIN stock_inventory si ON fi.item_id = si.item_id AND si.current_qty > 0 AND si.expiry_date >= CURRENT_DATE
    GROUP BY fi.item_id
    ORDER BY fi.item_id ASC
  `);
  res.json(result.rows);
}));

router.post('/items', asyncHandler(async (req, res) => {
  const { item_name, category, uom, min_stock_threshold, shelf_life_days } = req.body;
  const result = await db.query(`
    INSERT INTO food_items (item_name, category, uom, min_stock_threshold, shelf_life_days)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [item_name, category, uom, min_stock_threshold || 15.0, shelf_life_days || 30]);
  res.status(201).json(result.rows[0]);
}));

router.get('/stock', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT si.*, fi.item_name, fi.category, fi.uom,
           (si.expiry_date - CURRENT_DATE) AS days_until_expiry
    FROM stock_inventory si
    JOIN food_items fi ON si.item_id = fi.item_id
    ORDER BY si.expiry_date ASC, si.stock_id DESC
  `);
  res.json(result.rows);
}));

router.post('/stock/procure', asyncHandler(async (req, res) => {
  const { item_id, batch_number, quantity, unit_price, shelf_life_days, logged_by, remarks } = req.body;
  
  // Call Stored Procedure
  const result = await db.query(`
    CALL sp_procure_stock($1, $2, $3, $4, $5, $6, $7, NULL)
  `, [
    item_id,
    batch_number || `BATCH-${Date.now().toString().slice(-6)}`,
    quantity,
    unit_price,
    shelf_life_days || 30,
    logged_by || 'Kitchen Manager',
    remarks || 'Direct Warehouse Procurement'
  ]);
  
  res.status(201).json({ message: 'Stock procured successfully via sp_procure_stock', result: result.rows });
}));

router.get('/stock/transactions', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT st.*, fi.item_name, fi.uom, mb.batch_code
    FROM stock_transactions st
    JOIN food_items fi ON st.item_id = fi.item_id
    LEFT JOIN meal_batches mb ON st.reference_batch_id = mb.batch_id
    ORDER BY st.transaction_timestamp DESC
    LIMIT 50
  `);
  res.json(result.rows);
}));

// ============================================================================
// 3. MENUS & RECIPES (BOM)
// ============================================================================
router.get('/menus', asyncHandler(async (req, res) => {
  const menus = await db.query(`SELECT * FROM menus ORDER BY menu_id ASC`);
  const ingredients = await db.query(`
    SELECT ri.*, fi.item_name, fi.category, fi.uom AS item_uom
    FROM recipe_ingredients ri
    JOIN food_items fi ON ri.item_id = fi.item_id
    ORDER BY ri.menu_id, ri.recipe_id
  `);

  const menusWithRecipes = menus.rows.map(m => ({
    ...m,
    ingredients: ingredients.rows.filter(i => i.menu_id === m.menu_id)
  }));

  res.json(menusWithRecipes);
}));

router.post('/menus', asyncHandler(async (req, res) => {
  const { menu_name, meal_category, description, standard_calories, ingredients } = req.body;
  
  // Begin transaction
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const menuRes = await client.query(`
      INSERT INTO menus (menu_name, meal_category, description, standard_calories)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [menu_name, meal_category, description, standard_calories]);
    
    const newMenuId = menuRes.rows[0].menu_id;

    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        await client.query(`
          INSERT INTO recipe_ingredients (menu_id, item_id, qty_per_meal, uom)
          VALUES ($1, $2, $3, $4)
        `, [newMenuId, ing.item_id, ing.qty_per_meal, ing.uom]);
      }
    }
    await client.query('COMMIT');
    res.status(201).json(menuRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// ============================================================================
// 4. MEAL BATCH PRODUCTION & PL/pgSQL TRIGGER TRIGGERING
// ============================================================================
router.get('/batches', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT mb.*, m.menu_name, m.meal_category,
           COALESCE(SUM(dd.meals_dispatched), 0) AS total_dispatched_so_far
    FROM meal_batches mb
    JOIN menus m ON mb.menu_id = m.menu_id
    LEFT JOIN dispatch_deliveries dd ON mb.batch_id = dd.batch_id
    GROUP BY mb.batch_id, m.menu_name, m.meal_category
    ORDER BY mb.prep_date DESC, mb.batch_id DESC
  `);
  res.json(result.rows);
}));

router.post('/batches', asyncHandler(async (req, res) => {
  const { menu_id, target_servings, head_cook_name, prep_date } = req.body;
  const batch_code = `BATCH-BLR-${Date.now().toString().slice(-8)}`;
  
  const result = await db.query(`
    INSERT INTO meal_batches (
      batch_code, menu_id, prep_date, cooking_start_time, target_servings, head_cook_name, status
    ) VALUES ($1, $2, COALESCE($3, CURRENT_DATE), NOW(), $4, $5, 'COOKING')
    RETURNING *
  `, [batch_code, menu_id, prep_date || null, target_servings, head_cook_name || 'Chef S. Somasekhar']);

  res.status(201).json(result.rows[0]);
}));

router.put('/batches/:id/complete', asyncHandler(async (req, res) => {
  const batchId = req.params.id;
  const { actual_servings, food_temp_celsius } = req.body;

  // This UPDATE fires 'trg_deduct_inventory' on meal_batches!
  // If stock is insufficient, PostgreSQL raises EXCEPTION and rolls back!
  const result = await db.query(`
    UPDATE meal_batches
    SET status = 'COMPLETED',
        actual_servings = $1,
        food_temp_celsius = $2,
        cooking_end_time = NOW(),
        quality_inspected = TRUE
    WHERE batch_id = $3
    RETURNING *
  `, [actual_servings, food_temp_celsius || 81.5, batchId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  res.json({
    message: 'Batch completed successfully! Inventory auto-deducted via PL/pgSQL Trigger.',
    batch: result.rows[0]
  });
}));

// ============================================================================
// 5. DELIVERY ROUTES & DISPATCH MANAGEMENT
// ============================================================================
router.get('/routes', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT dr.*, 
           COUNT(DISTINCT inst.institution_id) AS total_schools_assigned,
           COALESCE(SUM(inst.total_enrolled), 0) AS total_students_covered
    FROM delivery_routes dr
    LEFT JOIN institutions inst ON dr.route_id = inst.route_id AND inst.active_status = TRUE
    GROUP BY dr.route_id
    ORDER BY dr.route_id ASC
  `);
  res.json(result.rows);
}));

router.get('/dispatches', asyncHandler(async (req, res) => {
  const result = await db.query(`SELECT * FROM v_school_distribution_status`);
  res.json(result.rows);
}));

router.post('/dispatches', asyncHandler(async (req, res) => {
  const { batch_id, route_id, institution_id, meals_dispatched, notes } = req.body;

  // This INSERT fires 'trg_prevent_over_dispatch'!
  const result = await db.query(`
    INSERT INTO dispatch_deliveries (
      batch_id, route_id, institution_id, meals_dispatched, departure_time, delivery_status, notes
    ) VALUES ($1, $2, $3, $4, NOW(), 'SCHEDULED', $5)
    RETURNING *
  `, [batch_id, route_id, institution_id, meals_dispatched, notes]);

  res.status(201).json(result.rows[0]);
}));

router.post('/dispatches/auto-generate', asyncHandler(async (req, res) => {
  const { date, batch_id } = req.body;
  const result = await db.query(`
    CALL sp_auto_generate_daily_dispatch($1, $2, NULL)
  `, [date || new Date().toISOString().slice(0, 10), batch_id]);
  
  res.json({ message: 'Auto dispatch generation completed', result: result.rows });
}));

router.put('/dispatches/:id/status', asyncHandler(async (req, res) => {
  const dispatchId = req.params.id;
  const { delivery_status, delivery_temp_celsius, received_by_signature, notes } = req.body;

  const result = await db.query(`
    UPDATE dispatch_deliveries
    SET delivery_status = $1,
        delivery_temp_celsius = COALESCE($2, delivery_temp_celsius),
        received_by_signature = COALESCE($3, received_by_signature),
        arrival_time = CASE WHEN $1 = 'DELIVERED' THEN NOW() ELSE arrival_time END,
        notes = COALESCE($4, notes)
    WHERE dispatch_id = $5
    RETURNING *
  `, [delivery_status, delivery_temp_celsius, received_by_signature, notes, dispatchId]);

  res.json(result.rows[0]);
}));

// ============================================================================
// 6. INSTITUTIONS & DAILY INDENTS
// ============================================================================
router.get('/institutions', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT inst.*, dr.route_name, dr.route_code, dr.driver_name, dr.driver_phone,
           fn_school_wastage_rate(inst.institution_id, 30) AS wastage_rate_pct
    FROM institutions inst
    LEFT JOIN delivery_routes dr ON inst.route_id = dr.route_id
    ORDER BY inst.institution_id ASC
  `);
  res.json(result.rows);
}));

router.post('/institutions', asyncHandler(async (req, res) => {
  const { school_code, name, institution_type, route_id, principal_name, phone, email, address, total_enrolled } = req.body;
  const result = await db.query(`
    INSERT INTO institutions (school_code, name, institution_type, route_id, principal_name, phone, email, address, total_enrolled)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [school_code, name, institution_type, route_id, principal_name, phone, email, address, total_enrolled]);
  res.status(201).json(result.rows[0]);
}));

router.get('/indents', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT di.*, inst.name AS school_name, inst.school_code, inst.total_enrolled
    FROM daily_indents di
    JOIN institutions inst ON di.institution_id = inst.institution_id
    ORDER BY di.indent_date DESC, di.indent_id DESC
  `);
  res.json(result.rows);
}));

router.post('/indents', asyncHandler(async (req, res) => {
  const { institution_id, indent_date, requested_meals } = req.body;
  const result = await db.query(`
    INSERT INTO daily_indents (institution_id, indent_date, requested_meals, status)
    VALUES ($1, COALESCE($2, CURRENT_DATE), $3, 'APPROVED')
    RETURNING *
  `, [institution_id, indent_date || null, requested_meals]);
  res.status(201).json(result.rows[0]);
}));

router.put('/indents/:id/leftovers', asyncHandler(async (req, res) => {
  const indentId = req.params.id;
  const { actual_present_students, wastage_reason } = req.body;

  // This UPDATE fires 'trg_audit_leftovers'!
  const result = await db.query(`
    UPDATE daily_indents
    SET actual_present_students = $1,
        wastage_reason = $2
    WHERE indent_id = $3
    RETURNING *
  `, [actual_present_students, wastage_reason, indentId]);

  res.json(result.rows[0]);
}));

// ============================================================================
// 7. SPONSORS & DONATIONS
// ============================================================================
router.get('/sponsors', asyncHandler(async (req, res) => {
  const result = await db.query(`SELECT * FROM v_donor_leaderboard`);
  res.json(result.rows);
}));

router.post('/sponsors', asyncHandler(async (req, res) => {
  const { name, organization_type, pan_number, email, phone, address } = req.body;
  const result = await db.query(`
    INSERT INTO sponsors (name, organization_type, pan_number, email, phone, address)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [name, organization_type, pan_number, email, phone, address]);
  res.status(201).json(result.rows[0]);
}));

router.get('/donations', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT d.*, s.name AS sponsor_name, s.organization_type, inst.name AS earmarked_school_name
    FROM donations d
    JOIN sponsors s ON d.sponsor_id = s.sponsor_id
    LEFT JOIN institutions inst ON d.earmarked_institution_id = inst.institution_id
    ORDER BY d.donation_date DESC, d.donation_id DESC
  `);
  res.json(result.rows);
}));

router.post('/donations', asyncHandler(async (req, res) => {
  const { sponsor_id, amount_inr, payment_mode, earmarked_institution_id, donor_notes } = req.body;
  const receipt_no = `80G-AP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  const result = await db.query(`
    INSERT INTO donations (
      sponsor_id, amount_inr, donation_date, payment_mode, earmarked_institution_id, tax_exemption_80g_receipt, donor_notes
    ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6)
    RETURNING *
  `, [sponsor_id, amount_inr, payment_mode, earmarked_institution_id || null, receipt_no, donor_notes]);

  res.status(201).json(result.rows[0]);
}));

router.get('/sponsors/:id/impact', asyncHandler(async (req, res) => {
  const sponsorId = req.params.id;
  const result = await db.query(`SELECT * FROM fn_get_donor_impact_summary($1)`, [sponsorId]);
  res.json(result.rows[0] || {});
}));

// ============================================================================
// 8. DBMS ACADEMIC & VIVA PLAYGROUND (Raw SQL, Triggers, Views, Explain)
// ============================================================================
router.get('/dbms/tables', asyncHandler(async (req, res) => {
  const tables = await db.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const columns = await db.query(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  res.json({
    tables: tables.rows.map(t => t.table_name),
    columns: columns.rows
  });
}));

router.get('/dbms/views/:viewName', asyncHandler(async (req, res) => {
  const { viewName } = req.params;
  const allowedViews = [
    'v_daily_kitchen_summary',
    'v_low_stock_alerts',
    'v_school_distribution_status',
    'v_donor_leaderboard',
    'v_ingredient_consumption_stats'
  ];

  if (!allowedViews.includes(viewName)) {
    return res.status(400).json({ error: 'Invalid or unauthorized view requested.' });
  }

  const result = await db.query(`SELECT * FROM ${viewName} LIMIT 100`);
  res.json(result.rows);
}));

router.post('/dbms/execute-query', asyncHandler(async (req, res) => {
  const { sql } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ error: 'SQL query string is required' });
  }

  // Safety check: block destructive system commands
  const upperSql = sql.trim().toUpperCase();
  if (upperSql.includes('DROP DATABASE') || upperSql.includes('SHUTDOWN')) {
    return res.status(403).json({ error: 'Execution blocked: Destructive database operations not allowed.' });
  }

  const startTime = Date.now();
  try {
    const result = await db.query(sql);
    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      command: result.command,
      rowCount: result.rowCount,
      durationMs,
      fields: result.fields ? result.fields.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })) : [],
      rows: result.rows || []
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      detail: err.detail,
      code: err.code
    });
  }
}));

router.get('/dbms/triggers-info', asyncHandler(async (req, res) => {
  const triggers = await db.query(`
    SELECT 
      event_object_table AS table_name,
      trigger_name,
      event_manipulation AS event,
      action_timing AS timing,
      action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `);

  const procedures = await db.query(`
    SELECT 
      routine_name,
      routine_type,
      data_type AS return_type
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_type IN ('FUNCTION', 'PROCEDURE')
      AND routine_name NOT LIKE 'pg_%'
    ORDER BY routine_type, routine_name;
  `);

  res.json({
    triggers: triggers.rows,
    procedures: procedures.rows
  });
}));

module.exports = router;
