const express = require("express");
const router = express.Router();
const db = require("../../dbConnection");
const multer = require("multer");
const cloudinary = require("../../utils/cloudinary");

// Use memory storage (no uploads folder)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload image and add blog
router.post("/blogs", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    let image_url = null;

    if (req.file) {
      // Upload buffer to Cloudinary
      const result = await cloudinary.uploader.upload_stream(
        { folder: "blogs" },
        async (error, result) => {
          if (error) throw error;

          image_url = result.secure_url;

          const sql = `
            INSERT INTO blog (title, content, image_url, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, 1, NOW(), NOW())
          `;
          const [dbResult] = await db.execute(sql, [title, content, image_url]);

          return res.status(201).json({
            message: "Blog added",
            blogId: dbResult.insertId,
            imagePath: image_url,
          });
        }
      );

      // Pipe file buffer to Cloudinary stream
      require("streamifier").createReadStream(req.file.buffer).pipe(result);
    } else {
      return res.status(400).json({ error: "Image is required" });
    }
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});
