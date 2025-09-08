const express = require("express");
const router = express.Router();
const db = require("../dbConnection");

// POST /api/appointments
router.post("/", async (req, res) => {
  const { name, phone, email, state, city, treatmentType, conditions } =
    req.body;

  const sql = `
    INSERT INTO appointments (name, phone, email, state, city, treatmentType,conditions,created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?,NOW())
  `;
  const values = [name, phone, email, state, city, treatmentType, conditions];

  db.execute(sql, values)
    .then(() =>
      res.status(201).json({ message: "Appointment booked successfully!" })
    )
    .catch((err) => {
      console.error("Insert error:", err); // This will help identify the problem
      res
        .status(500)
        .json({ error: "Database insert failed", details: err.message });
    });
});

// GET /api/appointments
router.get("/", async (req, res) => {
  const sql = `SELECT 
  a.id, a.name, a.phone, a.email, a.conditions, a.created_at,
  s.state_name AS state,
  c.city_name AS city,
  t.treatment_description AS treatmentType,
  a.remarks
FROM appointments a
LEFT JOIN states s ON a.state = s.state_id
LEFT JOIN cities c ON a.city = c.city_id
LEFT JOIN treatment t ON a.treatmentType = t.treatment_id
ORDER BY a.created_at DESC`;

  try {
    const [rows] = await db.execute(sql);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching Treatment:", error);
    res.status(500).json({ message: "Failed to fetch Treatment" });
  }
});

// PUT /api/appointments/:id/remark
router.put("/:id/remark", async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const sql = `UPDATE appointments SET remarks = ? WHERE id = ?`;
  const values = [remarks, id];
  db.execute(sql, values)
    .then(() =>
      res.status(201).json({ message: "Appointment booked successfully!" })
    )
    .catch((err) => {
      console.error("Insert error:", err); // This will help identify the problem
      res
        .status(500)
        .json({ error: "Database insert failed", details: err.message });
    });
});

module.exports = router;
