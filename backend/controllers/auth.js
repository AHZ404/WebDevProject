const User = require('../models/user'); // Import your Schema
const bcrypt = require('bcryptjs');

const registerUser = async (req, res) => {
  try {
    // 1. Get data from the user (Frontend sends this)
    const { username, email, password } = req.body;

    // 2. Validation: Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: "Username is already taken" });
    }

    // 3. Security: Hash the password
    // "Salt" is random data added to make the password harder to crack
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the User
    // Note: We don't send 'id' or 'karma', the database handles those defaults!
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // 5. Send success response
    if (user) {
      res.status(201).json({
        message: "User registered successfully!",
        user: {
          _id: user._id,
          id: user.id, // The auto-incremented ID
          username: user.username,
          email: user.email,
        },
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { registerUser };