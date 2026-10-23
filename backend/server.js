
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "StockFlow API is running successfully",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`StockFlow API running at http://localhost:${PORT}`);
});
