const express = require("express");
require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
const multer = require("multer");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const subredditRoutes = require("./routes/subredditRoutes");
const commentRoutes = require("./routes/commentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

// ✅ CRITICAL: Middleware order matters!
app.use(cors());

// ✅ For JSON endpoints (most routes)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database Connection
connectDB();

// ✅ Routes - multer is configured in each route individually
app.use("/posts", postRoutes);
app.use("/users", authRoutes);
app.use("/users", userRoutes);
app.use("/subreddits", subredditRoutes);
app.use("/comments", commentRoutes);
app.use("/admin", adminRoutes);
// Chats (private 1-to-1)
app.use("/chats", chatRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
