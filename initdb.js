// const db = require('./config/dbconnect');

const initDB = async (db) => {
  try {

    // 1. Users (no dependencies)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id int NOT NULL AUTO_INCREMENT,
        name varchar(100) DEFAULT NULL,
        email varchar(150) DEFAULT NULL,
        password_hash varchar(255) DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("✅ users table ready");

    // 2. Links (depends on users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS links (
        id int NOT NULL AUTO_INCREMENT,
        user_id int DEFAULT NULL,
        slug varchar(20) DEFAULT NULL,
        original_url text,
        campaign varchar(100) DEFAULT NULL,
        title varchar(100) DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY slug (slug),
        KEY idx_slug (slug),
        KEY idx_user (user_id),
        CONSTRAINT links_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("✅ links table ready");

    // 3. Clicks (depends on links)
    await db.query(`
      CREATE TABLE IF NOT EXISTS clicks (
        id bigint NOT NULL AUTO_INCREMENT,
        link_id int DEFAULT NULL,
        user_id int DEFAULT NULL,
        campaign varchar(100) DEFAULT NULL,
        ip varchar(45) DEFAULT NULL,
        user_agent text,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_link_clicks (link_id),
        KEY idx_created_at (created_at),
        CONSTRAINT clicks_ibfk_1 FOREIGN KEY (link_id) REFERENCES links (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("✅ clicks table ready");

    // 4. Conversions (depends on links)
    await db.query(`
      CREATE TABLE IF NOT EXISTS conversions (
        id int NOT NULL AUTO_INCREMENT,
        user_id int DEFAULT NULL,
        link_id int DEFAULT NULL,
        amount decimal(10,2) DEFAULT NULL,
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        campaignName varchar(255) DEFAULT NULL,
        PRIMARY KEY (id),
        KEY link_id (link_id),
        CONSTRAINT conversions_ibfk_1 FOREIGN KEY (link_id) REFERENCES links (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("✅ conversions table ready");

    // 5. Stats (depends on links)
    await db.query(`
      CREATE TABLE IF NOT EXISTS stats (
        id int NOT NULL AUTO_INCREMENT,
        link_id int DEFAULT NULL,
        total_clicks int DEFAULT 0,
        total_revenue decimal(10,2) DEFAULT 0.00,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY link_id (link_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("✅ stats table ready");

    // 6. Upload Logs (depends on users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS upload_logs (
        id int NOT NULL AUTO_INCREMENT,
        user_id int NOT NULL,
        file_name varchar(255) NOT NULL,
        total_records int DEFAULT 0,
        uploaded_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        CONSTRAINT upload_logs_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("✅ upload_logs table ready");

    console.log("🎉 All tables created successfully!");

  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
  }
};

module.exports = initDB;