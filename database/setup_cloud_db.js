#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const db = require('../server/db');

async function setupDatabase() {
  console.log('=============================================================');
  console.log('  AKSHAYA PATRA - CLOUD DATABASE INITIALIZATION & MIGRATION');
  console.log('=============================================================');

  const files = [
    { name: '01_schema.sql', desc: 'Core Tables, Constraints & BCNF Relations' },
    { name: '02_triggers_and_procedures.sql', desc: 'PL/pgSQL Triggers & Stored Procedures' },
    { name: '03_views.sql', desc: 'Operational Analytics SQL Views' },
    { name: '04_seed_data.sql', desc: 'Enterprise Seed Records & Initial Inventory' },
  ];

  try {
    // Test connection
    const testRes = await db.query('SELECT NOW() as current_time, version() as pg_version');
    console.log(` Connected to PostgreSQL Database:`);
    console.log(`   Time:    ${testRes.rows[0].current_time}`);
    console.log(`   Version: ${testRes.rows[0].pg_version.split(' on ')[0]}`);
    console.log('-------------------------------------------------------------');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(__dirname, file.name);
      console.log(`[${i + 1}/${files.length}] Applying ${file.name} (${file.desc})...`);
      
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      await db.query(sqlContent);
      console.log(`    Successfully applied ${file.name}`);
    }

    console.log('=============================================================');
    console.log(' Cloud Database Setup Completed Successfully!');
    console.log('   All tables, triggers, views, and seed data are ready.');
    console.log('=============================================================');
  } catch (err) {
    console.error(' Error during database initialization:');
    console.error(err.message);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
}

setupDatabase();
