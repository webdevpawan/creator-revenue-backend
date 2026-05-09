// db.js

const mysql = require("mysql2/promise");  // ✅ changed to promise
const dotenv = require("dotenv");

dotenv.config();

// Create MySQL Connection Pool
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false  // Required for Aiven
  }
})

// Test Connection
db.getConnection()
  .then((connection) => {
    console.log("MySQL Connected Successfully");
    connection.release();
  })
  .catch((err) => {
    console.log("Database connection failed:", err.message);
  });

module.exports = db;