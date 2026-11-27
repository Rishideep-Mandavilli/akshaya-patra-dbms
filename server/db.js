const { Pool } = require('pg');
require('dotenv').config();

// Determine connection options: support cloud DATABASE_URL / POSTGRES_URL or local variables
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.DATABASE_NO_SSL === 'true' ? false : { rejectUnauthorized: false },
    }
  : {
      user: process.env.PGUSER || process.env.USER || 'rishideep',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'akshaya_patra_db',
      password: process.env.PGPASSWORD || undefined,
      port: parseInt(process.env.PGPORT || '5432', 10),
    };

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  query: (text, params) => {
    const start = Date.now();
    return pool.query(text, params).then((res) => {
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL === 'true') {
        console.log('Executed SQL:', { text, duration: `${duration}ms`, rows: res.rowCount });
      }
      return res;
    });
  },
  pool,
};
