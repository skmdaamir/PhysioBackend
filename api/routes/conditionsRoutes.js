const express = require("express");
const router = express.Router();
const db = require("../../dbConnection");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Configure multer to upload directly to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "conditions", // all condition images will go in this folder
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
  },
});

const upload = multer({ storage });

// ✅ POST /api/conditions — insert a new condition
router.post("/conditions", upload.single("image"), async (req, res) => {
  const { name, description, symptoms, causes, treatment } = req.body;
  const image = req.file ? req.file.path : null; // Cloudinary URL

  if (!name || !description || !symptoms || !causes || !treatment || !image) {
    return res
      .status(400)
      .json({ message: "All fields including image are required." });
  }

  const query = `
    INSERT INTO conditions (name, description, symptoms, causes, treatment, image)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  try {
    await db.execute(query, [
      name,
      description,
      JSON.stringify(symptoms),
      JSON.stringify(causes),
      JSON.stringify(treatment),
      image,
    ]);
    res.status(201).json({ message: "Condition added successfully." });
  } catch (err) {
    console.error("Insert Error:", err);
    res
      .status(500)
      .json({ message: "Failed to add condition", error: err.message });
  }
});

// ✅ GET condition by ID
router.get("/conditions/:id", async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.query("SELECT * FROM conditions WHERE id = ?", [id]);
  if (rows.length === 0) return res.status(404).send("Not found");
  res.json(rows[0]);
});

// ✅ GET all conditions (id + name)
router.get("/conditions", async (req, res) => {
  const result = await db.query("SELECT id, name FROM conditions");
  res.json(result[0]);
});

// ✅ GET all symptoms (example table)
router.get("/symptoms", async (req, res) => {
  const result = await db.query("SELECT id, name FROM symptoms");
  res.json(result[0]);
});

module.exports = router;
