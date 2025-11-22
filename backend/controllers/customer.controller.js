const { getConnection } = require("../config/db");
const oracledb = require("oracledb");

// =========================================
// LOGIN CUSTOMER
// =========================================
exports.customerLogin = async (req, res) => {
    const { email, password } = req.body;
    let conn;

    try {
        conn = await getConnection();

        const result = await conn.execute(
            `SELECT CUSTOMER_ID, NAME, EMAIL, PHONE, CREATED_AT
             FROM CUSTOMERS
             WHERE EMAIL = :email AND PASSWORD = :password`,
            { email, password }
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Email atau password salah" });
        }

        const r = result.rows[0];

        res.json({
            message: "Login berhasil",
            customer: {
                CUSTOMER_ID: r[0],
                NAME: r[1],
                EMAIL: r[2],
                PHONE: r[3],
                CREATED_AT: r[4]
            }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    } finally {
        if (conn) await conn.close();
    }
};

// =========================================
// REGISTER CUSTOMER
// =========================================
exports.registerCustomer = async (req, res) => {
    const { name, email, phone, password } = req.body;
    let conn;

    try {
        conn = await getConnection();

        // Generate CUSTOMER_ID otomatis
        const idResult = await conn.execute(`
            SELECT 'C' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(CUSTOMER_ID, 2))), 0) + 1, 3, '0') AS NEW_ID
            FROM CUSTOMERS
        `);

        const newId = idResult.rows[0].NEW_ID;

        // Insert customer baru
        await conn.execute(
            `INSERT INTO CUSTOMERS (CUSTOMER_ID, NAME, EMAIL, PHONE, PASSWORD, CREATED_AT)
             VALUES (:id, :name, :email, :phone, :password, SYSDATE)`,
            { id: newId, name, email, phone, password },
            { autoCommit: true }
        );

        res.json({
            success: true,
            message: "Registrasi berhasil",
            customer_id: newId
        });

    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        if (conn) await conn.close();
    }
};


// =========================================
// GET ALL CUSTOMERS
// =========================================
exports.getAllCustomers = async (req, res) => {
    let conn;

    try {
        conn = await getConnection();

        const result = await conn.execute(`
            SELECT CUSTOMER_ID, NAME, EMAIL, PHONE, CREATED_AT
            FROM CUSTOMERS
            ORDER BY CREATED_AT DESC
        `);

        const rows = result.rows.map(r => ({
            CUSTOMER_ID: r[0],
            NAME: r[1],
            EMAIL: r[2],
            PHONE: r[3],
            CREATED_AT: r[4]
        }));

        res.json(rows);

    } catch (err) {
        console.error("Get customers error:", err);
        res.status(500).json({ error: "Failed to load customers" });
    } finally {
        if (conn) await conn.close();
    }
};

// =========================================
// GET CUSTOMER BY ID
// =========================================
exports.getCustomerById = async (req, res) => {
    let conn;

    try {
        conn = await getConnection();

        const result = await conn.execute(
            `SELECT CUSTOMER_ID, NAME, EMAIL, PHONE, CREATED_AT
             FROM CUSTOMERS WHERE CUSTOMER_ID = :id`,
            { id: req.params.id }
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Customer tidak ditemukan" });
        }

        const r = result.rows[0];

        res.json({
            CUSTOMER_ID: r[0],
            NAME: r[1],
            EMAIL: r[2],
            PHONE: r[3],
            CREATED_AT: r[4]
        });

    } catch (err) {
        console.error("Get customer error:", err);
        res.status(500).json({ error: "Failed to load customer" });
    } finally {
        if (conn) await conn.close();
    }
};

// =========================================
// ADD CUSTOMER
// =========================================
exports.addCustomer = async (req, res) => {
    const { NAME, EMAIL, PHONE } = req.body;
    let conn;

    try {
        conn = await getConnection();

        await conn.execute(
            `INSERT INTO CUSTOMERS (NAME, EMAIL, PHONE)
             VALUES (:NAME, :EMAIL, :PHONE)`,
            { NAME, EMAIL, PHONE },
            { autoCommit: true }
        );

        res.json({ message: "Customer berhasil ditambahkan" });

    } catch (err) {
        console.error("Add customer error:", err);
        res.status(500).json({ error: "Gagal menambahkan customer" });
    } finally {
        if (conn) await conn.close();
    }
};

// =========================================
// UPDATE CUSTOMER
// =========================================
exports.updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { NAME, EMAIL, PHONE } = req.body;

    let conn;

    try {
        conn = await getConnection();

        await conn.execute(
            `UPDATE CUSTOMERS SET 
                NAME = :NAME,
                EMAIL = :EMAIL,
                PHONE = :PHONE
             WHERE CUSTOMER_ID = :id`,
            { NAME, EMAIL, PHONE, id },
            { autoCommit: true }
        );

        res.json({ message: "Customer berhasil diperbarui" });

    } catch (err) {
        console.error("Update customer error:", err);
        res.status(500).json({ error: "Gagal update customer" });
    } finally {
        if (conn) await conn.close();
    }
};

// =========================================
// DELETE CUSTOMER
// =========================================
exports.deleteCustomer = async (req, res) => {
    let conn;

    try {
        conn = await getConnection();

        await conn.execute(
            `DELETE FROM CUSTOMERS WHERE CUSTOMER_ID = :id`,
            { id: req.params.id },
            { autoCommit: true }
        );

        res.json({ message: "Customer berhasil dihapus" });

    } catch (err) {
        console.error("Delete customer error:", err);
        res.status(500).json({ error: "Gagal menghapus customer" });
    } finally {
        if (conn) await conn.close();
    }
};
