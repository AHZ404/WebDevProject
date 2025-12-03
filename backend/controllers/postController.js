// postController.js

// 🔑 CRITICAL FIX: Ensure Mongoose Models are correctly required
const Post = require('../models/post'); 
const User = require('../models/user'); 

// ------------------------------------------------------------------
// 1. GET ALL POSTS (For Homepage Feed)
// ------------------------------------------------------------------

/**
 * @desc Get all posts for the homepage feed
 * @route GET /posts
 * @access Public
 */
const getAllPosts = async (req, res) => {
    try {
        // Fetch posts, sort by creation date (newest first), and exclude Mongoose metadata
        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .select('-__v'); 

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching all posts:', error);
        res.status(500).json({ message: 'Server error while fetching feed posts' });
    }
};

// ------------------------------------------------------------------
// 2. CREATE POST (The Fix)
// ------------------------------------------------------------------

/**
 * @desc Create a new post
 * @route POST /posts
 * @access Private (Simulated)
 */
const createPost = async (req, res) => {
    try {
        const { username, community, title, content, image } = req.body; 

        if (!username || !title) {
            return res.status(400).json({ message: 'Title and username are required.' });
        }
        
        // 🔑 CRITICAL FIX: Find the User object to get their Mongoose ObjectId (_id).
        // This solves the 'user: Path is required' validation error.
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'Posting user not found in database.' });
        }
        
        const newPost = await Post.create({
            // Pass the user's ObjectId
            user: user._id, 
            // Pass the username string (as required by your schema)
            username, 
            community: community || 'r/javascript', 
            title,
            content,
            image,
            votes: 1, 
            commentsCount: 0,
        });

        // Update user's post karma (relies on the User model)
        await User.findOneAndUpdate(
            { username: username }, 
            { $inc: { 'karma.postKarma': 1 } }
        );

        res.status(201).json(newPost);
        
    } catch (error) {
        // This console log will show any remaining validation errors (e.g., if a title is too long)
        console.error('Error creating post:', error.message);
        res.status(500).json({ message: 'Server error while creating post' });
    }
};

// ------------------------------------------------------------------
// 3. GET POSTS BY USER (For Profile Page - Already Fixed)
// ------------------------------------------------------------------

/**
 * @desc Get all posts by a specific user (for profile page)
 * @route GET /users/:username/posts
 * @access Public
 */
const getPostsByUser = async (req, res) => {
    try {
        const { username } = req.params;

        // Query by username string (case-insensitive for robustness)
        const posts = await Post.find({ username: { $regex: new RegExp(`^${username}$`, 'i') } })
            .sort({ createdAt: -1 }) 
            .select('-__v'); 
            
        res.status(200).json(posts);

    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: 'Server error while fetching user posts' });
    }
};


module.exports = {
    getAllPosts,
    createPost,
    getPostsByUser,
};