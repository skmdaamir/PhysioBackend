const express = require("express");
const router = express.Router();
const db = require("../../dbConnection");
const multer = require("multer");
const cloudinary = require("../../utils/cloudinary");
const streamifier = require("streamifier");

// Memory storage (no uploads folder)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/blogs", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Wrap Cloudinary upload_stream in a Promise for async/await
    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "blogs" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    // Upload image
    const result = await uploadFromBuffer(req.file.buffer);
    const image_url = result.secure_url;

    // Insert into database
    const sql = `
      INSERT INTO blog (title, content, image_url, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, 1, NOW(), NOW())
    `;
    const [dbResult] = await db.execute(sql, [title, content, image_url]);

    res.status(201).json({
      message: "Blog added",
      blogId: dbResult.insertId,
      imagePath: image_url,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// GET all blogs
router.get("/allBlogs", async (req, res) => {
  try {
    const sql = "SELECT * FROM blog ORDER BY created_at DESC";
    const [rows] = await db.execute(sql);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching Treatment:", error);
    res.status(500).json({ message: "Failed to fetch Treatment" });
  }
});

// PUT update blog status
router.put("/blogs/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // expected: "published" or "draft"

  try {
    // Update blog status
    const [result] = await db.execute(
      "UPDATE blog SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.json({ message: "Blog status updated successfully" });
  } catch (err) {
    console.error("Error updating blog status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
