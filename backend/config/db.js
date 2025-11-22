const oracledb = require("oracledb");
require("dotenv").config();

/* ======================================================
   ✅ AKTIFKAN ORACLE THICK MODE (WAJIB UNTUK ORACLE 11g)
   ====================================================== */
try {
  oracledb.initOracleClient({
    libDir: "D:\\oracle\\instantclient_23_9"   // ✅ GUNAKAN PATH kamu sendiri
  });
  console.log("✅ Oracle THICK mode aktif (Instant Client loaded)");
} catch (err) {
  console.error("❌ Gagal load Instant Client:", err);
}

/* ======================================================
   ✅ INIT POOL (untuk koneksi Express)
   ====================================================== */
async function init() {
  try {
    await oracledb.createPool({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION,
      poolMin: 1,
      poolMax: 10,
      poolIncrement: 1
    });

    console.log("✅ Oracle Pool Created.");
  } catch (err) {
    console.error("❌ Gagal membuat pool Oracle:", err);
  }
}

/* ======================================================
   ✅ GET CONNECTION dari Pool
   ====================================================== */
async function getConnection() {
  return await oracledb.getConnection();
}

module.exports = { init, getConnection };
