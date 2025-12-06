// postController.js

// 🔑 CRITICAL FIX: Ensure Mongoose Models are correctly required
const Post = require('../models/post'); 
const User = require('../models/user'); 

// ------------------------------------------------------------------
// 1. GET POSTS (Modified for Filtering)
// ------------------------------------------------------------------

/**
 * @desc Get posts (All posts OR filtered by community)
 * @route GET /posts?community=r/reactjs
 * @access Public
 */
const getAllPosts = async (req, res) => {
    try {
        // <--- NEW: Check if the URL has a community filter (e.g., /posts?community=r/reactjs)
        const { community } = req.query;
        
        let filter = {};
        if (community) {
            // If community exists, tell MongoDB to only find posts matching that name
            filter = { community: community };
        }

        // Pass the 'filter' to .find(). If filter is empty {}, it returns everything.
        const posts = await Post.find(filter)
            .sort({ createdAt: -1 })
            .select('-__v'); 

        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Server error while fetching posts' });
    }
};

// ------------------------------------------------------------------
// 2. CREATE POST
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
        
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'Posting user not found in database.' });
        }
        
        const newPost = await Post.create({
            user: user._id, 
            username, 
            community: community || 'r/javascript', 
            title,
            content,
            image,
            votes: 1, 
            commentsCount: 0,
        });

        await User.findOneAndUpdate(
            { username: username }, 
            { $inc: { 'karma.postKarma': 1 } }
        );

        res.status(201).json(newPost);
        
    } catch (error) {
        console.error('Error creating post:', error.message);
        res.status(500).json({ message: 'Server error while creating post' });
    }
};

// ------------------------------------------------------------------
// 3. GET POSTS BY USER
// ------------------------------------------------------------------

/**
 * @desc Get all posts by a specific user (for profile page)
 * @route GET /users/:username/posts
 * @access Public
 */
const getPostsByUser = async (req, res) => {
    try {
        const { username } = req.params;

        const posts = await Post.find({ username: { $regex: new RegExp(`^${username}$`, 'i') } })
            .sort({ createdAt: -1 }) 
            .select('-__v'); 
            
        res.status(200).json(posts);

    } catch (error) {
        console.error('Error fetching user posts:', error);
        res.status(500).json({ message: 'Server error while fetching user posts' });
    }
};

const votePost = async (req, res) => {
  try {
    const { id } = req.params;      // The Post ID from the URL
    const { direction } = req.body; // 'up' or 'down'

    const post = await Post.findById(id);
    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    // Simple voting logic (just increments/decrements count)
    // Note: A real production app would track *who* voted to prevent duplicate votes.
    if (direction === 'up') {
      post.votes += 1;
    } else if (direction === 'down') {
      post.votes -= 1;
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Error voting on post" });
  }
};

module.exports = {
  getAllPosts,
  createPost,
  getPostsByUser,
  votePost // <--- ADD THIS
};