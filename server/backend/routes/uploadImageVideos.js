const express = require("express");
const router = express.Router();
const db = require("../dbConnection");
const multer = require("multer");
const path = require("path");

// Full absolute path to the uploads directory
const uploadPath = path.join("./uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath); // uploads folder inside backend
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/upload-photo", upload.single("image"), (req, res) => {
  const { title, youtubeLink } = req.body;
  const image_path = req.file ? req.file.path : null;

  const query = `INSERT INTO photo_gallery (treatment_name, youtube_link, image_path) VALUES (?, ?, ?)`;
  db.execute(query, [title, youtubeLink, image_path])
    .then(() =>
      res.status(201).json({ message: "Photo uploaded successfully." })
    )
    .catch((err) => {
      console.error("Photo uploaded successfully.", err); // This will help identify the problem
      res.status(500).json({
        error: "Photo uploaded successfully.",
        details: err.message,
      });
    });
});

router.get("/gallery", async (req, res) => {
  const query = `SELECT * FROM photo_gallery`;
  try {
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching Treatment:", error);
    res.status(500).json({ message: "Failed to fetch Treatment" });
  }
});

router.delete("/gallery/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await db.execute(
      "DELETE FROM photo_gallery WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

module.exports = router;
