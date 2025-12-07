const express = require("express");
require("dotenv").config();
const connectDB = require("./config/db");
const cors = require("cors"); 

// Import Routes (ONCE each)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const subredditRoutes = require('./routes/subredditRoutes');
const commentRoutes = require('./routes/commentRoutes'); // Added this for the comments feature

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Use Routes (ONCE each)
app.use('/users', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes); 
app.use('/subreddits', subredditRoutes);
app.use('/comments', commentRoutes); 

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;