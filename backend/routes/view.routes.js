const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");

// VIEW pelanggan dengan total transaksi
router.get("/customers", async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(`SELECT * FROM VW_CUSTOMER_TOTAL`);
    const data = result.rows.map(r => ({
      CUSTOMER_ID: r[0],
      NAME: r[1],
      TOTAL_ORDERS: r[2],
      TOTAL_SPENT: r[3]
    }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    if (conn) try { await conn.close(); } catch(e){}
  }
});

module.exports = router;
