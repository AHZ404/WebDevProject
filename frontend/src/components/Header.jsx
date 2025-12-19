import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "./config.jsx";
import "./Header.css";

const Header = ({
  currentUser,
  onAuthClick,
  onLogout,
  onCreateCommunityClick,
  onCreatePostClick,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState({
    posts: [],
    communities: [],
    users: []
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Detect if we're on a community page and extract community name
  const isCommunityPage =
    location.pathname.startsWith("/r/") &&
    !location.pathname.includes("/comments/");
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
      setSuggestions({ posts: [], communities: [], users: [] });
      return;
    }

    try {
      // Fetch matching posts
      const postsRes = await fetch(
        `${API_URL}/posts/search?q=${query}`
      );
      const postsData = await postsRes.json();

      // Fetch matching communities
      const communitiesRes = await fetch(`${API_URL}/subreddits`);
      const communitiesData = await communitiesRes.json();
      const matchingCommunities = communitiesData.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      );

      const usersRes = await fetch(`${API_URL}/users/search?q=${query}`);
      const usersData = await usersRes.json();

      setSuggestions({
        posts: Array.isArray(postsData) ? postsData.slice(0, 5) : [],
        communities: Array.isArray(matchingCommunities) ? matchingCommunities.slice(0, 5) : [],
        users: Array.isArray(usersData) ? usersData.slice(0, 5) : [] 
      });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
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
    if (e.key === "Enter") {
      e.preventDefault();
      if (searchTerm.trim()) {
        navigate(`/search?q=${searchTerm}`);
        setShowSuggestions(false);
      }
    }
  };

  // Helper function to clean community name (remove r/ prefix if present)
  const cleanCommunityName = (communityName) => {
    if (!communityName) return "";
    return communityName.startsWith("r/")
      ? communityName.substring(2)
      : communityName;
  };

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchUnread = async () => {
      if (!currentUser?.username) {
        setUnreadCount(0);
        return;
      }
      try {
        const res = await fetch(
          `${API_URL}/chats?username=${encodeURIComponent(
            currentUser.username
          )}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        const unread = (data || []).filter((c) => c.unread).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUnread();
    const t = setInterval(fetchUnread, 10000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [currentUser]);

  return (
    <header className="header">
      <nav className="navbar">
        <Link to="/" className="logo" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.5px",
            }}
          >
            reddit
          </span>
        </Link>

        {/* SEARCH BAR WITH SUGGESTIONS */}
        <div className="search-bar" style={{ position: "relative" }}>
          <div className="search-bar-wrapper">
            {isCommunityPage && currentCommunity && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 12px",
                  borderRight: "1px solid #343536",
                  marginRight: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#d7dadc",
                    whiteSpace: "nowrap",
                  }}
                >
                  r/{currentCommunity}
                </span>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    navigate("/");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#818384",
                    cursor: "pointer",
                    fontSize: "16px",
                    padding: "0",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  ×
                </button>
              </div>
            )}
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={
                isCommunityPage && currentCommunity
                  ? `Search in r/${currentCommunity}`
                  : "Find anything"
              }
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
          {showSuggestions &&
            searchTerm &&
            (suggestions.posts.length > 0 ||
              suggestions.communities.length > 0) && (
              <div className="search-suggestions">
                {/* COMMUNITIES SECTION */}
                {suggestions.communities.length > 0 && (
                  <div className="suggestions-section">
                    <div className="suggestions-section-title">COMMUNITIES</div>
                    {suggestions.communities.map((community) => (
                      <div
                        key={community._id}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const cleanName = cleanCommunityName(community.name);
                          setSearchTerm("");
                          setShowSuggestions(false);
                          navigate(`/r/${cleanName}`);
                        }}
                      >
                        <div className="community-icon">
                          {community.icon || ""}
                        </div>
                        <div className="suggestion-content">
                          <div className="suggestion-main">
                            r/{cleanCommunityName(community.name)}
                          </div>
                          <div className="suggestion-sub">
                            {community.members || 0} members
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* PEOPLE SECTION */}
                {suggestions.users.length > 0 && (
                  <div className="suggestions-section">
                    <div className="suggestions-section-title">PEOPLE</div>
                    {suggestions.users.map((user) => (
                      <div
                        key={user._id}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchTerm("");
                          setShowSuggestions(false);
                          navigate(`/u/${user.username}`); 
                        }}
                      >
                        <div 
                          className="community-icon" 
                          style={{
                             borderRadius: '50%', 
                             overflow: 'hidden',
                             background: '#333'
                          }}
                        >
                           {user.profile && user.profile.avatar ? (
                              <img 
                                src={`${API_URL}/${user.profile.avatar}`} 
                                alt="" 
                                style={{width:'100%', height:'100%', objectFit:'cover'}}
                              />
                           ) : (
                              <span style={{color:'white', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', height:'100%'}}>u/</span>
                           )}
                        </div>
                        
                        <div className="suggestion-content">
                          <div className="suggestion-main">u/{user.username}</div>
                          <div className="suggestion-sub">User</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* POSTS SECTION */}
                {suggestions.posts.length > 0 && (
                  <div className="suggestions-section">
                    <div className="suggestions-section-title">POSTS</div>
                    {suggestions.posts.map((post) => (
                      <div
                        key={post._id}
                        className="suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const cleanName = cleanCommunityName(post.community);
                          setSearchTerm("");
                          setShowSuggestions(false);
                          // Navigate to the post details page
                          navigate(`/r/${cleanName}/comments/${post._id}`);
                        }}
                      >
                        <div className="community-icon"></div>
                        <div className="suggestion-content">
                          <div className="suggestion-main">{post.title}</div>
                          <div className="suggestion-sub">
                            r/{cleanCommunityName(post.community)} • u/
                            {post.username}
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
          <button
            className="nav-icon-btn"
            title="Chat"
            onClick={() => navigate("/chats")}
          >
            <span>💬</span>
            {unreadCount > 0 && (
              <span className="message-badge">{unreadCount}</span>
            )}
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
                      onAuthClick("login");
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
                      onAuthClick("login");
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                className="user-avatar"
                title={currentUser.username || currentUser}
                onClick={() =>
                  navigate(`/u/${currentUser.username || currentUser}`)
                }
                style={{
                  cursor: "pointer",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #ff4500, #ff6314)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "14px",
                  position: "relative",
                }}
              >
                {(currentUser.username || currentUser).charAt(0).toUpperCase()}
              </div>
              <button
                style={{
                  padding: "6px 16px",
                  background: "transparent",
                  color: "#d7dadc",
                  border: "1px solid #343536",
                  borderRadius: "20px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#272729";
                  e.target.style.borderColor = "#818384";
                  e.target.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.borderColor = "#343536";
                  e.target.style.color = "#d7dadc";
                }}
                onClick={onLogout}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                style={{
                  padding: "6px 16px",
                  background: "#ffffff",
                  color: "#1a1a1b",
                  border: "none",
                  borderRadius: "20px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#e9e9e9")}
                onMouseLeave={(e) => (e.target.style.background = "#ffffff")}
                onClick={() => onAuthClick("signup")}
              >
                Sign Up
              </button>
              <button
                style={{
                  padding: "6px 16px",
                  background: "#0079d3", // Changed to blue background
                  color: "#ffffff", // Changed to white text
                  border: "none", // Removed border
                  borderRadius: "20px",
                  fontWeight: 700, // Made bold like Sign Up
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.background = "#0060a9")}
                onMouseLeave={(e) => (e.target.style.background = "#0079d3")}
                onClick={() => onAuthClick("login")}
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
