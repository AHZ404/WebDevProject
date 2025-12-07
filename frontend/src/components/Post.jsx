import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import './Post.css'; 

const Post = ({ post, onVote, currentUser }) => {
  // 1. Add Local State (Just like CommentItem)
  const [votes, setVotes] = useState(post.votes);
  const [userVote, setUserVote] = useState(0); 

  // 2. The "Instant Update" Effect
  useEffect(() => {
    // Sync local state with props first (in case data changes from backend)
    setVotes(post.votes);

    if (currentUser) {
        // If Logged In: Check the lists passed in props
        const username = currentUser.username || currentUser;
        const upvoted = (post.upvotedBy || []).includes(username);
        const downvoted = (post.downvotedBy || []).includes(username);

        if (upvoted) setUserVote(1);
        else if (downvoted) setUserVote(-1);
        else setUserVote(0);
    } else {
        // If Logged Out: Reset to Grey INSTANTLY
        setUserVote(0);
    }
  }, [currentUser, post]); // Runs when User or Post data changes

  const getVoteButtonStyle = (direction) => {
    if (userVote === direction) {
      return { color: direction === 1 ? '#ff4500' : '#7193ff' };
    }
    return {};
  };

  const handleVote = (directionStr) => {
    // Call the parent function to update Backend/App state
    onVote(post.id, directionStr);

    // Optimistically update Local State (so it feels fast)
    if (!currentUser) return; // Parent will handle alert

    let newVotes = votes;
    let newUserVote = userVote;

    if (userVote === 0) {
        if (directionStr === 'up') { newVotes += 1; newUserVote = 1; }
        else { newVotes -= 1; newUserVote = -1; }
    } else if (userVote === 1) {
        if (directionStr === 'up') { newVotes -= 1; newUserVote = 0; } 
        else { newVotes -= 2; newUserVote = -1; }
    } else if (userVote === -1) {
        if (directionStr === 'up') { newVotes += 2; newUserVote = 1; } 
        else { newVotes += 1; newUserVote = 0; }
    }

    setVotes(newVotes);
    setUserVote(newUserVote);
  };

  // Safe URL for the title link
  const communityNameClean = post.community ? post.community.replace('r/', '') : 'all';

  return (
    <div className="post-card">
      <div className="post-votes">
        <button 
          className="vote-btn"
          onClick={() => handleVote('up')}
          style={getVoteButtonStyle(1)}
        >
          ▲
        </button>
        <div className="vote-count">{votes}</div>
        <button 
          className="vote-btn"
          onClick={() => handleVote('down')}
          style={getVoteButtonStyle(-1)}
        >
          ▼
        </button>
      </div>
      <div className="post-content">
        <div className="post-header">
          <span className="community-name">{post.community}</span>
          <span className="posted-by">Posted by {post.user} {new Date(post.time).toLocaleDateString()}</span>
        </div>
        
        <Link 
            to={`/r/${communityNameClean}/comments/${post.id}`} 
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <h3 className="post-title">{post.title}</h3>
        </Link>

        {post.content && <p className="post-body">{post.content}</p>}
        {post.image && (
          <img 
            src={post.image} 
            alt="Post" 
            className="post-image" 
          />
        )}
        <div className="post-actions">
          <button className="action-btn">
            <span>💬</span>
            {post.comments} Comments
          </button>
          <button className="action-btn">
            <span>🔄</span>
            Share
          </button>
          <button className="action-btn">
            <span>📌</span>
            Save
          </button>
          <button className="action-btn">
            <span>⋯</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Post;