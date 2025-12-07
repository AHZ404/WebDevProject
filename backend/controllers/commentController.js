const Comment = require('../models/comment');
const Post = require('../models/post');
const User = require('../models/user'); 

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

const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await Comment.find({ post: postId }).populate('author', 'username').sort({ createdAt: -1 });
        res.status(200).json(comments);
    } catch (error) { res.status(500).json({ message: "Failed to fetch comments" }); }
};

const voteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction, username } = req.body; // <--- Expect Username

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

module.exports = { createComment, getPostComments, voteComment };