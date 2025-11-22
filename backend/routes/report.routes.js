const express = require("express");
const router = express.Router();
const oracledb = require("oracledb");

/* ===========================================================
   🟣 1) GENERATE LAPORAN (CALL STORED PROCEDURE)
=========================================================== */
router.post("/generate", async (req, res) => {
  let conn;
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({ error: "Tahun dan bulan wajib diisi" });
    }

    conn = await oracledb.getConnection();

    await conn.execute(
      `BEGIN generate_monthly_report(:year, :month); END;`,
      { year, month },
      { autoCommit: true }
    );

    res.json({ message: `Laporan bulan ${month}/${year} berhasil dibuat.` });

  } catch (err) {
    console.error("Error generate report:", err);
    res.status(500).json({ error: err.message });

  } finally {
    if (conn) try { await conn.close(); } catch (e) {}
  }
});

/* ===========================================================
   🟣 2) GET SEMUA LAPORAN
=========================================================== */
router.get("/", async (req, res) => {
  let conn;

  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(`
      SELECT 
        REPORT_ID,
        REPORT_MONTH,
        REPORT_YEAR,
        TOTAL_SALES,
        TO_CHAR(CREATED_AT, 'YYYY-MM-DD HH24:MI:SS') AS CREATED_AT
      FROM monthly_sales_report
      ORDER BY CREATED_AT DESC
    `);

    const data = result.rows.map(r => ({
      REPORT_ID: r[0],
      MONTH: r[1],
      YEAR: r[2],
      TOTAL_SALES: r[3],
      CREATED_AT: r[4]
    }));

    res.json(data);

  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ error: err.message });

  } finally {
    if (conn) try { await conn.close(); } catch (e) {}
  }
});

/* ===========================================================
   🟣 3) DELETE LAPORAN — FIX FINAL
=========================================================== */
router.delete("/:id", async (req, res) => {
  let conn;

  try {
    const { id } = req.params;

    conn = await oracledb.getConnection();

    // Cek dulu laporan ada atau tidak
    const check = await conn.execute(
      `SELECT REPORT_ID FROM monthly_sales_report WHERE REPORT_ID = :id`,
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Laporan tidak ditemukan" });
    }

    // Delete
    await conn.execute(
      `DELETE FROM monthly_sales_report WHERE REPORT_ID = :id`,
      [id],
      { autoCommit: true }
    );

    res.json({ message: "Laporan berhasil dihapus" });

  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ error: err.message });

  } finally {
    if (conn) try { await conn.close(); } catch (e) {}
  }
});

router.delete("/:id", async (req, res) => {
  let conn;
  try {
    const reportId = req.params.id;
    console.log("🔥 DELETE REPORT:", reportId);

    conn = await oracledb.getConnection();

    // cek apakah ada
    const check = await conn.execute(
      `SELECT REPORT_ID FROM MONTHLY_SALES_REPORT WHERE REPORT_ID = :id`,
      [reportId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Laporan tidak ditemukan" });
    }

    // hapus
    await conn.execute(
      `DELETE FROM MONTHLY_SALES_REPORT WHERE REPORT_ID = :id`,
      [reportId],
      { autoCommit: true }
    );

    res.json({ message: "Laporan berhasil dihapus" });

  } catch (err) {
    console.error("❌ ERROR DELETE:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) try { await conn.close(); } catch (e) {}
  }
});

module.exports = router;
