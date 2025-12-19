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
    console.log("=".repeat(50));
    console.log("COMMUNITY CREATION REQUEST");
    console.log("=".repeat(50));
    console.log("1. Incoming req.body:", req.body);
    console.log("1. Incoming req.files:", req.files);

    let { name, description, privacyMode, isOver18, username } = req.body;

    // Normalize name to remove r/ if user accidentally provided it and trim/standardize
    if (!name) {
        console.log("❌ Error: Name missing");
        return res.status(400).json({ message: "Name is required" });
    }
    name = name.toString().trim();
    if (name.startsWith('r/')) name = name.substring(2);
    // Also lowercase names to enforce uniqueness consistently
    name = name.toLowerCase();

    // DEBUG 2: Check if we have a username to look for
    if (!username) {
        console.log("❌ Error: Username missing from request body");
        return res.status(400).json({ message: "Username is required" });
    }

    console.log(`2. Searching for User: ${username}`);
    
    // Find the User to get the ID
    const user = await User.findOne({ username: username });
    
    if (!user) {
        console.log("❌ Error: User NOT found in Database!");
        return res.status(404).json({ message: "User not found. Please log in again." });
    }

    console.log(`✅ User Found! ID is: ${user._id}`);

    const existing = await Subreddit.findOne({ name });
    if (existing) {
      console.log("❌ Error: Subreddit already exists");
      return res.status(400).json({ message: "Subreddit already exists" });
    }

    // Get file paths if uploaded
    const logoPath = req.files && req.files.logo ? req.files.logo[0].path : null;
    const bannerPath = req.files && req.files.banner ? req.files.banner[0].path : null;
    
    console.log(`3. Logo path: ${logoPath}`);
    console.log(`3. Banner path: ${bannerPath}`);

    // Create the Subreddit using the ID we found
    const newSubreddit = await Subreddit.create({
      name,
      description,
      privacyMode: privacyMode || 'public', 
      isOver18: isOver18 === 'true' || isOver18 === true,    
      creator: user._id,
      logo: logoPath,
      banner: bannerPath,
      members: 1,
      // NEW: Add creator to members list immediately
      membersList: [user._id]
    });

    console.log("✅ SUCCESS! Subreddit created.");
    console.log("=".repeat(50));

    res.status(201).json(newSubreddit);
  } catch (error) {
    console.error("❌ CRASH ERROR:", error); 
    res.status(500).json({ message: error.message });
  }
};

// Get single subreddit by name
const getSubredditByName = async (req, res) => {
  try {
    let name = req.params.name;
    if (name && name.startsWith('r/')) name = name.substring(2);
    console.log(`Fetching subreddit: ${name}`);
    const subreddit = await Subreddit.findOne({ name }).populate('creator', 'username _id');
    if (!subreddit) {
      return res.status(404).json({ message: 'Subreddit not found' });
    }
    res.status(200).json(subreddit);
  } catch (error) {
    console.error("Error fetching subreddit by name:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update subreddit (only by creator)
const updateSubreddit = async (req, res) => {
  try {
    console.log("=".repeat(50));
    console.log("COMMUNITY UPDATE REQUEST");
    console.log("=".repeat(50));
    console.log("1. Incoming req.body:", req.body);
    console.log("1. Incoming req.files:", req.files);

    let { name, description, username } = req.body;

    // Normalize name
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    name = name.toString().trim();
    if (name.startsWith('r/')) name = name.substring(2);
    name = name.toLowerCase();

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    // Find the subreddit
    const subreddit = await Subreddit.findOne({ name }).populate('creator', 'username _id');
    if (!subreddit) {
      return res.status(404).json({ message: 'Subreddit not found' });
    }

    // Find the user
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please log in again." });
    }

    // Check if user is the creator
    if (subreddit.creator._id.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Only the community creator can edit this community" });
    }

    // Prepare update object
    const updateData = {};
    if (description !== undefined) {
      updateData.description = description;
    }

    // Handle file uploads
    if (req.files && req.files.logo) {
      updateData.logo = req.files.logo[0].path;
    }
    if (req.files && req.files.banner) {
      updateData.banner = req.files.banner[0].path;
    }

    // Update the subreddit
    const updatedSubreddit = await Subreddit.findOneAndUpdate(
      { name },
      updateData,
      { new: true }
    ).populate('creator', 'username _id');

    console.log("✅ SUCCESS! Subreddit updated.");
    console.log("=".repeat(50));

    res.status(200).json(updatedSubreddit);
  } catch (error) {
    console.error("❌ CRASH ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- NEW JOIN/LEAVE FEATURES (FIXED LOGIC) ---

const joinSubreddit = async (req, res) => {
    try {
        let { name } = req.params;
        const { username } = req.body;

        if (name && name.startsWith('r/')) name = name.substring(2);

        // Find User
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found" });

        // CRITICAL FIX: Only update IF user is NOT in membersList ($ne = Not Equal)
        // This prevents the count from increasing if they click join twice
        const subreddit = await Subreddit.findOneAndUpdate(
            { name, membersList: { $ne: user._id } }, 
            { 
                $addToSet: { membersList: user._id }, 
                $inc: { members: 1 } 
            },
            { new: true }
        );
        
        // If subreddit is null, check if it was because they were already a member
        if (!subreddit) {
            const existing = await Subreddit.findOne({ name });
            if (!existing) return res.status(404).json({ message: "Subreddit not found" });
            
            // Return success but don't change anything
            return res.status(200).json({ 
                message: "Already joined", 
                members: existing.members, 
                membersList: existing.membersList 
            });
        }

        // Optional: Update User's joinedSubreddits list too
        await User.findByIdAndUpdate(user._id, {
            $addToSet: { joinedSubreddits: subreddit._id }
        });

        res.status(200).json({ message: "Joined", members: subreddit.members, membersList: subreddit.membersList });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const leaveSubreddit = async (req, res) => {
    try {
        let { name } = req.params;
        const { username } = req.body;

        if (name && name.startsWith('r/')) name = name.substring(2);

        // Find User
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: "User not found" });

        // CRITICAL FIX: Only update IF user IS in membersList
        const subreddit = await Subreddit.findOneAndUpdate(
            { name, membersList: user._id }, 
            { 
                $pull: { membersList: user._id }, 
                $inc: { members: -1 } 
            },
            { new: true }
        );

        if (!subreddit) {
            const existing = await Subreddit.findOne({ name });
            if (!existing) return res.status(404).json({ message: "Subreddit not found" });
             
            return res.status(200).json({ 
                message: "Already left", 
                members: existing.members, 
                membersList: existing.membersList 
            });
        }

        // Optional: Update User
        await User.findByIdAndUpdate(user._id, {
            $pull: { joinedSubreddits: subreddit._id }
        });

        res.status(200).json({ message: "Left", members: subreddit.members, membersList: subreddit.membersList });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const searchSubreddits = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query required" });

    const subreddits = await Subreddit.find({
      name: { $regex: q, $options: 'i' }
    })
    .select('name description members logo')
    .limit(10);

    res.json(subreddits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
    getSubreddits, 
    createSubreddit, 
    getSubredditByName, 
    updateSubreddit, 
    joinSubreddit, 
    leaveSubreddit,
    searchSubreddits
};