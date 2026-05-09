const db = require('../config/dbconnect');

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        // =========================================
        // TOTAL CLICKS
        // =========================================

        const [clickRows] = await db.query(
            `
            SELECT COUNT(*) as totalClicks
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
            SELECT SUM(amount) as totalRevenue
            FROM conversions
            WHERE user_id = ?
            `,
            [userId]
        );

        const totalRevenue = revenueRows[0].totalRevenue || 0;

        // =========================================
        // TOTAL CONVERSIONS
        // =========================================

        const [conversionRows] = await db.query(
            `
            SELECT COUNT(*) as totalConversions
            FROM conversions
            WHERE user_id = ?
            `,
            [userId]
        );

        const totalConversions = conversionRows[0].totalConversions || 0;

        // =========================================
        // CONVERSION RATE
        // =========================================

        let conversionRate = 0;

        if (totalClicks > 0) {
            conversionRate = ((totalConversions / totalClicks) * 100).toFixed(1);
        }

        // =========================================
        // TOP CAMPAIGN
        // =========================================

        const [topCampaignRows] = await db.query(
            `
            SELECT
                campaignName,
                SUM(amount) as revenue
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
                DATE(cl.created_at) as date,
                COUNT(DISTINCT cl.id) as clicks,
                COALESCE(SUM(cv.amount), 0) as revenue
            FROM clicks cl
            LEFT JOIN conversions cv
                ON DATE(cl.created_at) = DATE(cv.created_at)
                AND cv.user_id = cl.user_id
            WHERE cl.user_id = ?
            GROUP BY DATE(cl.created_at)
            ORDER BY DATE(cl.created_at) ASC
            LIMIT 10
            `,
            [userId]
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
                COALESCE(SUM(cv.amount), 0) AS revenue,
                COUNT(DISTINCT cv.id) AS conversions,
                l.created_at AS createdAt
            FROM links l
            LEFT JOIN clicks cl
                ON l.id = cl.link_id
            LEFT JOIN conversions cv
                ON l.id = cv.link_id
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
                description: `${bestCampaign.name} generated ₹${bestCampaign.revenue}`
            });

            const zeroRevenueCampaign = campaignRows.find(
                c => c.clicks > 100 && c.revenue == 0
            );

            if (zeroRevenueCampaign) {
                insights.push({
                    id: 2,
                    type: 'warning',
                    title: 'Clicks Without Revenue',
                    description: `${zeroRevenueCampaign.name} has clicks but no revenue`
                });
            }
        }

        insights.push({
            id: 3,
            type: 'info',
            title: 'Conversion Rate',
            description: `Current conversion rate is ${conversionRate}%`
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