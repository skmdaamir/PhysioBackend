require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const blogRoutes = require("./routes/blogRouters");

const app = express();
const PORT = 5000;
const adminRoutes = require("./admin");
const bodyParser = require("body-parser");
const statesRoute = require("./routes/states");
const citiesRoute = require("./routes/cities");
const treatmentRoute = require("./routes/treatment");
const appointmentRoute = require("./routes/appointment");
const galleryRoute = require("./routes/uploadImageVideos");
const reviewRoutes = require("./routes/reviews");
const careerRoutes = require("./routes/careerRoutes");
const conditionRoutes = require("./routes/conditionsRoutes");


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
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "..", "..","..", "uploads")));
app.use("/api", blogRoutes);
app.use(bodyParser.json());
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
