const sql = require('mssql');
require('dotenv').config();

// Kết nối db 
const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'yourpassword',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'Bus_no_road',
  options: {
    encrypt: false, 
    trustServerCertificate: true,
    connectTimeout: 30000, // 30 seconds
    requestTimeout: 30000, // 30 seconds
  },
  pool: {
    max: 10, // maximum number of connections in pool
    min: 0,  // minimum number of connections in pool
    idleTimeoutMillis: 30000
  }
};

async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log('Connected to SQL Server');
    return pool;
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

module.exports = { connectDB, sql };