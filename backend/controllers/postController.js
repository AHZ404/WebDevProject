const Post = require('../models/post');
const User = require('../models/user'); 

// 1. GET POSTS
const getAllPosts = async (req, res) => {
    try {
        const { community } = req.query;
        let filter = {};
        if (community) filter = { community: community };
        const posts = await Post.find(filter).sort({ createdAt: -1 }).select('-__v'); 
        res.status(200).json(posts);
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

// 2. CREATE POST
const createPost = async (req, res) => {
    try {
        const { username, community, title, content, image } = req.body; 
        if (!username || !title) return res.status(400).json({ message: 'Missing fields' });
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const newPost = await Post.create({
            user: user._id, username, community: community || 'r/javascript', 
            title, content, image, votes: 1, commentsCount: 0,
            upvotedBy: [username], // Auto-upvote by creator
            downvotedBy: []
        });
        res.status(201).json(newPost);
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

// 3. GET POSTS BY USER
const getPostsByUser = async (req, res) => {
    try {
        const { username } = req.params;
        const posts = await Post.find({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) { res.status(500).json({ message: 'Server error' }); }
};

// 4. VOTE POST (The Big Fix)
const votePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction, username } = req.body; // <--- Expect Username now

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyUpvoted = post.upvotedBy.includes(username);
    const alreadyDownvoted = post.downvotedBy.includes(username);

    if (direction === 'up') {
        if (alreadyUpvoted) {
            post.votes -= 1;
            post.upvotedBy.pull(username);
        } else if (alreadyDownvoted) {
            post.votes += 2;
            post.downvotedBy.pull(username);
            post.upvotedBy.push(username);
        } else {
            post.votes += 1;
            post.upvotedBy.push(username);
        }
    } else if (direction === 'down') {
        if (alreadyDownvoted) {
            post.votes += 1;
            post.downvotedBy.pull(username);
        } else if (alreadyUpvoted) {
            post.votes -= 2;
            post.upvotedBy.pull(username);
            post.downvotedBy.push(username);
        } else {
            post.votes -= 1;
            post.downvotedBy.push(username);
        }
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) { res.status(500).json({ message: "Error voting" }); }
};

// 5. GET SINGLE POST
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json(post);
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};

module.exports = { getAllPosts, createPost, getPostsByUser, votePost, getPostById };