import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // <--- 1. Import Hook
import { API_URL } from "./config";

const RightSidebar = ({ communities, currentUser, refreshCommunities }) => {
  const navigate = useNavigate(); // <--- 2. Initialize Hook
  const [joining, setJoining] = useState({}); // track per-community loading
  const [joinedMap, setJoinedMap] = useState({}); // track per-community joined state

  // Initialize joinedMap from communities and localStorage/currentUser
  useEffect(() => {
    const newMap = {};
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

    (communities || []).forEach((comm) => {
      const clean = cleanCommunityName(comm.name).toLowerCase();
      let isMember = false;
      if (comm.membersList && Array.isArray(comm.membersList)) {
        isMember = comm.membersList.some((m) => {
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
      }

      if (!isMember) {
        try {
          const flag = localStorage.getItem(`joined_${clean}`);
          if (flag === "true") isMember = true;
        } catch (e) {}
      }

      newMap[clean] = !!isMember;
    });

    setJoinedMap(newMap);
  }, [communities, currentUser]);

  // Helper function to clean community name (remove r/ if present)
  const cleanCommunityName = (name) => {
    if (!name) return "";
    return name.startsWith("r/") ? name.substring(2) : name;
  };

  return (
    <aside className="right-sidebar">
      <div className="top-communities">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px",
          }}
        >
          <h3 style={{ margin: 0 }}>RECENT POSTS</h3>
          <button
            style={{
              background: "none",
              border: "none",
              color: "#0079d3",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              padding: 0,
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="top-communities">
        <h3>Top Growing Communities</h3>
        <ul className="community-list">
          {communities.map((community, index) => {
            const cleanName = cleanCommunityName(community.name);
            const key = cleanName.toLowerCase();
            const isJoining = !!joining[key];
            const isJoined = !!joinedMap[key];

            return (
              <li
                key={community._id || community.id}
                className="community-item"
              >
                <span className="community-number">{index + 1}</span>
                <div className="community-icon">
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
                    <div
                      style={{
                        fontSize: "16px",
                        color: "white",
                        fontWeight: "bold",
                      }}
                    >
                      r/
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    onClick={() => navigate(`/r/${cleanName}`)}
                    style={{
                      fontWeight: 600,
                      fontSize: "14px",
                      cursor: "pointer",
                      color: "#d7dadc",
                      marginBottom: "2px",
                    }}
                  >
                    {`r/${cleanName}`}
                  </div>
                  <div style={{ fontSize: "12px", color: "#818384" }}>
                    {community.members || 0} members
                  </div>
                </div>
                <button
                  className="join-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    // If not logged in, prompt
                    if (!currentUser) {
                      alert("Please log in to join communities");
                      return;
                    }

                    if (isJoining) return;
                    setJoining((prev) => ({ ...prev, [key]: true }));

                    const action = isJoined ? "leave" : "join";

                    // Optimistic UI: toggle joined and update localStorage
                    setJoinedMap((prev) => ({ ...prev, [key]: !isJoined }));
                    try {
                      const response = await fetch(
                        `${API_URL}/subreddits/${encodeURIComponent(
                          cleanName
                        )}/${action}`,
                        {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            username: currentUser.username || currentUser,
                          }),
                        }
                      );

                      const data = await response.json();
                      if (!response.ok) {
                        throw new Error(data?.message || "Action failed");
                      }

                      // Persist local flag so button remains until user acts again
                      const storageKey = `joined_${key}`;
                      if (action === "join") {
                        try {
                          localStorage.setItem(storageKey, "true");
                        } catch (e) {}
                      } else {
                        try {
                          localStorage.removeItem(storageKey);
                        } catch (e) {}
                      }

                      // Refresh communities list from parent to get updated member counts
                      if (typeof refreshCommunities === "function") {
                        refreshCommunities();
                      }
                    } catch (err) {
                      console.error("Join error", err);
                      // Revert optimistic state
                      setJoinedMap((prev) => ({ ...prev, [key]: isJoined }));
                      alert("Failed to update membership. Try again.");
                    } finally {
                      setJoining((prev) => ({ ...prev, [key]: false }));
                    }
                  }}
                  disabled={isJoining}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    border: isJoined
                      ? "1px solid #343536"
                      : "1px solid #0079d3",
                    background: isJoined ? "transparent" : "#0079d3",
                    color: isJoined ? "#d7dadc" : "#fff",
                    cursor: isJoining ? "wait" : "pointer",
                  }}
                >
                  {isJoining ? "..." : isJoined ? "Joined" : "Join"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="top-communities">
        <h3>About</h3>
        <div
          style={{
            padding: "12px",
            fontSize: "14px",
            lineHeight: "1.5",
            color: "#d7dadc",
          }}
        >
          Reddit Clone is a demonstration of building a social media platform
          interface using React, HTML, and CSS.
          <br />
          <br />
          This is a frontend-only implementation for educational purposes.
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
