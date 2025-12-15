import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css'; 

const Header = ({ currentUser, onAuthClick, onLogout, onCreateCommunityClick }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState({ posts: [], communities: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

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

  return (
    <header className="header">
      <nav className="navbar">
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <img 
            src="https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png" 
            alt="Reddit" 
          />
          <span>reddit</span>
        </Link>
        
        {/* SEARCH BAR WITH AUTOCOMPLETE */}
        <div className="search-bar" style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search Reddit" 
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          
          {/* SUGGESTIONS DROPDOWN */}
          {showSuggestions && searchTerm && (suggestions.posts.length > 0 || suggestions.communities.length > 0) && (
            <div className="suggestions-dropdown">
              
              {/* COMMUNITIES SECTION */}
              {suggestions.communities.length > 0 && (
                <>
                  <div className="suggestions-header">Communities</div>
                  {suggestions.communities.map(community => (
                    <div
                      key={community._id}
                      className="suggestion-item"
                      onClick={() => {
                        navigate(`/r/${community.name}`);
                        setSearchTerm('');
                        setShowSuggestions(false);
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>📁</span>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>r/{community.name}</div>
                        <div style={{ fontSize: '12px', color: '#7c7c7c' }}>
                          {community.members || 0} members
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* POSTS SECTION */}
              {suggestions.posts.length > 0 && (
                <>
                  <div className="suggestions-header">Posts</div>
                  {suggestions.posts.map(post => (
                    <div
                      key={post._id}
                      className="suggestion-item"
                      onClick={() => {
                        navigate(`/r/${post.community}/comments/${post._id}`);
                        setSearchTerm('');
                        setShowSuggestions(false);
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                        {post.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7c7c7c' }}>
                        {post.community} • u/{post.username}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="nav-links">
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
                    // Scroll to the CREATE POST button in sidebar and trigger it
                    const createPostBtn = document.querySelector('.sidebar button');
                    if (createPostBtn) {
                      createPostBtn.click();
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

          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link to={`/u/${currentUser.username || currentUser}`} style={{ textDecoration: 'none', color: '#0079d3', fontWeight: 'bold' }}>
                <span style={{ fontSize: '14px' }}>
                  Welcome, {currentUser.username || currentUser}
                </span>
              </Link>

              <button 
                className="logout-btn"
                onClick={onLogout}
              >
                Log Out
              </button>
            </div>
          ) : (
            <button 
              className="login-btn"
              onClick={onAuthClick}
            >
              Log In
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;