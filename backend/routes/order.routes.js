const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");

/* ===========================================================
   ✅ GET all orders (ADMIN)
=========================================================== */
router.get("/", async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection();

        const result = await connection.execute(`
            SELECT 
                o.ORDER_ID,
                c.NAME AS CUSTOMER_NAME,
                LISTAGG(p.NAME || ' (x' || oi.QUANTITY || ')', ', ')
                    WITHIN GROUP (ORDER BY p.NAME) AS PRODUCTS,
                o.TOTAL_AMOUNT,
                TO_CHAR(o.ORDER_DATE, 'YYYY-MM-DD') AS ORDER_DATE,
                o.STATUS,
                o.PAYMENT_METHOD
            FROM orders o
            LEFT JOIN customers c ON o.CUSTOMER_ID = c.CUSTOMER_ID
            LEFT JOIN order_items oi ON o.ORDER_ID = oi.ORDER_ID
            LEFT JOIN products p ON oi.PRODUCT_ID = p.PRODUCT_ID
            GROUP BY o.ORDER_ID, c.NAME, o.TOTAL_AMOUNT, o.ORDER_DATE, o.STATUS, o.PAYMENT_METHOD
            ORDER BY o.ORDER_DATE DESC
        `);

        const orders = result.rows.map(row => ({
            ORDER_ID: row[0],
            CUSTOMER_NAME: row[1],
            PRODUCTS: row[2],
            TOTAL_AMOUNT: row[3],
            ORDER_DATE: row[4],
            STATUS: row[5],
            PAYMENT_METHOD: row[6]
        }));

        res.json(orders);

    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Failed to fetch orders: " + err.message });
    } finally {
        if (connection) await connection.close().catch(console.error);
    }
});

/* ===========================================================
   ✅ GET orders for specific customer (Pesanan Saya)
=========================================================== */
router.get("/customer/:customerId", async (req, res) => {
    let connection;
    try {
        const { customerId } = req.params;
        const { status } = req.query;

        connection = await oracledb.getConnection();

        const result = await connection.execute(`
            SELECT 
                o.ORDER_ID,
                TO_CHAR(o.ORDER_DATE, 'YYYY-MM-DD') AS ORDER_DATE,
                o.STATUS,
                o.PAYMENT_METHOD,
                oi.ITEM_ID,
                oi.PRODUCT_ID,
                p.NAME AS PRODUCT_NAME,
                NVL(p.IMAGE_URL, '') AS PRODUCT_IMAGE,
                oi.QUANTITY,
                oi.PRICE,
                (oi.QUANTITY * oi.PRICE) AS SUBTOTAL
            FROM orders o
            JOIN order_items oi ON o.ORDER_ID = oi.ORDER_ID
            JOIN products p ON oi.PRODUCT_ID = p.PRODUCT_ID
            WHERE o.CUSTOMER_ID = :customerId
            ${status ? "AND o.STATUS = :status" : ""}
            ORDER BY o.ORDER_DATE DESC
        `, status ? [customerId, status] : [customerId]);

        if (result.rows.length === 0) {
            return res.json({ success: true, orders: [], count: 0 });
        }

        const orders = {};

        result.rows.forEach(row => {
            const id = row[0];

            if (!orders[id]) {
                orders[id] = {
                    order_id: id,
                    order_date: row[1],
                    status: row[2],
                    payment_method: row[3],
                    items: []
                };
            }

            orders[id].items.push({
                item_id: row[4],
                product_id: row[5],
                product_name: row[6],
                product_image: row[7],
                quantity: row[8],
                price: row[9],
                subtotal: row[10]
            });
        });

        res.json({
            success: true,
            orders: Object.values(orders),
            count: Object.values(orders).length
        });

    } catch (err) {
        console.error("ERROR GET CUSTOMER ORDERS:", err);
        res.json({ success: false, orders: [], error: err.message });
    } finally {
        if (connection) await connection.close().catch(console.error);
    }
});

/* ===========================================================
   ❌ CANCEL ORDER (Customer)
=========================================================== */
router.put("/cancel/:orderId", async (req, res) => {
    let connection;
    try {
        const { orderId } = req.params;

        connection = await oracledb.getConnection();

        const check = await connection.execute(
            `SELECT STATUS FROM orders WHERE ORDER_ID = :1`,
            [orderId]
        );

        if (check.rows.length === 0)
            return res.status(404).json({ error: "Order not found" });

        if (check.rows[0][0] !== "Pending")
            return res.status(400).json({ error: "Only pending orders can be cancelled" });

        await connection.execute(
            `UPDATE orders SET STATUS = 'Cancelled' WHERE ORDER_ID = :1`,
            [orderId],
            { autoCommit: true }
        );

        res.json({ success: true, message: "Order cancelled" });

    } catch (err) {
        console.error("Cancel error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close().catch(console.error);
    }
});

/* ===========================================================
   ✅ CREATE ORDER (COD)
=========================================================== */
router.post("/", async (req, res) => {
    let connection;
    try {
        const { CUSTOMER_ID, ITEMS } = req.body;

        if (!CUSTOMER_ID || !ITEMS || !ITEMS.length)
            return res.status(400).json({ error: "Customer ID and items are required" });

        connection = await oracledb.getConnection();

        const idResult = await connection.execute(
            `SELECT 'O' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(ORDER_ID, 2))), 0) + 1, 6, '0') FROM orders`
        );
        const newId = idResult.rows[0][0];

        let total = 0;
        const processed = [];

        for (const item of ITEMS) {
            const product = await connection.execute(
                `SELECT NAME, PRICE, STOCK FROM products WHERE PRODUCT_ID = :1`,
                [item.PRODUCT_ID]
            );

            if (!product.rows.length) {
                return res.status(400).json({ error: `Product ${item.PRODUCT_ID} not found` });
            }

            const name = product.rows[0][0];
            const price = product.rows[0][1];
            const stock = product.rows[0][2];

            if (stock < item.QUANTITY) {
                return res.status(400).json({
                    error: `Stock not enough for ${name}. Available: ${stock}, Requested: ${item.QUANTITY}`
                });
            }

            total += item.QUANTITY * price;
            processed.push({ product: name, quantity: item.QUANTITY, price });
        }

        await connection.execute(
            `INSERT INTO orders (
                ORDER_ID, CUSTOMER_ID, ORDER_DATE, TOTAL_AMOUNT, STATUS, PAYMENT_METHOD
            ) VALUES (
                :1, :2, SYSDATE, :3, 'Pending', 'COD'
            )`,
            [newId, CUSTOMER_ID, total],
            { autoCommit: false }
        );

        for (let i = 0; i < ITEMS.length; i++) {
            const item = ITEMS[i];
            const itemId = `${newId}-${String(i + 1).padStart(2, "0")}`;

            await connection.execute(
                `INSERT INTO order_items (ITEM_ID, ORDER_ID, PRODUCT_ID, QUANTITY, PRICE)
                 VALUES (:1, :2, :3, :4, :5)`,
                [itemId, newId, item.PRODUCT_ID, item.QUANTITY, processed[i].price],
                { autoCommit: false }
            );
        }

        await connection.commit();

        res.json({
            success: true,
            order_id: newId,
            total_amount: total,
            items: processed,
            payment_method: "COD",
            message: "Order created successfully!"
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Database error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close().catch(console.error);
    }
});

/* ===========================================================
   🔥 UPDATE STATUS (ADMIN) — FINAL FIX
=========================================================== */
router.put("/update-status/:orderId", async (req, res) => {
    let connection;
    try {
        const { orderId } = req.params;

        // AUTO DETECT status key
        let status = req.body.STATUS || req.body.status;
        if (!status) {
            return res.status(400).json({ error: "STATUS is required" });
        }

        // FIX semua format dari frontend
        status = status.trim();
        status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

        const allowed = ["Pending", "Processing", "Completed", "Cancelled"];

        if (!allowed.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        connection = await oracledb.getConnection();

        const check = await connection.execute(
            `SELECT ORDER_ID FROM orders WHERE ORDER_ID = :1`,
            [orderId]
        );

        if (!check.rows.length) {
            return res.status(404).json({ error: "Order not found" });
        }

        await connection.execute(
            `UPDATE orders SET STATUS = :1 WHERE ORDER_ID = :2`,
            [status, orderId],
            { autoCommit: true }
        );

        res.json({
            success: true,
            message: "Order status updated!",
            order_id: orderId,
            new_status: status
        });

    } catch (err) {
        console.error("Update status error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

/* ===========================================================
   🗑 DELETE ORDER (ADMIN + KEMBALIKAN STOK)
=========================================================== */
router.delete("/delete/:orderId", async (req, res) => {
    let conn;

    try {
        const { orderId } = req.params;
        conn = await oracledb.getConnection();

        // cek apakah order ada
        const check = await conn.execute(
            `SELECT ORDER_ID FROM ORDERS WHERE ORDER_ID = :id`,
            { id: orderId }
        );

        if (!check.rows.length) {
            return res.status(404).json({ error: "Order not found" });
        }

        // ambil item untuk kembalikan stok
        const items = await conn.execute(
            `SELECT PRODUCT_ID, QUANTITY FROM ORDER_ITEMS WHERE ORDER_ID = :id`,
            { id: orderId }
        );

        // kembalikan stok (loop)
        for (const row of items.rows) {
            const productId = row[0];
            const qty = row[1];

            await conn.execute(
                `UPDATE PRODUCTS SET STOCK = STOCK + :qty WHERE PRODUCT_ID = :pid`,
                { qty, pid: productId }
            );
        }

        // hapus item
        await conn.execute(
            `DELETE FROM ORDER_ITEMS WHERE ORDER_ID = :id`,
            { id: orderId }
        );

        // hapus order
        await conn.execute(
            `DELETE FROM ORDERS WHERE ORDER_ID = :id`,
            { id: orderId },
            { autoCommit: true }
        );

        res.json({ success: true, message: "Order deleted & stock restored" });

    } catch (err) {
        console.error("❌ ERROR DELETE:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

module.exports = router;
