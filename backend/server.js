const express = require("express");
require("dotenv").config();
const path = require("path");
const connectDB = require("./config/db");
const cors = require("cors"); 
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const app = express();
app.use(cors());
app.use(express.json());
connectDB();


app.use('/users', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes); 


const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;