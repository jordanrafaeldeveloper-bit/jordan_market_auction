const express = require("express");
const connectDB = require("./config/db");
const auctionRoutes = require("./routes/auction.route");
const authRoutes = require("./routes/auth.route");

const app = express();
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ error: "Database unavailable" });
  }
});

app.use("/api/auctions", auctionRoutes);
app.use("/api/auth", authRoutes);

module.exports = app;
