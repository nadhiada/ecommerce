const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");

/* ===========================================================
   ✅ GET Customer Transaction Summary (VIEW)
=========================================================== */
router.get("/", async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();

        const result = await connection.execute(`
            SELECT 
                customer_id,
                customer_name,
                email,
                phone,
                total_orders,
                total_spent,
                avg_order_val,
                TO_CHAR(last_order_date, 'YYYY-MM-DD') as last_order_date
            FROM vw_cust_summary 
            ORDER BY total_spent DESC
        `);

        const customers = result.rows.map(row => ({
            customer_id: row[0],
            customer_name: row[1],
            email: row[2],
            phone: row[3],
            total_orders: row[4],
            total_spent: row[5],
            average_order_value: row[6],
            last_order_date: row[7]
        }));

        res.json({
            success: true,
            total_customers: customers.length,
            data: customers
        });
        
    } catch (err) {
        console.error("Customer summary error:", err);
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch customer summary: " + err.message 
        });
    } finally {
        if (connection) await connection.close().catch(console.error);
    }
});

/* ===========================================================
   ✅ GET Customer Detail dengan Order History
=========================================================== */
router.get("/:id", async (req, res) => {
    let connection;
    try {
        const { id } = req.params;
        connection = await oracledb.getConnection();

        // Customer basic info
        const customerResult = await connection.execute(`
            SELECT * FROM vw_cust_summary WHERE customer_id = :1
        `, [id]);

        if (customerResult.rows.length === 0) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // Order history
        const ordersResult = await connection.execute(`
            SELECT 
                o.order_id,
                TO_CHAR(o.order_date, 'YYYY-MM-DD') as order_date,
                o.total_amount,
                o.status,
                LISTAGG(p.name || ' (x' || oi.quantity || ')', ', ') as products
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.product_id
            WHERE o.customer_id = :1
            GROUP BY o.order_id, o.order_date, o.total_amount, o.status
            ORDER BY o.order_date DESC
        `, [id]);

        const customer = {
            customer_id: customerResult.rows[0][0],
            customer_name: customerResult.rows[0][1],
            email: customerResult.rows[0][2],
            phone: customerResult.rows[0][3],
            total_orders: customerResult.rows[0][4],
            total_spent: customerResult.rows[0][5],
            average_order_value: customerResult.rows[0][6],
            last_order_date: customerResult.rows[0][7]
        };

        const orders = ordersResult.rows.map(row => ({
            order_id: row[0],
            order_date: row[1],
            total_amount: row[2],
            status: row[3],
            products: row[4]
        }));

        res.json({
            success: true,
            customer: customer,
            orders: orders
        });
        
    } catch (err) {
        console.error("Customer detail error:", err);
        res.status(500).json({ error: "Failed to fetch customer details: " + err.message });
    } finally {
        if (connection) await connection.close().catch(console.error);
    }
});

/* ===========================================================
   ✅ GET Top Customers (Dashboard)
=========================================================== */
router.get("/reports/top-customers", async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();

        const result = await connection.execute(`
            SELECT 
                customer_name,
                total_orders,
                total_spent,
                avg_order_val,
                TO_CHAR(last_order_date, 'YYYY-MM-DD') as last_order
            FROM vw_cust_summary 
            WHERE total_orders > 0
            ORDER BY total_spent DESC
            FETCH FIRST 10 ROWS ONLY
        `);

        const topCustomers = result.rows.map(row => ({
            customer_name: row[0],
            total_orders: row[1],
            total_spent: row[2],
            average_order_value: row[3],
            last_order: row[4]
        }));

        res.json({
            success: true,
            data: topCustomers
        });
        
    } catch (err) {
        console.error("Top customers error:", err);
        res.status(500).json({ error: "Failed to fetch top customers: " + err.message });
    } finally {
        if (connection) await connection.close().catch(console.error);
    }
});

module.exports = router;