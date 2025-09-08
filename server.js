require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");


const app = express();
const PORT = process.env.PORT || 5000;
const adminRoutes = require("./api/routes/admin");
const bodyParser = require("body-parser");
const statesRoute = require("./api/routes/states");
const citiesRoute = require("./api/routes/cities");
const treatmentRoute = require("./api/routes/treatment");
const appointmentRoute = require("./api/routes/appointment");
const galleryRoute = require("./api/routes/uploadImageVideos");
const reviewRoutes = require("./api/routes/reviews");
const careerRoutes = require("./api/routes/careerRoutes");
const conditionRoutes = require("./api/routes/conditionsRoutes");
const blogRoutes = require("./api/routes/blogRouters");



app.use(cors());
app.use(express.json());
// Session Configuration
app.use(
  session({
    secret: process.env.JWT_SECRET || "fallbackSecret", // Replace with your secret
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset the cookie Max-Age on every response
    cookie: {
      maxAge: 5 * 60 * 1000, // 5 minutes in milliseconds
    },
  })
);

// Middleware to Track Session Activity
app.use((req, res, next) => {
  if (req.session) {
    if (!req.session.lastActivity) {
      req.session.lastActivity = Date.now();
    } else {
      const now = Date.now();
      const diff = now - req.session.lastActivity;
      if (diff > 5 * 60 * 1000) {
        // 5 minutes
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destruction error:", err);
          }
          // Optionally, redirect to login or send a response
        });
      } else {
        req.session.lastActivity = now;
      }
    }
  }
  next();
});
//{
  // origin: "https://physio-56ld.vercel.app", // ✅ your GitHub Pages frontend
  // methods: ["GET", "POST", "PUT", "DELETE"],
  // credentials: true,
// }
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/api", blogRoutes);
app.use("/api/states", statesRoute);
app.use("/api/cities", citiesRoute);
app.use("/api/treatment", treatmentRoute);
app.use("/api/appointments", appointmentRoute);
app.use("/api", galleryRoute);
app.use("/api", reviewRoutes);
app.use("/api", careerRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api", conditionRoutes);


app.get("/test", (req, res) => {
  res.send("API working!");
});
app.get("/", (req, res) => {
  res.send("Physio API is running ✅");
});
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // ✅ Run locally
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
