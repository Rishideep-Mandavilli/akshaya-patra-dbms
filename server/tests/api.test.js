const http = require('http');
const { app, server } = require('../index');

const request = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(resData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

async function runTests() {
  console.log('=== Running Backend API Automated Test Suite ===');
  let passed = 0;
  let failed = 0;

  try {
    // Test 1: Health Check
    const health = await request('/');
    if (health.status === 200 && health.body.status === 'ONLINE') {
      console.log('✅ PASS: Server health check');
      passed++;
    } else {
      console.error('❌ FAIL: Health check failed', health);
      failed++;
    }

    // Test 2: Dashboard KPIs
    const dash = await request('/api/dashboard/stats');
    if (dash.status === 200 && dash.body.kpis && dash.body.kpis.totalSchools > 0) {
      console.log(`✅ PASS: Dashboard stats (Total Schools: ${dash.body.kpis.totalSchools}, Cooked Today: ${dash.body.kpis.totalCookedToday})`);
      passed++;
    } else {
      console.error('❌ FAIL: Dashboard stats failed', dash);
      failed++;
    }

    // Test 3: Food Items
    const items = await request('/api/items');
    if (items.status === 200 && Array.isArray(items.body) && items.body.length >= 10) {
      console.log(`✅ PASS: Food items catalog (${items.body.length} items loaded)`);
      passed++;
    } else {
      console.error('❌ FAIL: Food items catalog failed', items);
      failed++;
    }

    // Test 4: Menus with BOM recipes
    const menus = await request('/api/menus');
    if (menus.status === 200 && Array.isArray(menus.body) && menus.body[0].ingredients.length > 0) {
      console.log(`✅ PASS: Menus & BOM Recipe mapping (Menu "${menus.body[0].menu_name}" has ${menus.body[0].ingredients.length} ingredients)`);
      passed++;
    } else {
      console.error('❌ FAIL: Menus BOM failed', menus);
      failed++;
    }

    // Test 5: DBMS Execute Query Engine
    const queryTest = await request('/api/dbms/execute-query', 'POST', {
      sql: 'SELECT menu_id, menu_name, standard_calories FROM menus ORDER BY menu_id ASC;'
    });
    if (queryTest.status === 200 && queryTest.body.success && queryTest.body.rowCount > 0) {
      console.log(`✅ PASS: DBMS live query execution (${queryTest.body.rowCount} rows returned in ${queryTest.body.durationMs}ms)`);
      passed++;
    } else {
      console.error('❌ FAIL: DBMS query execution failed', queryTest);
      failed++;
    }

    // Test 6: Trigger Error Handling via API
    // Attempting to dispatch 99,999 meals from Batch 1 should be caught by trg_prevent_over_dispatch
    const triggerTest = await request('/api/dispatches', 'POST', {
      batch_id: 1,
      route_id: 1,
      institution_id: 1,
      meals_dispatched: 99999
    });
    if (triggerTest.status === 400 && triggerTest.body.error.includes('OVER-DISPATCH INTEGRITY VIOLATION')) {
      console.log('✅ PASS: Over-dispatch trigger caught and returned error cleanly via API');
      passed++;
    } else {
      console.error('❌ FAIL: Over-dispatch trigger was not caught properly', triggerTest);
      failed++;
    }

    console.log(`\n=== API Tests Summary: ${passed} Passed, ${failed} Failed ===`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

// Give server 500ms to listen
setTimeout(runTests, 500);
