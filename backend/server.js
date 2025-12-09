const express = require("express");
require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors"); 
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const subredditRoutes = require('./routes/subredditRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// ✅ CRITICAL: Middleware order matters!
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ POST ROUTES FIRST (before express.json) - THIS IS THE KEY FIX

// Database Connection
connectDB();


// ✅ Body parsers AFTER file upload routes

app.use('/posts', postRoutes);  
app.use('/users', authRoutes);
app.use('/users', userRoutes);
app.use('/subreddits', subredditRoutes);
app.use('/comments', commentRoutes);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;