const mysql = require("mysql2/promise");
const dotenv = require("dotenv");

dotenv.config();

// ✅ Use createPool instead of createConnection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
});

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