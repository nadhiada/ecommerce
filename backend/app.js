const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { init } = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const path = require("path");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Logging POST
app.use((req, res, next) => {
  if (req.method === "POST") {
    console.log("🔥 Ada request POST masuk ke:", req.originalUrl);
  }
  next();
});

// 🔥 Serve frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// ROOT (boleh tetap ada)
app.get("/api", (req, res) => {
  res.send("✅ Shopease Backend is Running");
});

// ROUTES API
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/customers", require("./routes/customer.routes"));
app.use("/api/orders", require("./routes/order.routes")); 
app.use("/api/test", require("./routes/test.routes"));
app.use("/api/view", require("./routes/view.routes"));
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/customer-summary", require("./routes/customer-summary.routes"));
app.use("/api/performance", require("./routes/performance.routes"));
app.use("/api/auth", authRoutes);

// uploads static folder
app.use("/uploads", express.static("uploads"));

// 🔥 FIX: wildcard route yg kompatibel (tidak error)
app.get(/^.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// START SERVER
app.listen(process.env.PORT, async () => {
  await init();
  console.log("✅ Backend running on http://localhost:" + process.env.PORT);
});
