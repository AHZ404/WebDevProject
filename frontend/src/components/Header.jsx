import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css'; 

const Header = ({ currentUser, onAuthClick, onLogout, onCreateCommunityClick, onCreatePostClick }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState({ posts: [], communities: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detect if we're on a community page and extract community name
  const isCommunityPage = location.pathname.startsWith('/r/') && !location.pathname.includes('/comments/');
  let currentCommunity = null;
  if (isCommunityPage) {
    const match = location.pathname.match(/^\/r\/([^\/]+)/);
    if (match) {
      currentCommunity = match[1];
    }
  }

  // Fetch suggestions as user types
  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions({ posts: [], communities: [] });
      return;
    }

    try {
      // Fetch matching posts
      const postsRes = await fetch(`http://localhost:3000/posts/search?q=${query}`);
      const postsData = await postsRes.json();
      
      // Fetch matching communities
      const communitiesRes = await fetch(`http://localhost:3000/subreddits`);
      const communitiesData = await communitiesRes.json();
      const matchingCommunities = communitiesData.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase())
      );

      setSuggestions({
        posts: postsData.slice(0, 5),
        communities: matchingCommunities.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Handle input change with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
    
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTerm.trim()) {
        navigate(`/search?q=${searchTerm}`);
        setShowSuggestions(false);
      }
    }
  };

  // Helper function to clean community name (remove r/ prefix if present)
  const cleanCommunityName = (communityName) => {
    if (!communityName) return '';
    return communityName.startsWith('r/') 
      ? communityName.substring(2) 
      : communityName;
  };

  return (
    <header className="header">
      <nav className="navbar">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <span style={{ 
            fontSize: '28px', 
            fontWeight: 700, 
            color: '#ffffff',
            letterSpacing: '-0.5px'
          }}>reddit</span>
        </Link>
        
        {/* SEARCH BAR WITH SUGGESTIONS */}
        <div className="search-bar" style={{ position: 'relative' }}>
          <div className="search-bar-wrapper">
            {isCommunityPage && currentCommunity && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px',
                borderRight: '1px solid #343536',
                marginRight: '8px'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  color: '#d7dadc',
                  whiteSpace: 'nowrap'
                }}>
                  r/{currentCommunity}
                </span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    navigate('/');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818384',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder={isCommunityPage && currentCommunity 
                ? `Search in r/${currentCommunity}` 
                : "Find anything"} 
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleSearchSubmit}
              onFocus={() => searchTerm && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            <button className="ask-button">
              <span>⚡</span>
              <span>Ask</span>
            </button>
          </div>
          
          {/* SUGGESTIONS DROPDOWN */}
          {showSuggestions && searchTerm && (suggestions.posts.length > 0 || suggestions.communities.length > 0) && (
            <div className="search-suggestions">
              
              {/* COMMUNITIES SECTION */}
              {suggestions.communities.length > 0 && (
                <div className="suggestions-section">
                  <div className="suggestions-section-title">COMMUNITIES</div>
                  {suggestions.communities.map(community => (
                    <div
                      key={community._id}
                      className="suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const cleanName = cleanCommunityName(community.name);
                        setSearchTerm('');
                        setShowSuggestions(false);
                        navigate(`/r/${cleanName}`);
                      }}
                    >
                      <div className="community-icon">
                        {community.icon || ''}
                      </div>
                      <div className="suggestion-content">
                        <div className="suggestion-main">r/{cleanCommunityName(community.name)}</div>
                        <div className="suggestion-sub">
                          {community.members || 0} members
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* POSTS SECTION */}
              {suggestions.posts.length > 0 && (
                <div className="suggestions-section">
                  <div className="suggestions-section-title">POSTS</div>
                  {suggestions.posts.map(post => (
                    <div
                      key={post._id}
                      className="suggestion-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const cleanName = cleanCommunityName(post.community);
                        setSearchTerm('');
                        setShowSuggestions(false);
                        // Navigate to the post details page
                        navigate(`/r/${cleanName}/comments/${post._id}`);
                      }}
                    >
                      <div className="community-icon">
                        
                      </div>
                      <div className="suggestion-content">
                        <div className="suggestion-main">{post.title}</div>
                        <div className="suggestion-sub">
                          r/{cleanCommunityName(post.community)} • u/{post.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="nav-links">
          <button className="nav-icon-btn" title="Ads">
            <span>📢</span>
          </button>
          <button className="nav-icon-btn" title="Chat">
            <span>💬</span>
          </button>
          
          <div className="create-dropdown-container">
            <button 
              className="create-btn" 
              onClick={() => setIsCreateOpen(!isCreateOpen)}
            >
              <span className="plus-icon">+</span> 
              <span className="create-text">Create</span>
            </button>

            {isCreateOpen && (
              <div className="dropdown-menu">
                <div 
                  className="dropdown-item" 
                  onClick={() => {
                    setIsCreateOpen(false);
                    if (currentUser) {
                      onCreatePostClick();
                    } else {
                      onAuthClick();
                    }
                  }}
                >
                  <span className="item-icon">📝</span>
                  Create Post
                </div>
                
                <div 
                  className="dropdown-item" 
                  onClick={() => {
                    setIsCreateOpen(false);
                    if (currentUser) {
                      onCreateCommunityClick();
                    } else {
                      onAuthClick();
                    }
                  }}
                >
                  <span className="item-icon">r/</span>
                  Create Community
                </div>
              </div>
            )}
          </div>

          <button className="nav-icon-btn" title="Notifications">
            <span>🔔</span>
            <span className="notification-badge">1</span>
          </button>

          {currentUser ? (
            <div 
              className="user-avatar" 
              title={currentUser.username || currentUser}
              onClick={() => navigate(`/u/${currentUser.username || currentUser}`)}
              style={{ cursor: 'pointer' }}
            >
              {(currentUser.username || currentUser).charAt(0).toUpperCase()}
            </div>
          ) : (
            <button className="login-btn" onClick={onAuthClick}>
              Log In
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;