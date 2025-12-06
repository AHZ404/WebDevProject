const express = require("express");
require("dotenv").config();
const path = require("path");
const connectDB = require("./config/db");
const cors = require("cors"); 

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const subredditRoutes = require('./routes/subredditRoutes'); // <--- CHECK THIS LINE

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Use Routes
app.use('/users', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes); 
app.use('/subreddits', subredditRoutes); // <--- AND THIS LINE

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;