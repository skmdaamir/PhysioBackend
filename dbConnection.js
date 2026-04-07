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

// Test the connection on startup
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ Database connection pool established successfully.");
    connection.release();
  } catch (err) {
    console.error("❌ Database connection failed. Check your .env file and MySQL status.");
    console.error(err.message);
  }
})();

// Export the connection pool (can handle multiple requests more efficiently)
module.exports = db;
