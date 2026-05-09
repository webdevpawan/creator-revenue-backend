const db = require('../config/dbconnect');
const { generateSlug } = require('../utils/slug');

exports.createLink = async (req, res) => {
  const { originalUrl, campaign, title } = req.body;

  const slug = generateSlug();

  await db.query(
    `INSERT INTO links (user_id, slug, original_url, campaign, title)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user.id, slug, originalUrl, campaign, title]
  );

  res.json({
    shortUrl: `${process.env.BASE_URL}/r/${slug}`
  });
};

exports.getLinks = async (req, res) => {
  const [rows] = await db.query(
    "SELECT * FROM links WHERE user_id = ?",
    [req.user.id]
  );

  const formattedLinks = rows.map(({ campaign, original_url,created_at, slug, ...rest }) => ({
    ...rest,
    campaignName: campaign,
    createdAt : created_at,
    originalUrl: original_url,
    shortUrl: `${process.env.BASE_URL}/r/${slug}`
  }));

  res.json(formattedLinks);
};