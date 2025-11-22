const oracledb = require("oracledb");
const path = require("path");

exports.getAll = async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();

    const result = await conn.execute(
      `SELECT PRODUCT_ID, NAME, PRICE, STOCK, IMAGE_URL FROM PRODUCTS ORDER BY PRODUCT_ID`
    );

    const rows = result.rows.map(r => ({
      PRODUCT_ID: r[0],
      NAME: r[1],
      PRICE: r[2],
      STOCK: r[3],
      IMAGE_URL: r[4] || "/uploads/default.png"
    }));

    res.json(rows);

  } catch (err) {
    console.error("❌ ERROR GET:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};


// ===============================
// CREATE PRODUCT
// ===============================
exports.create = async (req, res) => {
  let conn;

  try {
    conn = await oracledb.getConnection();

    const { NAME, PRICE, STOCK } = req.body;

    // pastikan nilai tidak undefined
    if (!NAME || !PRICE || !STOCK) {
      return res.status(400).json({ error: "Field tidak boleh kosong!" });
    }

    const imageUrl = req.file
      ? "/uploads/" + req.file.filename
      : "/uploads/default.png";

    // Generate ID otomatis
    const idResult = await conn.execute(
      `SELECT 'P' || LPAD(NVL(MAX(TO_NUMBER(SUBSTR(PRODUCT_ID, 2))), 0) + 1, 3, '0')
       FROM PRODUCTS`
    );

    const PRODUCT_ID = idResult.rows[0][0];

    await conn.execute(
      `INSERT INTO PRODUCTS (PRODUCT_ID, NAME, PRICE, STOCK, IMAGE_URL)
       VALUES (:1, :2, :3, :4, :5)`,
      [PRODUCT_ID, NAME, PRICE, STOCK, imageUrl],
      { autoCommit: true }
    );

    res.json({ message: "Produk berhasil ditambahkan!", PRODUCT_ID });

  } catch (err) {
    console.error("❌ ERROR INSERT:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};


// ===============================
// UPDATE PRODUCT (GAMBAR OPTIONAL)
// ===============================
exports.update = async (req, res) => {
  let conn;

  try {
    conn = await oracledb.getConnection();

    const id = req.params.id;
    const { NAME, PRICE, STOCK } = req.body;

    if (!NAME || !PRICE || !STOCK) {
      return res.status(400).json({ error: "Field tidak boleh kosong!" });
    }

    let imageUrl = null;

    if (req.file) {
      imageUrl = "/uploads/" + req.file.filename;
    }

    let sql = `UPDATE PRODUCTS SET NAME = :1, PRICE = :2, STOCK = :3`;
    let binds = [NAME, PRICE, STOCK];

    if (imageUrl) {
      sql += `, IMAGE_URL = :4`;
      binds.push(imageUrl);
    }

    sql += ` WHERE PRODUCT_ID = :id`;
    binds.push(id);

    await conn.execute(sql, binds, { autoCommit: true });

    res.json({ message: "Produk berhasil diupdate!" });

  } catch (err) {
    console.error("❌ ERROR UPDATE:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};


// ===============================
// DELETE PRODUCT
// ===============================
exports.remove = async (req, res) => {
  let conn;

  try {
    conn = await oracledb.getConnection();

    const id = req.params.id;

    await conn.execute(
      `DELETE FROM PRODUCTS WHERE PRODUCT_ID = :id`,
      [id],
      { autoCommit: true }
    );

    res.json({ message: "Produk berhasil dihapus!" });

  } catch (err) {
    console.error("❌ ERROR DELETE:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
};
