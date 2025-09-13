// require("dotenv").config();
const express = require("express");
const router = express.Router();
const db = require("../../dbConnection");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer + Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "gallery",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: (req, file) =>
      `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`,
  },
});
const upload = multer({ storage });

/* ---------- UPLOAD ---------- */
router.post("/upload-photo", upload.single("image"), async (req, res) => {
  const title = req.body.title;
  const youtubeLink = req.body.youtubeLink || null;
  const image_url = req.file ? req.file.path : null;

  if (!title || !image_url) {
    return res.status(400).json({ message: "Title and image are required." });
  }

  try {
    await db.execute(
      "INSERT INTO photo_gallery (treatment_name, youtube_link, image_path) VALUES (?, ?, ?)",
      [title, youtubeLink, image_url]
    );
    res.status(201).json({
      message: "Photo uploaded successfully.",
      imageUrl: image_url,
    });
  } catch (err) {
    console.error("Insert error:", err);
    res
      .status(500)
      .json({ error: "Failed to upload photo", details: err.message });
  }
});

/* ---------- GET ALL ---------- */
router.get("/gallery", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM photo_gallery");
    res.json(rows);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Failed to fetch gallery" });
  }
});

/* ---------- UPDATE (with optional image replace) ---------- */
router.put("/gallery/:id", upload.single("image"), async (req, res) => {
  const id = req.params.id;
  const { title, youtubeLink } = req.body;

  try {
    // 1. Get existing item
    const [rows] = await db.execute(
      "SELECT * FROM photo_gallery WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    const oldImageUrl = rows[0].image_path;
    let newImageUrl = oldImageUrl;

    // 2. If new image uploaded → delete old from Cloudinary
    if (req.file) {
      newImageUrl = req.file.path;

      if (oldImageUrl) {
        const parts = oldImageUrl.split("/");
        const publicIdWithExt = parts.slice(-2).join("/"); // "gallery/filename.jpg"
        const publicId = path.parse(publicIdWithExt).name; // "gallery/filename"

        await cloudinary.uploader.destroy(`gallery/${publicId}`);
      }
    }

    // 3. Update DB
    await db.execute(
      "UPDATE photo_gallery SET treatment_name = ?, youtube_link = ?, image_path = ? WHERE id = ?",
      [
        title || rows[0].treatment_name,
        youtubeLink || rows[0].youtube_link,
        newImageUrl,
        id,
      ]
    );

    res.json({ message: "Gallery item updated successfully" });
  } catch (err) {
    console.error("Update error:", err);
    res
      .status(500)
      .json({ error: "Failed to update item", details: err.message });
  }
});

/* ---------- DELETE ---------- */
router.delete("/gallery/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db.execute(
      "SELECT image_path FROM photo_gallery WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    const imageUrl = rows[0].image_path;
    if (imageUrl) {
      const parts = imageUrl.split("/");
      const publicIdWithExt = parts.slice(-2).join("/");
      const publicId = path.parse(publicIdWithExt).name;
      await cloudinary.uploader.destroy(`gallery/${publicId}`);
    }

    await db.execute("DELETE FROM photo_gallery WHERE id = ?", [id]);
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res
      .status(500)
      .json({ error: "Failed to delete item", details: err.message });
  }
});

module.exports = router;
