const db = require('../config/dbconnect');
exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;
        // =========================================
        // TOTAL CLICKS
        // =========================================
        const [clickRows] = await db.query(
            `
            SELECT COUNT(*) AS totalClicks
            FROM clicks
            WHERE user_id = ?
            `,
            [userId]
        );
        const totalClicks = clickRows[0].totalClicks || 0;
        // =========================================
        // TOTAL REVENUE
        // =========================================
        const [revenueRows] = await db.query(
            `
            SELECT
                CAST(
                    COALESCE(SUM(amount), 0)
                    AS DECIMAL(10,2)
                ) AS totalRevenue
            FROM conversions
            WHERE user_id = ?
            `,
            [userId]
        );
        const totalRevenue =
            revenueRows[0].totalRevenue || 0;
        // =========================================
        // TOTAL CONVERSIONS
        // =========================================
        const [conversionRows] = await db.query(
            `
            SELECT COUNT(*) AS totalConversions
            FROM conversions
            WHERE user_id = ?
            `,
            [userId]
        );
        const totalConversions =
            conversionRows[0].totalConversions || 0;
        // =========================================
        // CONVERSION RATE
        // =========================================
        let conversionRate = 0;
        if (totalClicks > 0) {
            conversionRate =
                (
                    (totalConversions / totalClicks) * 100
                ).toFixed(1);
        }
        // =========================================
        // TOP CAMPAIGN
        // =========================================
        const [topCampaignRows] = await db.query(
            `
            SELECT
                campaignName,
                CAST(
                    SUM(amount)
                    AS DECIMAL(10,2)
                ) AS revenue
            FROM conversions
            WHERE user_id = ?
            GROUP BY campaignName
            ORDER BY revenue DESC
            LIMIT 1
            `,
            [userId]
        );
        const topCampaign =
            topCampaignRows.length > 0
                ? topCampaignRows[0].campaignName
                : 'No Campaign';
        // =========================================
        // CHART DATA
        // =========================================
        const [chartRows] = await db.query(
            `
            SELECT
                c.date,
                c.clicks,
                CAST(
                    COALESCE(r.revenue, 0)
                    AS DECIMAL(10,2)
                ) AS revenue
            FROM (
                SELECT
                    DATE(created_at) AS date,
                    COUNT(*) AS clicks
                FROM clicks
                WHERE user_id = ?
                GROUP BY DATE(created_at)
            ) c
            LEFT JOIN (
                SELECT
                    DATE(created_at) AS date,
                    SUM(amount) AS revenue
                FROM conversions
                WHERE user_id = ?
                GROUP BY DATE(created_at)
            ) r
            ON c.date = r.date
            ORDER BY c.date ASC
            LIMIT 10
            `,
            [userId, userId]
        );
        // =========================================
        // CAMPAIGNS
        // =========================================
        const [campaignRows] = await db.query(
            `
            SELECT
                l.id,
                l.campaign AS name,
                l.slug AS shortUrl,
                COUNT(DISTINCT cl.id) AS clicks,
                CAST(
                    COALESCE((
                        SELECT SUM(cv.amount)
                        FROM conversions cv
                        WHERE cv.link_id = l.id
                    ), 0)
                    AS DECIMAL(10,2)
                ) AS revenue,
                (
                    SELECT COUNT(*)
                    FROM conversions cv
                    WHERE cv.link_id = l.id
                ) AS conversions,
                l.created_at AS createdAt
            FROM links l
            LEFT JOIN clicks cl
                ON l.id = cl.link_id
            WHERE l.user_id = ?
            GROUP BY
                l.id,
                l.campaign,
                l.slug,
                l.created_at
            ORDER BY revenue DESC
            `,
            [userId]
        );
        // =========================================
        // INSIGHTS
        // =========================================
        const insights = [];
        if (campaignRows.length > 0) {
            const bestCampaign = campaignRows[0];
            insights.push({
                id: 1,
                type: 'success',
                title: 'Top Performer',
                description:
                    `${bestCampaign.name} generated ₹${bestCampaign.revenue}`
            });
            const zeroRevenueCampaign = campaignRows.find(
                c => c.clicks > 100 && c.revenue == 0
            );
            if (zeroRevenueCampaign) {
                insights.push({
                    id: 2,
                    type: 'warning',
                    title: 'Clicks Without Revenue',
                    description:
                        `${zeroRevenueCampaign.name} has clicks but no revenue`
                });
            }
        }
        insights.push({
            id: 3,
            type: 'info',
            title: 'Conversion Rate',
            description:
                `Current conversion rate is ${conversionRate}%`
        });
        // =========================================
        // FINAL RESPONSE
        // =========================================
        res.status(200).json({
            success: true,
            stats: {
                totalClicks,
                totalRevenue,
                conversionRate,
                topCampaign,
                clicksChange: 12.4,
                revenueChange: 18.2,
                conversionChange: -2.1
            },
            chartData: chartRows,
            campaigns: campaignRows,
            insights
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};