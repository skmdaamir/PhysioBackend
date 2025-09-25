const express = require("express");
const router = express.Router();
const db = require("../../dbConnection");

// POST /api/appointments
router.post("/", async (req, res) => {
  const { name, phone, email, place, treatmentType, conditions } =
    req.body;
  console.log(req.body);

  const treatmentValue = Array.isArray(treatmentType)
    ? treatmentType.join(",")
    : treatmentType;

  const sql = `
    INSERT INTO appointments (name, phone, email, place, treatmentType,conditions,created_at)
    VALUES (?, ?, ?, ?, ?, ?,NOW())
  `;
  const values = [name, phone, email, place, treatmentValue, conditions];

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
  a.place,
  t.treatment_description AS treatmentType,
  a.remarks
FROM appointments a
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
