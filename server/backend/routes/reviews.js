const express = require("express");
const router = express.Router();
const db = require("../dbConnection"); // Your MySQL connection setup

router.post("/submit-review", (req, res) => {
  const { name, email, mobile, rating, description } = req.body;
  console.log(req.body);
  const query = `INSERT INTO reviews (name, email, mobile, rating, description) VALUES (?, ?, ?, ?, ?)`;
  db.execute(query, [name, email, mobile, rating, description])
    .then(() =>
      res.status(201).json({ message: "Review submitted successfully!" })
    )
    .catch((err) => {
      console.error("Insert error:", err); // This will help identify the problem
      res
        .status(500)
        .json({ error: "Database insert failed", details: err.message });
    });
});

// GET only approved reviews
router.get("/reviews", async (req, res) => {
  const query = `SELECT * FROM reviews ORDER BY created_at DESC`;
  try {
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching Treatment:", error);
    res.status(500).json({ message: "Failed to fetch Active Reviews" });
  }
});

// PUT to toggle visibility
router.put("/reviewVisibility/:id", (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const query = `UPDATE reviews SET visible = ? WHERE id = ?`;

  db.execute(query, [isActive, id])
    .then(() => res.status(201).json({ message: "Review visibility updated" }))
    .catch((err) => {
      console.error("Insert error:", err); // This will help identify the problem
      res.status(500).json({
        error: "Error updating review visibility:",
        details: err.message,
      });
    });
});

router.get("/approved-reviews", async (req, res) => {
  const query =
    "SELECT description,rating,created_at,name FROM reviews WHERE visible = 1 ORDER BY created_at DESC ";
  try {
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching Treatment:", error);
    res.status(500).json({ message: "Failed to fetch Active Reviews" });
  }
});

module.exports = router;
