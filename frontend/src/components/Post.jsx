import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from './config'; // Make sure this is imported

const Post = ({ post, onVote, currentUser }) => {
  const [votes, setVotes] = useState(post.votes);
  const [userVote, setUserVote] = useState(0); 


  useEffect(() => {
    setVotes(post.votes);

    if (post.userVote !== undefined) {
        setUserVote(post.userVote);
    } 
    else if (currentUser) {
        const username = currentUser.username || currentUser;
        const upvoted = (post.upvotedBy || []).includes(username);
        const downvoted = (post.downvotedBy || []).includes(username);

        if (upvoted) setUserVote(1);
        else if (downvoted) setUserVote(-1);
        else setUserVote(0);
    } 
    else {
        setUserVote(0);
    }
  }, [currentUser, post]);

  const getVoteButtonStyle = (direction) => {
    if (userVote === direction) {
      return { color: direction === 1 ? '#ff4500' : '#7193ff' };
    }
    return {};
  };

  const handleVote = (directionStr) => {
    onVote(post.id, directionStr);
    if (!currentUser) return; 

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

  const communityNameClean = post.community ? post.community.replace('r/', '') : 'all';

  // --- NEW: Helper to fix the image URL ---
  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // It's already a full link
    
    // If API_URL is http://localhost:5000/api, we need just http://localhost:5000
    // We remove the '/api' part to get the base server URL
    const baseUrl = API_URL.replace('/api', ''); 
    return `${baseUrl}${path}`;
  };

  const finalMediaUrl = getMediaUrl(post.mediaUrl);
  // ---------------------------------------

  return (
    <div className="post-card">
      <div className="post-votes">
        <button 
          className="vote-btn"
          onClick={() => handleVote('up')}
          style={getVoteButtonStyle(1)}
        >
          ️⇧
        </button>
        <div className="vote-count">{votes}</div>
        <button 
          className="vote-btn"
          onClick={() => handleVote('down')}
          style={getVoteButtonStyle(-1)}
        >
          ⇩
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

      {/* --- UPDATED MEDIA DISPLAY LOGIC --- */}
      {finalMediaUrl && finalMediaUrl.endsWith('.mp4') ? (
        <video
            src={finalMediaUrl}
            controls
            muted
            loop
            style={{ maxWidth: '100%', maxHeight: '500px', display: 'block', margin: '10px 0' }}
        />
        ) : finalMediaUrl ? (
        <img 
            src={finalMediaUrl} 
            alt="Post content" 
            style={{ maxWidth: '100%', maxHeight: '500px', display: 'block', margin: '10px 0' }}
            onError={(e) => { e.target.style.display = 'none'; }} // Hides broken images
        />
        ) : null}
        {/* ----------------------------------- */}

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