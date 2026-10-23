
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "StockFlow API is running successfully",
  });
});

// Authentication routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const productRoutes = require("./routes/products");
app.use("/api/products", productRoutes);

const dashboardRoutes = require("./routes/dashboard");
app.use("/api/dashboard", dashboardRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`StockFlow API running at http://localhost:${PORT}`);
});

