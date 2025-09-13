const express = require("express");
const router = express.Router();
const db = require("../../dbConnection");

// ✅ POST: get condition by id
router.get("/details/:id", async (req, res) => {
  console.log("GET /api/details hit");
  const { id } = req.params;
  try {
    const [rows] = await db.execute("SELECT * FROM conditions WHERE condition_id = ?", [
      id,
    ]);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching condition by id:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET: all conditions (id + name only)
router.get("/conditions", async (req, res) => {
  console.log("GET /api/conditions hit");
  try {
    const [rows] = await db.query("SELECT condition_id as id, name FROM conditions");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching all conditions:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
