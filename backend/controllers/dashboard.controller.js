const { getConnection } = require("../config/db");

exports.getDashboardData = async (req, res) => {
    let conn;

    try {
        conn = await getConnection();

        const orders = await conn.execute(`SELECT COUNT(*) FROM ORDERS`);
        const revenue = await conn.execute(`SELECT NVL(SUM(TOTAL_AMOUNT),0) FROM ORDERS`);
        const customers = await conn.execute(`SELECT COUNT(*) FROM CUSTOMERS`);

        // ✅ FIX: Compatible Top Product Query
        const top = await conn.execute(`
            SELECT NAME, SOLD FROM (
                SELECT p.NAME, SUM(oi.QUANTITY) AS SOLD
                FROM ORDER_ITEMS oi
                JOIN PRODUCTS p ON p.PRODUCT_ID = oi.PRODUCT_ID
                GROUP BY p.NAME
                ORDER BY SOLD DESC
            )
            WHERE ROWNUM = 1
        `);

        // ✅ FIX: Compatible Recent Orders
        const recent = await conn.execute(`
            SELECT * FROM (
                SELECT 
                    o.ORDER_ID,
                    c.NAME AS CUSTOMER,
                    o.TOTAL_AMOUNT AS TOTAL,
                    TO_CHAR(o.ORDER_DATE, 'YYYY-MM-DD') AS ORDER_DATE
                FROM ORDERS o
                JOIN CUSTOMERS c ON c.CUSTOMER_ID = o.CUSTOMER_ID
                ORDER BY o.ORDER_DATE DESC
            )
            WHERE ROWNUM <= 10
        `);

        const formattedRecent = recent.rows.map(r => ({
            ORDER_ID: r[0],
            CUSTOMER: r[1],
            TOTAL: r[2],
            ORDER_DATE: r[3]
        }));

        res.json({
            totalOrders: orders.rows[0][0],
            totalRevenue: revenue.rows[0][0],
            totalCustomers: customers.rows[0][0],
            topProduct: top.rows.length ? top.rows[0][0] : "-",
            recentOrders: formattedRecent
        });

    } catch (err) {
        console.log("Dashboard Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) conn.close();
    }
};
