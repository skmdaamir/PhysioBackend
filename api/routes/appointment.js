const express = require("express");
const router = express.Router();
const db = require("../../dbConnection");

// POST /api/appointments
router.post("/", async (req, res) => {
  const { name, phone, email, place, treatment_type, conditions, appointment_date, appointment_time, doctor } = req.body;
  console.log(req.body);

  // Note: If your DB column treatmentType is an INT, joining multiple IDs will fail.
  // If it's a VARCHAR, this is fine, but the JOIN in the GET route won't work for multiple values.

  const sql = `
    INSERT INTO appointments (name, phone, email, place, treatmentType, conditions, appointment_date, appointment_time, doctor, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  const values = [
    name || null,
    phone || null,
    email || null,
    place || null,
    treatment_type || null,
    conditions || null,
    appointment_date || null,
    appointment_time || null,
    doctor || null,
  ];

  try {
    await db.execute(sql, values);
    res.status(201).json({ message: "Appointment booked successfully!" });
  } catch (err) {
    console.error("Database Error (POST /):", {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState,
    });
    res
      .status(500)
      .json({ error: "Database insert failed", details: err.message });
  }
});

// GET /api/appointments
router.get("/", async (req, res) => {
  const sql = `SELECT 
  a.id, a.name, a.phone, a.email, a.conditions, a.created_at,
  a.place,
  COALESCE(t.treatment_description, a.treatmentType) AS treatmentType,
  a.remarks,
  a.appointment_date, a.appointment_time, a.doctor
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
  const values = [remarks || null, id];

  try {
    await db.execute(sql, values);
    res.status(200).json({ message: "Remark updated successfully!" });
  } catch (err) {
    console.error("Database Error (PUT /remark):", err.message);
    res.status(500).json({
      error: "Failed to update remark",
      details: err.message,
    });
  }
});

// PUT /api/appointments/:id/reschedule
router.put("/:id/reschedule", async (req, res) => {
  console.log("PUT /reschedule hit");
  const { id } = req.params;
  const { appointment_date, appointment_time, doctor } = req.body;
  console.log(req.body);
  const sql = `UPDATE appointments SET appointment_date = ?, appointment_time = ?, doctor = ? WHERE id = ?`;
  const values = [
    appointment_date || null,
    appointment_time || null,
    doctor || null,
    id,
  ];

  try {
    const [result] = await db.execute(sql, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({ message: "Appointment updated successfully!" });
  } catch (err) {
    console.error("Database Error (PUT /reschedule):", err.message);
    res
      .status(500)
      .json({ error: "Failed to update appointment", details: err.message });
  }
});

/**
 * 4. Update Status (Manual Toggle)
 * PATCH /appointments/:id/status
 * Body: { status }
 */
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const [result] = await db.query(
      "UPDATE appointments SET status = ? WHERE id = ?",
      [status, id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Appointment not found" });
    res.json({ message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /patients/count
router.get('/count', async (req, res) => {
  try {
    // We count unique phone numbers to identify individual patients
    const [rows] = await db.query('SELECT COUNT(DISTINCT phone) as count FROM appointments');
    res.json({ count: rows[0].count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient count" });
  }
});

// DELETE /api/appointments/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute("DELETE FROM appointments WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("Database Error (DELETE /):", err.message);
    res.status(500).json({ error: "Failed to delete appointment", details: err.message });
  }
});

module.exports = router;
