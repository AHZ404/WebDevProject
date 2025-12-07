const Comment = require('../models/comment');
const Post = require('../models/post');
const User = require('../models/user'); 

// 1. CREATE COMMENT
const createComment = async (req, res) => {
  try {
    const { content, postId, parentId, username } = req.body;
    if (!content || !postId || !username) return res.status(400).json({ message: "Missing fields" });
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = await Comment.create({
      content, post: postId, parentComment: parentId || null, author: user._id,
      upvotedBy: [username], // Auto-upvote own comment
      downvotedBy: []
    });
    post.commentsCount += 1;
    await post.save();
    await newComment.populate('author', 'username');
    res.status(201).json(newComment);
  } catch (error) { res.status(500).json({ message: "Failed to create comment" }); }
};

// 2. GET POST COMMENTS
const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await Comment.find({ post: postId }).populate('author', 'username').sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (error) { res.status(500).json({ message: "Failed to fetch comments" }); }
};

// 3. VOTE COMMENT
const voteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction, username } = req.body; 

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const alreadyUpvoted = comment.upvotedBy.includes(username);
    const alreadyDownvoted = comment.downvotedBy.includes(username);

    if (direction === 'up') {
        if (alreadyUpvoted) {
            comment.votes -= 1;
            comment.upvotedBy.pull(username);
        } else if (alreadyDownvoted) {
            comment.votes += 2;
            comment.downvotedBy.pull(username);
            comment.upvotedBy.push(username);
        } else {
            comment.votes += 1;
            comment.upvotedBy.push(username);
        }
    } else if (direction === 'down') {
        if (alreadyDownvoted) {
            comment.votes += 1;
            comment.downvotedBy.pull(username);
        } else if (alreadyUpvoted) {
            comment.votes -= 2;
            comment.upvotedBy.pull(username);
            comment.downvotedBy.push(username);
        } else {
            comment.votes -= 1;
            comment.downvotedBy.push(username);
        }
    }

    await comment.save();
    res.status(200).json(comment);
  } catch (error) { res.status(500).json({ message: "Error voting" }); }
};

// 4. GET COMMENTS BY USER (THIS WAS MISSING!)
const getCommentsByUser = async (req, res) => {
    try {
        const { username } = req.params;
        
        // 1. Find the User ID from the username string
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Find comments where 'author' matches that ID
        const comments = await Comment.find({ author: user._id })
            .sort({ createdAt: -1 })
            .populate('post', 'title community') // Get the post info
            .populate('author', 'username');     // Get the author info

        res.status(200).json(comments);
    } catch (error) {
        console.error("Error fetching user comments:", error);
        res.status(500).json({ message: "Failed to fetch user comments" });
    }
};

module.exports = { 
    createComment, 
    getPostComments, 
    voteComment,
    getCommentsByUser // Now this will work because the function is defined above
};