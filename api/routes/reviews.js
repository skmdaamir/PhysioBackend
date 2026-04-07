const express = require("express");
const router = express.Router();
const db = require("../../dbConnection"); // Your MySQL connection setup

router.post("/submit-review", async (req, res) => {
  const { name, email, mobile, rating, description, place } = req.body;
  console.log(req.body);

  const query = `INSERT INTO reviews (name, email, mobile, rating, description,place) VALUES (?, ?, ?, ?, ?,?)`;
  const values = [
    name || null,
    email || null,
    mobile || null,
    rating || null,
    description || null,
    place || null,
  ];

  try {
    await db.execute(query, values);
    res.status(201).json({ message: "Review submitted successfully!" });
  } catch (err) {
    console.error("Database Error (POST /submit-review):", err.message);
    res.status(500).json({ error: "Database insert failed", details: err.message });
  }
});

// GET all reviews
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
router.put("/reviewVisibility/:id", async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  const query = `UPDATE reviews SET visible = ? WHERE id = ?`;

  try {
    await db.execute(query, [isActive !== undefined ? isActive : null, id]);
    res.status(200).json({ message: "Review visibility updated" });
  } catch (err) {
    console.error("Database Error (PUT /reviewVisibility):", err.message);
    res.status(500).json({
      error: "Error updating review visibility:",
      details: err.message,
    });
  }
});

router.get("/approved-reviews", async (req, res) => {
  const query =
    "SELECT description,rating,created_at,name,place FROM reviews WHERE visible = 1 ORDER BY created_at DESC ";
  try {
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching Treatment:", error);
    res.status(500).json({ message: "Failed to fetch Active Reviews" });
  }
});

module.exports = router;
