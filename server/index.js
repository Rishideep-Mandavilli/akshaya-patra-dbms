const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Akshaya Patra Backend API running on http://localhost:${PORT}`);
});

module.exports = { app, server };
