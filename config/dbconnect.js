const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const initDB = require("../initdb");


dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test Connection
db.getConnection()
  .then((connection) => {
    console.log("✅ MySQL Connected Successfully");
    connection.release();
    initDB(db); // ✅ only runs after successful connection
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1); // stop server if db fails
  });

module.exports = db;