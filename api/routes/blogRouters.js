// require("dotenv").config();
const express = require("express");
const router = express.Router();
const db = require("../../dbConnection");
const multer = require("multer");
const cloudinary = require("../../utils/cloudinary");
const streamifier = require("streamifier");

// Memory storage (no uploads folder)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: Wrap Cloudinary upload_stream in a Promise
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

router.post("/blogs", upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      slug,
      meta_title,
      meta_description,
      meta_keywords,
      city,
      state,
      short_description,
      content,
      author_name,
      category,
      status,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Image is required" });
    }

    // Upload image
    const result = await uploadFromBuffer(req.file.buffer);
    const banner_image = result.secure_url;

    // Insert into database
    const sql = `
      INSERT INTO blog (
        title, slug, meta_title, meta_description, meta_keywords, 
        city, state, short_description, content, banner_image, 
        author_name, category, status
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [dbResult] = await db.execute(sql, [
      title,
      slug,
      meta_title || null,
      meta_description || null,
      meta_keywords || null,
      city || null,
      state || null,
      short_description || null,
      content,
      banner_image,
      author_name || 'Admin',
      category || null,
      status || 'Draft'
    ]);

    res.status(201).json({
      message: "Blog added",
      blogId: dbResult.insertId,
      imagePath: banner_image,
    });
  } catch (error) {
    console.error("Server Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// GET all blogs
router.get("/blogs/allBlogs", async (req, res) => {
  try {
    // console.log("request coming");
    const sql = "SELECT * FROM blog ORDER BY created_at DESC";
    const [rows] = await db.execute(sql);
    // console.log(rows);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

// GET all blogs
router.get("/blogs/active", async (req, res) => {
  try {
    // console.log("request coming");
    const sql =
      "SELECT * FROM blog WHERE status = 'Published' ORDER BY created_at DESC";
    const [rows] = await db.execute(sql);
    // console.log(rows);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching Blogs:", error);
    res.status(500).json({ message: "Failed to fetch Blogs" });
  }
});

// PUT update blog content (including title, categories, author)
router.put("/blogs/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const {
    title,
    slug,
    meta_title,
    meta_description,
    meta_keywords,
    city,
    state,
    short_description,
    content,
    author_name,
    category,
    status,
  } = req.body;

  try {
    const [rows] = await db.execute("SELECT * FROM blog WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    let banner_image = rows[0].banner_image;

    if (req.file) {
      const result = await uploadFromBuffer(req.file.buffer);
      banner_image = result.secure_url;

      // Delete old image from Cloudinary
      if (rows[0].banner_image) {
        const oldPublicId = rows[0].banner_image.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`blogs/${oldPublicId}`);
      }
    }

    const sql = `
      UPDATE blog 
      SET 
        title = ?, 
        slug = ?, 
        meta_title = ?, 
        meta_description = ?, 
        meta_keywords = ?, 
        city = ?, 
        state = ?, 
        short_description = ?, 
        content = ?, 
        banner_image = ?, 
        author_name = ?, 
        category = ?, 
        status = ?, 
        updated_at = NOW() 
      WHERE id = ?
    `;

    await db.execute(sql, [
      title || rows[0].title,
      slug || rows[0].slug,
      meta_title !== undefined ? meta_title : rows[0].meta_title,
      meta_description !== undefined ? meta_description : rows[0].meta_description,
      meta_keywords !== undefined ? meta_keywords : rows[0].meta_keywords,
      city !== undefined ? city : rows[0].city,
      state !== undefined ? state : rows[0].state,
      short_description !== undefined ? short_description : rows[0].short_description,
      content || rows[0].content,
      banner_image,
      author_name || rows[0].author_name,
      category || rows[0].category,
      status || rows[0].status,
      id,
    ]);

    res.json({ message: "Blog updated successfully", imagePath: banner_image });
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ message: "Failed to update blog" });
  }
});

// GET single blog by ID or SLUG
router.get("/blogs/:identifier", async (req, res) => {
  const { identifier } = req.params;
  try {
    // Check if the identifier is numeric (ID) or string (Slug)
    const isId = /^\d+$/.test(identifier);
    const searchColumn = isId ? "id" : "slug";
    console.log(identifier);
    // Increment the views count
    await db.execute(
      `UPDATE blog SET views = views + 1 WHERE ${searchColumn} = ?`,
      [identifier]
    );

    const sql = `SELECT * FROM blog WHERE ${searchColumn} = ?`;
    const [rows] = await db.execute(sql, [identifier]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT update blog status
router.put("/blogs/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Expected: 'Draft' or 'Published'

  console.log("Update payload:", { id, status });
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

// DELETE blog by ID
router.delete("/blogs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // First, fetch the blog to confirm it exists
    const [rows] = await db.execute("SELECT * FROM blog WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Optionally delete image from Cloudinary
    if (rows[0].banner_image) {
      const publicId = rows[0].banner_image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`blogs/${publicId}`);
    }

    // Delete blog record
    const [result] = await db.execute("DELETE FROM blog WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Failed to delete blog" });
    }

    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// View Counting Logic: Call this when a user opens a blog post
router.patch("/blogs/:id/view", async (req, res) => {
  const { id } = req.params;
  try {
    // Increment views by 1 using MySQL's atomic increment
    const [result] = await db.execute(
      "UPDATE blog SET views = views + 1 WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({ message: "View updated" });
  } catch (error) {
    console.error("Error updating views:", error);
    res.status(500).json({ message: "Error updating views" });
  }
});

module.exports = router;
