const express = require("express");
const router = express.Router();
const db = require("../../dbConnection");

// // ✅ POST: get symptom by id
// router.post("/details", async (req, res) => {
//   console.log("POST /api/symptoms/details hit");
//   const { id } = req.body;
//   try {
//     const [rows] = await db.execute("SELECT * FROM symptoms WHERE id = ?", [
//       id,
//     ]);
//     res.json(rows);
//   } catch (err) {
//     console.error("Error fetching symptom by id:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// ✅ GET: all symptoms (id + name only)
router.get("/symptoms", async (req, res) => {
  console.log("GET /api/symptoms hit");
  try {
    const [rows] = await db.query("SELECT id, name FROM symptoms");
    res.json(rows);
  } catch (err) {
    console.error("Error fetching all symptoms:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
