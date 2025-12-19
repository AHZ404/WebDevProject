import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from './config';

const Post = ({ post, onVote, currentUser }) => {
  const [votes, setVotes] = useState(post.votes);
  const [userVote, setUserVote] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // State for image zoom modal
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Sync state with props
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

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showShareMenu && !e.target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showShareMenu]);

  // Prevent background scrolling when image is zoomed
  useEffect(() => {
    if (isImageZoomed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isImageZoomed]);

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
        else { newVotes -= 1; newUserVote = 0; }
    }

    setVotes(newVotes);
    setUserVote(newUserVote);
  };

  const cleanCommunityName = (name) => {
    if (!name) return 'all';
    return name.startsWith('r/') ? name.substring(2) : name;
  };

  const communityNameClean = cleanCommunityName(post.community);

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = API_URL.replace('/api', ''); 
    return `${baseUrl}${path}`;
  };

  const finalMediaUrl = getMediaUrl(post.mediaUrl);

  const handleCommentsClick = () => {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyLink = () => {
    const postUrl = `${window.location.origin}/r/${communityNameClean}/comments/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    setShowShareMenu(false);
    alert('Link copied to clipboard!');
  };

  const handleCrosspost = () => {
    alert('Crosspost feature - would navigate to create post with this post as source');
    setShowShareMenu(false);
  };

  return (
    <div className="post-card">
      
      {/* --- IMAGE ZOOM MODAL --- */}
      {isImageZoomed && finalMediaUrl && (
        <div 
          className="zoom-overlay"
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          onClick={() => setIsImageZoomed(false)}
        >
          <img 
            src={finalMediaUrl} 
            alt="Zoomed post content" 
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain',boxShadow: '0 0 20px rgba(0,0,0,0.5)'  }} 
          />
          <button 
           style={{ position: 'absolute', top: '20px', right: '20px', background: '#333', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '20px' }}
           onClick={(e) => {
                e.stopPropagation();
                setIsImageZoomed(false);
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="post-votes">
        <button 
          className="vote-btn"
          onClick={() => handleVote('up')}
          style={getVoteButtonStyle(1)}
        >
          ⇧
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
        <div className="post-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Top Line: Community Name */}
            <Link 
              to={`/r/${communityNameClean}`}
              className="community-name" 
              style={{ fontWeight: 'bold', fontSize: '12px', textDecoration: 'none' }}
              onClick={(e) => e.stopPropagation()} 
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              r/{communityNameClean}
            </Link>
            
            {/* Bottom Line: User and Date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#818384', marginTop: '2px' }}>
              <Link 
                to={`/${post.user}`} 
                style={{ color: 'inherit', textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()} 
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                <span className="posted-by">{post.user || 'u/unknown'}</span>
              </Link>
              
              <span>•</span>
              <span>{new Date(post.time).toLocaleDateString()}</span>
            </div>
          </div>

          <button 
            className="action-btn" 
            style={{ padding: '4px 8px', margin: 0, fontSize: '18px', color: '#818384' }}
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

        {/* --- MEDIA DISPLAY LOGIC --- */}
        {finalMediaUrl && (
          <div className="media-wrapper" style={{ margin: '10px 0' }}>
            {finalMediaUrl.endsWith('.mp4') ? (
              <video
                src={finalMediaUrl}
                controls
                muted
                loop
                style={{ maxWidth: '100%', maxHeight: '500px', display: 'block' }}
              />
            ) : (
              <img 
                src={finalMediaUrl} 
                alt="Post content" 
                onClick={() => setIsImageZoomed(true)} // Click to zoom
                style={{ maxWidth: '100%', maxHeight: '500px', display: 'block', cursor: 'zoom-in', borderRadius: '4px' }} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </div>
        )}

        <div className="post-actions">
          <Link 
            to={`/r/${communityNameClean}/comments/${post.id}`}
            onClick={handleCommentsClick}
            style={{ textDecoration: 'none' }}
          >
            <button className="action-btn">
              <span>💬</span>
              {post.comments} Comments
            </button>
          </Link>
          
          <div style={{ position: 'relative', display: 'inline-block' }} className="share-menu-container">
            <button 
              className="action-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowShareMenu(!showShareMenu);
              }}
            >
              <span>🔄</span>
              Share
            </button>

            {showShareMenu && (
              <div 
                style={{ position: 'absolute', top: '100%', left: 0, backgroundColor: '#1a1a1b', border: '1px solid #343536', borderRadius: '4px', marginTop: '4px', minWidth: '150px', zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              >
                <button 
                  onClick={handleCopyLink}
                  style={{ width: '100%', padding: '8px 12px', textAlign: 'left', backgroundColor: 'transparent', border: 'none', color: '#d7dadc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#272729'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span>🔗</span>
                  Copy link
                </button>
                <button 
                  onClick={handleCrosspost}
                  style={{ width: '100%', padding: '8px 12px', textAlign: 'left', backgroundColor: 'transparent', border: 'none', color: '#d7dadc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#272729'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span>🔀</span>
                  Crosspost
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;