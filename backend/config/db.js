const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.d_bName,
    });
    console.log(`Database Connection Successfully`);
  } catch (error) {
    console.log(`Error in Connection with Database. ${error}`);
  }
};

module.exports = connectDB;