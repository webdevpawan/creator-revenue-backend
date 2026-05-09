const db = require('../config/dbconnect');

exports.redirect = async (req, res) => {
  const { slug } = req.params;

  const [rows] = await db.query(
    "SELECT * FROM links WHERE slug = ?",
    [slug]
  );

  if (!rows.length) return res.status(404).send("Not found");

  const link = rows[0];

  // async logging
  setImmediate(async () => {
    await db.query(
      `INSERT INTO clicks (link_id, user_id, campaign, ip, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [
        link.id,
        link.user_id,
        link.campaign,
        req.ip,
        req.headers['user-agent']
      ]
    );

    await db.query(
      `INSERT INTO stats (link_id, total_clicks)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE total_clicks = total_clicks + 1`,
      [link.id]
    );
  });

  res.redirect(link.original_url);
};