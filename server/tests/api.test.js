const http = require('http');
const app = require('../app');

const TEST_PORT = 5002;
const server = app.listen(TEST_PORT);

const request = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
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

  const assert = (condition, msg) => {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const r1 = await request('/api-health');
    assert(r1.status === 200 && r1.body.status === 'ONLINE', 'Server health check');

    // 2. Dashboard KPIs
    const r2 = await request('/api/dashboard/stats');
    assert(r2.status === 200 && r2.body.kpis.totalSchools >= 1, `Dashboard stats (Total Schools: ${r2.body?.kpis?.totalSchools}, Cooked Today: ${r2.body?.kpis?.totalCookedToday})`);

    // 3. Items Catalog
    const r3 = await request('/api/items');
    assert(r3.status === 200 && Array.isArray(r3.body) && r3.body.length > 0, `Food items catalog (${r3.body?.length} items loaded)`);

    // 4. Menus & BOM
    const r4 = await request('/api/menus');
    assert(r4.status === 200 && r4.body.length > 0 && r4.body[0].ingredients?.length > 0, `Menus & BOM Recipe mapping (Menu "${r4.body[0]?.menu_name}" has ${r4.body[0]?.ingredients?.length} ingredients)`);

    // 5. Query execution
    const r5 = await request('/api/dbms/execute-query', 'POST', {
      sql: 'SELECT route_code, route_name FROM delivery_routes LIMIT 4;'
    });
    assert(r5.status === 200 && r5.body.success && r5.body.rowCount > 0, `DBMS live query execution (${r5.body.rowCount} rows returned in ${r5.body.durationMs}ms)`);

    // 6. Test trigger: Try over-dispatching past batch capacity
    const r6 = await request('/api/dispatches', 'POST', {
      batch_id: 1,
      route_id: 1,
      institution_id: 1,
      meals_dispatched: 99999, // Should trigger EXCEPTION: OVER-DISPATCH INTEGRITY VIOLATION
      notes: 'Testing trigger violation'
    });
    assert(r6.status === 400 && r6.body.error && r6.body.error.includes('OVER-DISPATCH'), 'Over-dispatch trigger caught and returned error cleanly via API');

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
