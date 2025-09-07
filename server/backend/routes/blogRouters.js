const express = require("express");
const router = express.Router();
const db = require("../dbConnection");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Full absolute path to the uploads directory
const uploadPath = path.join("./uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

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

// Upload image and add blog
router.post("/blogs", upload.single("image"), async (req, res) => {
  try {
    const { title, content } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
      INSERT INTO blog (title, content, image_url, is_active, created_at, updated_at) 
      VALUES (?, ?, ?, 1, NOW(), NOW())
    `;

    const [result] = await db.execute(sql, [title, content, image_url]);

    res.status(201).json({
      message: "Blog added",
      blogId: result.insertId,
      imagePath: image_url,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Update Blog
router.put("/blogs/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, status } = req.body;

    let image_url = req.body.image_url || null;
    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    if (!title || !content || !status) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const sql = `UPDATE blog SET title = ?, content = ?, image_url = ?, is_active = ?, updated_at = NOW() WHERE id = ?`;
    const [result] = await db.execute(sql, [
      title,
      content,
      image_url,
      status,
      id,
    ]);

    res.status(200).json({ message: "Blog updated successfully." });
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Delete Blog
router.delete("/blogs/:id", async (req, res) => {
  try{
  const { id } = req.params;
    const sql = `DELETE FROM blog WHERE id = ?`;
    
  const [result] = await db.execute(sql, [id]);

  res.status(200).json({ message: "Blog deleted" });
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Enable/Disable Blog
router.patch("/blogs/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    // Validate blog ID
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid blog ID" });
    }

    // Validate is_active value
    if (
      typeof is_active === "undefined" ||
      (is_active !== 0 && is_active !== 1)
    ) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const sql = `UPDATE blog SET is_active = ?, updated_at = NOW() WHERE id = ?`;

    const [result] = await db.execute(sql, [is_active, Number(id)]);

    res
      .status(200)
      .json({ message: `Blog ${is_active ? "enabled" : "disabled"}` });
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Fetch all active blogs
router.get("/blogs/active", (req, res) => {
  const sql = `SELECT * FROM blog WHERE is_active = 1 ORDER BY created_at DESC`;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ blogs: results });
  });
});

// Fetch all blogs
router.get("/allBlogs", async (req, res) => {
  const sql = `SELECT * FROM blog ORDER BY created_at DESC`;
  
  const [results] = await db.query(sql);
  res.json({ blogs: results });
});


router.get("/list-uploads", (req, res) => {
  const uploadsDir = "/opt/render/project/uploads";
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).send("Error reading uploads folder.");
    }
    res.json(files);
  });
});

module.exports = router;
