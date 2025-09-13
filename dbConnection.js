require("dotenv").config();
const mysql = require("mysql2/promise");

// Creating a single connection that can be used across your app
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000, // <-- 10 seconds timeout
});

// Export the connection pool (can handle multiple requests more efficiently)
module.exports = db;
