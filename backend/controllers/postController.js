
const Post = require('../models/post');
const User = require('../models/user');
const http = require('http');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Helper function for debug logging
const fs = require('fs');
const path = require('path');
const debugLog = (location, message, data, hypothesisId, runId = 'run1') => {
    try {
        const logData = JSON.stringify({
            location,
            message,
            data,
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId,
            hypothesisId
        });
        // Write to file as primary method
        const logPath = path.join(__dirname, '../../.cursor/debug.log');
        // Ensure directory exists
        const logDir = path.dirname(logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(logPath, logData + '\n');
        // Also try HTTP (non-blocking)
        try {
            const req = http.request({
                hostname: '127.0.0.1',
                port: 7242,
                path: '/ingest/eb9f592d-6c6e-42f5-ac3f-390714336380',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, () => {});
            req.on('error', () => {});
            req.write(logData);
            req.end();
        } catch (e) {}
    } catch (e) {
        console.error('Debug log error:', e);
    }
}; 


const calculateHotScore = (post) => {
    return (post.votes || 0) + (post.commentsCount || 0);
};

// 1. GET POSTS (Updated for Advanced Sorting)
const getAllPosts = async (req, res) => {
    try {
        console.log('🔵 getAllPosts called with query:', req.query);
        // #region agent log
        debugLog('postController.js:37', 'getAllPosts called', { query: req.query, url: req.url }, 'E');
        // #endregion
        const { community, sortBy } = req.query; 
        let filter = {};
        let sortCriteria = {}; 
        
        // 1. Filtering Logic - Normalize community name (remove r/ prefix and lowercase)
        // Store the cleaned community name for later use in fallback filtering
        let cleanCommunityForFilter = null;
        if (community) {
            cleanCommunityForFilter = community.toString().trim();
            if (cleanCommunityForFilter.startsWith('r/')) {
                cleanCommunityForFilter = cleanCommunityForFilter.substring(2);
            }
            cleanCommunityForFilter = cleanCommunityForFilter.toLowerCase();
            
            // Escape special regex characters for regex matching
            const escapedCommunity = cleanCommunityForFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Use case-insensitive regex for matching (handles both old data with r/ prefix and new data without)
            // Match: "ainshams", "Ainshams", "r/ainshams", "r/Ainshams", etc.
            // Using $regex with 'i' flag for case-insensitive matching
            filter = { 
                $or: [
                    // Match without r/ prefix (case-insensitive) - handles "ainshams", "Ainshams"
                    { community: { $regex: `^${escapedCommunity}$`, $options: 'i' } },
                    // Match with r/ prefix (case-insensitive) - handles "r/ainshams", "r/Ainshams"
                    { community: { $regex: `^r/${escapedCommunity}$`, $options: 'i' } }
                ]
            };
            console.log(`🔍 Filtering posts by community: "${community}" -> normalized: "${cleanCommunityForFilter}"`);
            console.log(`🔍 Filter object:`, JSON.stringify(filter, null, 2));
        }

        const sortOption = sortBy?.toLowerCase() || 'new'; // Default to 'new'
        
        // If filtering by community, ALWAYS use permissive in-memory filter to catch all posts
        // regardless of how they're stored (with/without r/ prefix, different cases, etc.)
        if (cleanCommunityForFilter) {
            console.log(`🔍 Using permissive filter for community: "${cleanCommunityForFilter}"`);
            
            // #region agent log
            debugLog('postController.js:49', 'Starting community filter - before DB query', { cleanCommunityForFilter, originalCommunity: community }, 'B');
            // #endregion
            
            // Fetch ALL posts (no limit) and filter in memory to ensure we get every single post
            let allPosts = await Post.find({})
                                    .sort({ createdAt: -1 })
                                    .select('-__v');
            
            console.log(`📊 Total posts in database: ${allPosts.length}`);
            console.log(`📊 Sample community names from DB:`, [...new Set(allPosts.slice(0, 20).map(p => p.community))]);
            
            // #region agent log
            debugLog('postController.js:56', 'After DB query - all posts fetched', { 
                totalPosts: allPosts.length, 
                oldestPostDate: allPosts.length > 0 ? allPosts[allPosts.length - 1].createdAt : null, 
                newestPostDate: allPosts.length > 0 ? allPosts[0].createdAt : null, 
                sampleCommunities: allPosts.slice(0, 10).map(p => p.community),
                allUniqueCommunities: [...new Set(allPosts.map(p => p.community))].slice(0, 30)
            }, 'B');
            // #endregion
            
            // Filter posts by normalized community name
            let posts = allPosts.filter(post => {
                const postCommunity = (post.community || '').toString().toLowerCase().trim();
                const cleanPostCommunity = postCommunity.startsWith('r/') 
                    ? postCommunity.substring(2).trim()
                    : postCommunity.trim();
                const matches = cleanPostCommunity === cleanCommunityForFilter;
                
                // #region agent log
                // Log first 10 posts and all matches to see what's happening
                const postIndex = allPosts.indexOf(post);
                if (postIndex < 10 || matches) {
                    debugLog('postController.js:65', 'Filtering post - comparison result', { 
                        postId: post._id.toString(), 
                        originalCommunity: post.community,
                        postCommunity, 
                        cleanPostCommunity, 
                        cleanCommunityForFilter, 
                        matches, 
                        postDate: post.createdAt,
                        postIndex
                    }, 'C');
                }
                // #endregion
                
                return matches;
            });
            
            // #region agent log
            debugLog('postController.js:70', 'After filtering - matched posts', { 
                matchedCount: posts.length, 
                totalSearched: allPosts.length, 
                oldestMatchedDate: posts.length > 0 ? posts[posts.length - 1].createdAt : null, 
                newestMatchedDate: posts.length > 0 ? posts[0].createdAt : null 
            }, 'C');
            // #endregion
            
            console.log(`📤 Found ${posts.length} posts for community "${cleanCommunityForFilter}" (searched ${allPosts.length} total posts)`);
            
            // Debug: Show sample of all community names in DB if no posts found
            if (posts.length === 0) {
                const uniqueCommunities = [...new Set(allPosts.map(p => p.community))].slice(0, 20);
                console.log(`⚠️ No posts found! Sample community names in DB:`, uniqueCommunities);
                console.log(`⚠️ Looking for: "${cleanCommunityForFilter}"`);
                
                // Log normalized versions for comparison
                const normalizedCommunities = uniqueCommunities.map(c => {
                    const cLower = (c || '').toString().toLowerCase().trim();
                    const cClean = cLower.startsWith('r/') ? cLower.substring(2).trim() : cLower;
                    return { original: c, normalized: cClean };
                });
                console.log(`⚠️ Normalized community names:`, normalizedCommunities.slice(0, 10));
                
                // Try to find similar community names (fuzzy match)
                const similarCommunities = uniqueCommunities.filter(c => {
                    const cLower = (c || '').toString().toLowerCase().trim();
                    const cClean = cLower.startsWith('r/') ? cLower.substring(2).trim() : cLower;
                    return cClean.includes(cleanCommunityForFilter) || cleanCommunityForFilter.includes(cClean);
                });
                if (similarCommunities.length > 0) {
                    console.log(`💡 Similar community names found:`, similarCommunities);
                }
            } else {
                // Show first few matches for debugging
                console.log(`✅ Sample matched posts:`, posts.slice(0, 3).map(p => ({
                    id: p._id,
                    community: p.community,
                    title: p.title?.substring(0, 30)
                })));
            }
            
            // Apply sorting
            if (sortOption === 'hot' || sortOption === 'rising' || sortOption === 'best') {
                // Apply the complex 'Hot' sort in JavaScript
                if (sortOption === 'hot') {
                    posts = posts.map(post => ({
                        ...post.toObject(),
                        hotScore: calculateHotScore(post)
                    }));
                    posts.sort((a, b) => b.hotScore - a.hotScore);
                }
                // 'Rising' and 'Best' logic can be refined here if needed
            } else {
                // For simple sorts ('new', 'old')
                switch (sortOption) {
                    case 'old': 
                        posts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                        break;
                    case 'new':
                    default:
                        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                        break;
                }
            }
            
            // #region agent log
            debugLog('postController.js:118', 'Before sending response - final posts', { 
                finalCount: posts.length, 
                sortOption, 
                oldestDate: posts.length > 0 ? posts[posts.length - 1].createdAt : null, 
                newestDate: posts.length > 0 ? posts[0].createdAt : null 
            }, 'D');
            // #endregion
            
            return res.status(200).json(posts);
        }
        
        // If not filtering by community, use normal MongoDB query
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
            // For simple sorts ('new', 'old') use MongoDB's native sorting
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

            console.log(`📤 Returning ${posts.length} posts with filter:`, JSON.stringify(filter));
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
        let { username, community, title, content, image } = req.body; 
        if (!username || !title) return res.status(400).json({ message: 'Missing fields' });
        
        // Normalize community name to remove r/ prefix if present
        if (community) {
            community = community.toString().trim();
            if (community.startsWith('r/')) community = community.substring(2);
        }
        
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const newPost = await Post.create({
            user: user._id, username, community: community || 'javascript', 
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

// 6. DELETE POST (User or Admin)
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, adminUsername, adminPassword } = req.body || {};

    console.log('DELETE /posts/:id called', { id, body: req.body });

    const post = await Post.findById(id);
    if (!post) {
      console.log('Post not found for id', id);
      return res.status(404).json({ message: 'Post not found' });
    }

    // If admin credentials provided, verify admin
    if (adminUsername && adminPassword) {
      console.log('Admin credentials provided for deletion', adminUsername);
      const admin = await User.findOne({ username: adminUsername });
      if (!admin || admin.role !== 'admin') {
        console.log('Admin not found or not admin role', adminUsername);
        return res.status(403).json({ message: 'Invalid admin credentials' });
      }
      const bcrypt = require('bcryptjs');
      const match = await bcrypt.compare(adminPassword, admin.password);
      if (!match) {
        console.log('Admin password mismatch for', adminUsername);
        return res.status(403).json({ message: 'Invalid admin credentials' });
      }

      // Admin authorized: delete post and related comments
      // Record admin action
      try {
        const AdminAction = require('../models/adminAction');
        await AdminAction.create({
          admin: admin._id,
          actionType: 'delete',
          targetType: 'post',
          targetId: id,
          targetSummary: post.title || post._id.toString(),
          details: `Deleted post by ${post.username}`
        });
      } catch (err) {
        console.error('Failed to record admin action (post delete):', err);
      }

      await Post.findByIdAndDelete(id);
      const Comment = require('../models/comment');
      await Comment.deleteMany({ post: id });
      console.log('Post deleted by admin', id);
      return res.status(200).json({ message: 'Post deleted by admin' });
    }

    // Otherwise, verify that username is the post owner (case-insensitive)
    if (!username) {
      console.log('No username provided for deletion');
      return res.status(400).json({ message: 'Username required to delete post' });
    }

    if (!post.username || post.username.toLowerCase() !== username.toString().toLowerCase()) {
      console.log('Unauthorized delete attempt', { postOwner: post.username, attemptingUser: username });
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Record owner deletion in AdminAction table for audit (optional)
    try {
      const ownerUser = await User.findOne({ username });
      if (ownerUser) {
        const AdminAction = require('../models/adminAction');
        await AdminAction.create({
          admin: ownerUser._id,
          actionType: 'delete',
          targetType: 'post',
          targetId: id,
          targetSummary: post.title || post._id.toString(),
          details: `Owner deleted their post`
        });
      }
    } catch (err) {
      console.error('Failed to record owner delete action (post):', err);
    }

    await Post.findByIdAndDelete(id);
    const Comment = require('../models/comment');
    await Comment.deleteMany({ post: id });
    console.log('Post deleted by owner', id);
    res.status(200).json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// CORRECTED searchPosts function in postController.js

const searchPosts = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const posts = await Post.find({
        $or: [
            { title: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } },
            { community: { $regex: q, $options: 'i' } }
        ]
         }).sort({ createdAt: -1 });

        // Removed the duplicate 'res.json(posts)' line.
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error in searchPosts:", error);
        res.status(500).json({ message: error.message });
    }
};


const summarizePost = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "No content to summarize" });

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY in .env file");
    }

    console.log("1. Fetching model list from Google...");

    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const listData = await listResponse.json();

    if (listData.error) {
        throw new Error("Google API Error: " + listData.error.message);
    }

    const availableModels = listData.models || [];
    
    const SAFE_MODELS = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-8b",
        "gemini-1.0-pro",
        "gemini-pro" 
    ];

    let selectedModelObj = availableModels.find(m => {
        const name = m.name.replace("models/", "");
        return SAFE_MODELS.includes(name) && !name.includes("latest");
    });

    // Fallback: If exact matches fail, find *any* "flash" model that isn't "latest"
    if (!selectedModelObj) {
        selectedModelObj = availableModels.find(m => 
            m.name.includes("flash") && !m.name.includes("latest")
        );
    }

    if (!selectedModelObj) {
        // If absolutely nothing safe is found, list what we HAVE so we can debug
        console.log("Only found these models (none were safe):", availableModels.map(m => m.name));
        throw new Error("No free-tier models found for this API Key.");
    }

    const modelName = selectedModelObj.name.replace("models/", ""); 
    console.log(`2. Selected Safe Model: ${modelName}`);

    // STEP 3: Generate Summary
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `Summarize the following Reddit post. Return ONLY the summary text. Do not use introductory phrases like "Here is a summary" or "The user is saying". Just give the summary directly.\n\nPost Content: "${content}"`
                }]
            }]
        })
    });

    const data = await response.json();

    // Handle Rate Limits (429) Gracefully
    if (data.error) {
        if (data.error.code === 429) {
            return res.status(429).json({ message: "AI is busy. Please wait 30 seconds." });
        }
        throw new Error(data.error.message);
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!summary) throw new Error("AI returned empty response.");

    console.log("3. Success!");
    res.status(200).json({ summary });

  } catch (error) {
    console.error("AI Controller Error:", error.message);
    res.status(500).json({ message: "AI Error: " + error.message });
  }
};


module.exports = { getAllPosts, createPost, getPostsByUser, votePost, getPostById , searchPosts, deletePost, summarizePost };