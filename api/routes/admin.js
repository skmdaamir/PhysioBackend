// require('dotenv').config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../../dbConnection"); // Import the shared connection pool

const SECRET_KEY = process.env.JWT_SECRET;

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    const user = rows[0];

    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token with 10m expiry
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "10m",
    });

    // Decode expiry time
    const decoded = jwt.decode(token);
    const exp = decoded.exp; // Unix timestamp (seconds)

    res.json({ token, exp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/session-status", (req, res) => {
  if (req.session && req.session.lastActivity) {
    const now = Date.now();
    const timeoutDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
    const elapsedTime = now - req.session.lastActivity;
    const remainingTime = timeoutDuration - elapsedTime;

    if (remainingTime > 0) {
      res.json({
        valid: true,
        remainingTime: remainingTime, // in milliseconds
      });
    } else {
      // Session has expired
      res.json({ valid: false, remainingTime: 0 });
    }
  } else {
    // No session or no activity tracked
    res.json({ valid: false, remainingTime: 0 });
  }
});

module.exports = router;
