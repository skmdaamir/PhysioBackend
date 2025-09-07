const express = require("express");
const router = express.Router();
const db = require("../dbConnection"); // Update path if necessary

// GET /api/states
router.get("/", async (req, res) => {
    console.log("GET /api/states hit");
  try {
    const [rows] = await db.execute(
      "SELECT state_id, state_name FROM states ORDER BY state_name ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching states:", error);
    res.status(500).json({ message: "Failed to fetch states" });
  }
});

module.exports = router;
