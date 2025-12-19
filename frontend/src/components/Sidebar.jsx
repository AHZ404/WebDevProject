import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_URL } from "./config";

const Sidebar = ({
  onCreatePost,
  currentUser,
  communities = [],
  onCreatePostClick,
  onCreateCommunityClick,
  currentCommunity,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const cleanCommunityName = (name) => {
    if (!name) return "";
    return name.startsWith("r/") ? name.substring(2) : name;
  };

  // Get recent communities (last 5 visited or all if less than 5)
  const recentCommunities = communities.slice(0, 5);
  const [joinedCommunities, setJoinedCommunities] = useState([]);

  useEffect(() => {
    // Determine effective user from props or localStorage
    let effectiveUser = currentUser;
    if (!effectiveUser) {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          effectiveUser = JSON.parse(saved);
        } catch (e) {
          effectiveUser = saved;
        }
      }
    }

    const currentUserId =
      effectiveUser && (effectiveUser._id || effectiveUser.id)
        ? (effectiveUser._id || effectiveUser.id).toString()
        : null;
    const currentUsername =
      effectiveUser && effectiveUser.username
        ? effectiveUser.username
        : typeof effectiveUser === "string"
        ? effectiveUser
        : null;

    const joined = (communities || []).filter((comm) => {
      // Prefer membersList from subreddit when available
      if (comm.membersList && Array.isArray(comm.membersList)) {
        const found = comm.membersList.some((m) => {
          if (!m) return false;
          if (typeof m === "string") {
            return (
              (currentUserId && m.toString() === currentUserId) ||
              (currentUsername && m === currentUsername)
            );
          }
          if (typeof m === "object") {
            const mid = m._id || m.id;
            return (
              (currentUserId && mid && mid.toString() === currentUserId) ||
              (currentUsername && m.username === currentUsername)
            );
          }
          return false;
        });
        if (found) return true;
      }

      // Fallback to per-user localStorage flag set when user joined from elsewhere
      try {
        if (effectiveUser) {
          const usernameKey =
            currentUsername || effectiveUser.username || effectiveUser;
          if (usernameKey) {
            const flag = localStorage.getItem(
              `joined_${usernameKey}_${cleanCommunityName(
                comm.name
              ).toLowerCase()}`
            );
            if (flag === "true") return true;
          }
        }
      } catch (e) {}

      return false;
    });

    setJoinedCommunities(joined);
  }, [communities, currentUser]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  if (!isOpen) {
    return (
      <aside
        className="sidebar"
        style={{
          width: "56px",
          minWidth: "56px",
          borderRadius: "12px",
          overflow: "hidden",
          padding: 0,
        }}
      >
        <div style={{ padding: "8px", marginBottom: "4px" }}>
          <button
            className="nav-item"
            style={{
              width: "100%",
              justifyContent: "center",
              margin: 0,
              padding: "10px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onClick={toggleSidebar}
          >
            <span className="nav-item-icon" style={{ fontSize: "20px" }}>
              ☰
            </span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="sidebar"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "8px", marginBottom: "4px" }}>
        <button
          className="nav-item"
          style={{
            width: "100%",
            justifyContent: "flex-start",
            margin: 0,
            padding: "10px 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onClick={toggleSidebar}
        >
          <span className="nav-item-icon" style={{ fontSize: "20px" }}>
            ☰
          </span>
        </button>
      </div>
      <ul className="nav-menu">
        <li className="nav-item" onClick={() => navigate("/")}>
          <span className="nav-item-icon">🏠</span>
          <span>Home</span>
        </li>
        <li className="nav-item">
          <span className="nav-item-icon">📈</span>
          <span>Popular</span>
        </li>
        <li className="nav-item">
          <span className="nav-item-icon">🌍</span>
          <span>Explore</span>
        </li>
        <li className="nav-item">
          <span className="nav-item-icon">📊</span>
          <span>All</span>
        </li>
      </ul>

      <div
        style={{
          borderTop: "1px solid #343536",
          marginTop: "8px",
          paddingTop: "8px",
        }}
      >
        <button
          className="start-community-btn"
          onClick={() => {
            if (!currentUser) {
              alert("Please log in to create a community");
              return;
            }
            onCreateCommunityClick();
          }}
        >
          <span>+</span>
          <span>Start a community</span>
        </button>
      </div>

      {/* Recent Communities Section */}
      {recentCommunities.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              fontSize: "10px",
              fontWeight: 700,
              color: "#818384",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <span>RECENT</span>
            <span style={{ cursor: "pointer" }}>↑</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {recentCommunities.map((community) => {
              const cleanName = cleanCommunityName(community.name);
              const isCurrent =
                currentCommunity &&
                cleanName.toLowerCase() === currentCommunity.toLowerCase();

              return (
                <li
                  key={community._id || community.id}
                  className="nav-item"
                  onClick={() => navigate(`/r/${cleanName}`)}
                  style={{
                    background: isCurrent ? "#272729" : "transparent",
                    margin: "2px 8px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: "#0079d3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {community.logo ? (
                      <img
                        src={`${API_URL}/${community.logo}`}
                        alt={cleanName}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      >
                        r/
                      </span>
                    )}
                  </div>
                  <span>r/{cleanName}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {/* Joined Communities Section */}
      {joinedCommunities && joinedCommunities.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              fontSize: "10px",
              fontWeight: 700,
              color: "#818384",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <span>COMMUNITIES</span>
            <span style={{ cursor: "pointer" }}>⋯</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {joinedCommunities.map((community) => {
              const cleanName = cleanCommunityName(community.name);
              const isCurrent =
                currentCommunity &&
                cleanName.toLowerCase() === currentCommunity.toLowerCase();
              return (
                <li
                  key={community._id || community.id}
                  className="nav-item"
                  onClick={() => navigate(`/r/${cleanName}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    background: isCurrent ? "#272729" : "transparent",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: "#0079d3",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {community.logo ? (
                      <img
                        src={`${API_URL}/${community.logo}`}
                        alt={cleanName}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: "12px",
                          color: "white",
                          fontWeight: "bold",
                        }}
                      >
                        r/
                      </span>
                    )}
                  </div>
                  <span style={{ flex: 1 }}>r/{cleanName}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/r/${cleanName}`);
                    }}
                    title="Manage"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#818384",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    ☆
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
