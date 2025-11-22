const { getConnection } = require("../config/db");

exports.login = async (req, res) => {
    let { username, password } = req.body;

    // ✅ Hapus semua spasi (bahkan spasi tak terlihat)
    username = username.replace(/\s+/g, '').toLowerCase();
    password = password.trim();

    console.log("📌 Username setelah dibersihkan =", username);
    console.log("📌 Password =", password);

    let conn;

    try {
        conn = await getConnection();

        const result = await conn.execute(
            `SELECT admin_id, username, password 
             FROM admins
             WHERE LOWER(username) = :u
             AND password = :p`,
            { u: username, p: password }
        );

        console.log("📌 Hasil query SELECT:");
        console.log(result.rows);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Username atau password salah!" });
        }

        const row = result.rows[0];

        return res.json({
            success: true,
            admin: {
                admin_id: row[0],
                username: row[1]
            }
        });

    } catch (err) {
        console.error("🔥 ERROR LOGIN:", err);
        return res.status(500).json({ error: err.message });
    } finally {
        if (conn) {
            try { await conn.close(); } catch (e) {}
        }
    }
};
