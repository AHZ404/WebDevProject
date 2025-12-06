const Subreddit = require('../models/subreddit');
const User = require('../models/user'); 

// Get All Communities
const getSubreddits = async (req, res) => {
  try {
    const subreddits = await Subreddit.find().sort({ members: -1 }).limit(10);
    res.status(200).json(subreddits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subreddits' });
  }
};

// Create a New Community
const createSubreddit = async (req, res) => {
  try {
    // DEBUG 1: Check what the frontend sent us
    console.log("------------------------------------------------");
    console.log("1. Incoming Data:", req.body);

    const { name, description, privacyMode, isOver18, username } = req.body;

    if (!name) {
        console.log("Error: Name missing");
        return res.status(400).json({ message: "Name is required" });
    }

    // DEBUG 2: Check if we have a username to look for
    if (!username) {
        console.log("Error: Username missing from request body");
        return res.status(400).json({ message: "Username is required" });
    }

    console.log(`2. Searching for User: ${username}`);
    
    // Find the User to get the ID
    const user = await User.findOne({ username: username });
    
    if (!user) {
        console.log("3. User NOT found in Database!");
        return res.status(404).json({ message: "User not found. Please log in again." });
    }

    console.log(`3. User Found! ID is: ${user._id}`);

    const existing = await Subreddit.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Subreddit already exists" });
    }

    // Create the Subreddit using the ID we found
    const newSubreddit = await Subreddit.create({
      name,
      description,
      privacyMode, 
      isOver18,    
      creator: user._id, // <--- THIS MUST BE A VALID ID
      members: 1
    });

    console.log("4. SUCCESS! Subreddit created.");
    console.log("------------------------------------------------");

    res.status(201).json(newSubreddit);
  } catch (error) {
    console.error("CRASH ERROR:", error); 
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSubreddits, createSubreddit };