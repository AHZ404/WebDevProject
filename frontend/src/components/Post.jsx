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

  // Helper function to clean community name (remove r/ if present)
  const cleanCommunityName = (name) => {
    if (!name) return 'all';
    return name.startsWith('r/') ? name.substring(2) : name;
  };

  const communityNameClean = cleanCommunityName(post.community);

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
        <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="community-name">r/{communityNameClean}</span>
            <span style={{ color: '#818384', margin: '0 4px' }}>•</span>
            <span className="posted-by">{new Date(post.time).toLocaleDateString()}</span>
          </div>
          <button 
            className="action-btn" 
            style={{ 
              padding: '4px 8px', 
              margin: 0,
              fontSize: '18px',
              color: '#818384'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            ⋯
          </button>
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
          {/* Delete button for post owner */}
          {currentUser && (currentUser.username || currentUser) === post.username && (
            <button className="action-btn" onClick={async () => {
              if (!confirm('Delete this post?')) return;
              try {
                const username = currentUser.username || currentUser;
                const res = await fetch(`${API_URL}/posts/${post.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
                if (res.ok) {
                  // If parent provided onDelete, call it to update UI
                  if (typeof onVote === 'function' && typeof window !== 'undefined') {
                    // as a fallback reload
                    window.location.reload();
                  } else {
                    window.location.reload();
                  }
                } else {
                  const data = await res.json();
                  alert(data.message || 'Failed to delete post');
                }
              } catch (err) { console.error(err); alert('Failed to delete post'); }
            }}>
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Post;