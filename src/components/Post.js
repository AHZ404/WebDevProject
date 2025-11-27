import React from 'react';

const Post = ({ post, onVote }) => {
  const getVoteButtonStyle = (direction) => {
    if (post.userVote === direction) {
      return { color: direction === 1 ? '#ff4500' : '#7193ff' };
    }
    return {};
  };

  return (
    <div className="post-card">
      <div className="post-votes">
        <button 
          className="vote-btn"
          onClick={() => onVote(post.id, 1)}
          style={getVoteButtonStyle(1)}
        >
          ▲
        </button>
        <div className="vote-count">{post.votes}</div>
        <button 
          className="vote-btn"
          onClick={() => onVote(post.id, -1)}
          style={getVoteButtonStyle(-1)}
        >
          ▼
        </button>
      </div>
      <div className="post-content">
        <div className="post-header">
          <span className="community-name">{post.community}</span>
          <span className="posted-by">Posted by {post.user} {post.time}</span>
        </div>
        <h3 className="post-title">{post.title}</h3>
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