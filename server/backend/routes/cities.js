// routes/appointments.js
const express = require("express");
const router = express.Router();
const db = require("../dbConnection");

// GET cities by state_id
router.get("/:stateId", async (req, res) => {
  const { stateId } = req.params;
  try {
    const [rows] = await db.execute(
      "SELECT city_id, city_name FROM cities WHERE state_id = ?",
      [stateId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
});

module.exports = router;
