const express = require("express");
const router = express.Router();
const db = require("../dbConnection"); // Update path if necessary

// GET /api/states
router.get("/", async (req, res) => {
    console.log("GET /api/Treatment hit");
  try {
    const [rows] = await db.execute(
      "SELECT treatment_id, treatment_description FROM treatment ORDER BY treatment_id ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching Treatment:", error);
    res.status(500).json({ message: "Failed to fetch Treatment" });
  }
});

module.exports = router;