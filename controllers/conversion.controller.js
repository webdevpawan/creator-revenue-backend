const fs = require('fs');
const csv = require('csv-parser');
const db = require('../config/dbconnect');

exports.addConversion = async (req, res) => {
  const { linkId, amount, campaignName } = req.body;

  await db.query(
    `INSERT INTO conversions (user_id, link_id, amount, campaignName)
   VALUES (?, ?, ?, ?)`,
    [req.user.id, linkId, amount, campaignName]
  );

  await db.query(
    `UPDATE stats 
     SET total_revenue = total_revenue + ?
     WHERE link_id = ?`,
    [amount, linkId]
  );

  const [rows] = await db.query(
    `SELECT * FROM conversions WHERE user_id = ?`,
    [req.user.id]
  );
  res.json({ message: "Added" });
};

// GET all conversions of logged in user
exports.getConversions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM conversions WHERE user_id = ? ORDER BY id DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      data: rows
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

exports.importConversions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file required'
      });
    }

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        for (const row of results) {
          const { campaignName, amount } = row;

          // Find link automatically
          const [linkRows] = await db.query(
            `SELECT id
             FROM links
             WHERE campaign = ?
             AND user_id = ?
             LIMIT 1`,
            [campaignName, req.user.id]
          );

          // Skip if campaign not found
          if (linkRows.length === 0) {
            continue;
          }

          const linkId = linkRows[0].id;

          // Insert conversion
          await db.query(
            `INSERT INTO conversions
             (user_id, link_id, amount, campaignName)
             VALUES (?, ?, ?, ?)`,
            [req.user.id, linkId, amount, campaignName]
          );

          // Update stats
          await db.query(
            `UPDATE stats
             SET total_revenue = total_revenue + ?
             WHERE link_id = ?`,
            [amount, linkId]
          );
        }

        await db.query(
          `INSERT INTO upload_logs
           (user_id, file_name, total_records)
           VALUES (?, ?, ?)`,
          [req.user.id, req.file.filename, results.length]
        );

        fs.unlinkSync(req.file.path);

        return res.status(200).json({
          success: true,
          message: 'CSV imported successfully'
        });
      });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Import failed'
    });
  }
};