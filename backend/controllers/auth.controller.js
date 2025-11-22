const oracledb = require("oracledb");
const { getConnection } = require("../config/db");

exports.login = async (req, res) => {
    const { username, password } = req.body;

    let conn;

    try {
        conn = await getConnection();

        const result = await conn.execute(
            `SELECT USER_ID, USERNAME, ROLE 
             FROM USERS 
             WHERE USERNAME = :username 
             AND PASSWORD = :password`,
            { username, password }
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Username atau password salah" });
        }

        const user = {
            USER_ID: result.rows[0][0],
            USERNAME: result.rows[0][1],
            ROLE: result.rows[0][2]
        };

        res.json({ message: "Login sukses", user });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    } finally {
        if (conn) try { await conn.close(); } catch (e) {}
    }
};
