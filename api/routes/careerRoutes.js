const express = require("express");
const router = express.Router();
const db = require("../../dbConnection"); // your MySQL connection

// GET all careers
router.get("/careers", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM careers");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// POST new career
router.post("/careers", async (req, res) => {
  const { position, description, experience } = req.body;
  try {
    await db.query(
      "INSERT INTO careers (position, description, experience) VALUES (?, ?, ?)",
      [position, description, experience]
    );
    res.json({ message: "Job added" });
  } catch (err) {
    res.status(500).json({ error: "Insert failed" });
  }
});

// DELETE career
router.delete("/careers/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM careers WHERE id = ?", [req.params.id]);
    res.json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
