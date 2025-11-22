// routes/test.routes.js
const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');

// TEST TRIGGER — buat order dummy lalu hapus lagi
router.get('/trigger', async (req,res)=>{
  let conn;
  try {
    conn = await oracledb.getConnection();
    // Ambil produk pertama
    const prod = await conn.execute(`SELECT PRODUCT_ID, STOCK FROM PRODUCTS WHERE ROWNUM=1`);
    const pid = prod.rows[0][0];
    const stockBefore = prod.rows[0][1];

    // Buat order dummy
    const orderId = 'TEST' + Math.floor(Math.random()*1000);
    await conn.execute(`INSERT INTO ORDERS (ORDER_ID,CUSTOMER_ID,ORDER_DATE,TOTAL_AMOUNT) VALUES (:1,'C001',SYSDATE,100000)`,[orderId]);
    await conn.execute(`INSERT INTO ORDER_ITEMS (ITEM_ID,ORDER_ID,PRODUCT_ID,QUANTITY,PRICE) VALUES (:1,:2,:3,1,100000)`,
      [orderId+'-01',orderId,pid],{autoCommit:true});

    // Cek stok sesudah trigger
    const after = await conn.execute(`SELECT STOCK FROM PRODUCTS WHERE PRODUCT_ID=:1`,[pid]);
    const stockAfter = after.rows[0][0];

    // Hapus order dummy untuk restore stok
    await conn.execute(`DELETE FROM ORDER_ITEMS WHERE ORDER_ID=:1`,[orderId]);
    await conn.execute(`DELETE FROM ORDERS WHERE ORDER_ID=:1`,[orderId],{autoCommit:true});

    res.json({product_id:pid, stock_before:stockBefore, stock_after:stockAfter});
  } catch(e){
    res.status(500).json({error:e.message});
  } finally {
    if(conn) try{await conn.close();}catch(e){}
  }
});

// EXECUTION PLAN
router.get('/plan', async (req,res)=>{
  let conn;
  try {
    conn = await oracledb.getConnection();
    await conn.execute(`EXPLAIN PLAN FOR
      SELECT p.NAME, SUM(oi.QUANTITY) SOLD FROM ORDER_ITEMS oi JOIN PRODUCTS p ON p.PRODUCT_ID=oi.PRODUCT_ID
      GROUP BY p.NAME ORDER BY SOLD DESC`);
    const plan = await conn.execute(`SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY(NULL,NULL,'BASIC'));`);
    const text = plan.rows.map(r=>r.join(' ')).join('\n');
    res.type('text/plain').send(text);
  } catch(e){
    res.status(500).send(e.message);
  } finally {
    if(conn) try{await conn.close();}catch(e){}
  }
});

module.exports = router;
