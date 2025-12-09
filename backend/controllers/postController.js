const Post = require('../models/post');
const User = require('../models/user'); 


const calculateHotScore = (post) => {
    return (post.votes || 0) + (post.commentsCount || 0);
};

// 1. GET POSTS (Updated for Advanced Sorting)
const getAllPosts = async (req, res) => {
    try {
        const { community, sortBy } = req.query; 
        let filter = {};
        let sortCriteria = {}; 
        
        // 1. Filtering Logic
        if (community) filter = { community: community };

        const sortOption = sortBy?.toLowerCase() || 'new'; // Default to 'hot'
        
        // Handling 'Hot' specially as it requires client-side sorting after fetching
        if (sortOption === 'hot' || sortOption === 'rising' || sortOption === 'best') {
            // Fetch posts without complex sorting, rely on JS for final sort.
            // We fetch a larger limit sorted by creation date just to get fresh posts.
            let posts = await Post.find(filter)
                                    .sort({ createdAt: -1 })
                                    .limit(500) // Fetch enough posts to run the algorithm on
                                    .select('-__v');

            // Apply the complex 'Hot' sort in JavaScript
            if (sortOption === 'hot') {
                 posts = posts.map(post => ({
                    ...post.toObject(), // Convert Mongoose document to plain object
                    hotScore: calculateHotScore(post) // Calculate the complex score
                 }));
                 // Final sort based on the calculated score
                 posts.sort((a, b) => b.hotScore - a.hotScore); 
            } 
            // 'Rising' and 'Best' logic can be refined here if needed

            // Send back the sorted results (you might want to paginate this later)
            return res.status(200).json(posts);

        } else {
            // For simple sorts ('new', 'top') use MongoDB's native sorting
            switch (sortOption) {
                case 'new':
                    sortCriteria = { createdAt: -1 }; 
                    break;
                    case 'old': 
                    sortCriteria = { createdAt: 1 };
                    break;
                
                default:
                    sortCriteria = { createdAt: -1 };
                    break;
            }

            // Apply filtering and dynamic sorting using MongoDB
            const posts = await Post.find(filter)
                                    .sort(sortCriteria)
                                    .select('-__v'); 

            res.status(200).json(posts);
        }

    } catch (error) { 
        console.error("Error in getAllPosts:", error); 
        res.status(500).json({ message: 'Server error' }); 
    }
};

// 2. CREATE POST
// ... (rest of the controller functions: createPost, getPostsByUser, votePost, getPostById)
// ...
// Ensure you update the module.exports at the end to include all functions
// module.exports = { getAllPosts, createPost, getPostsByUser, votePost, getPostById };

// 2. CREATE POST
const createPost = async (req, res) => {
    try {
                console.log('📦 Request body:', req.body); // <--- ADD THIS
        console.log('📁 File:', req.file); // <--- ADD THIS
        const mediaPath = req.file ? `/uploads/${req.file.filename}` : null;
        const mediaUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;
        const { username, community, title, content, image } = req.body; 
        if (!username || !title) return res.status(400).json({ message: 'Missing fields' });
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const newPost = await Post.create({
            user: user._id, username, community: community || 'r/javascript', 
            title, content, media: mediaPath, mediaUrl: mediaUrl, votes: 1, commentsCount: 0,
            upvotedBy: [username], // Auto-upvote by creator
            downvotedBy: []
        });
        res.status(201).json(newPost);
    } catch (error) { 
        console.error('❌ Full error:', error); // <--- CHANGE THIS to see full error
        res.status(500).json({ message: 'Server error', error: error.message }); // <--- ADD error.message
    }
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