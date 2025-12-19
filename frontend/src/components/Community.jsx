import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Post from "./Post";
import { API_URL } from "./config";
import EditCommunityModal from "./EditCommunityModal";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";

const Community = ({
  currentUser,
  onCreatePostClick,
  communities = [],
  refreshPosts,
}) => {
  const { communityName } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subreddit, setSubreddit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // NEW STATE: JOIN LOGIC
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false); // Prevents spam clicking

  const [sortBy, setSortBy] = useState("best");
  const [zoomedImage, setZoomedImage] = useState(null);
  const [bannerLoaded, setBannerLoaded] = useState(false);

  // Helper function to clean community name (remove r/ if present)
  const cleanCommunityName = (name) => {
    if (!name) return "";
    return name.startsWith("r/") ? name.substring(2) : name;
  };

  // Helper function to display community name with r/ prefix
  const displayCommunityName = (name) => {
    const clean = cleanCommunityName(name);
    return `r/${clean}`;
  };

  // Check if current user is the creator
  const isCreator = () => {
    if (!currentUser || !subreddit || !subreddit.creator) return false;
    const currentUsername = currentUser.username || currentUser;
    const creatorUsername =
      subreddit.creator.username ||
      (typeof subreddit.creator === "string" ? subreddit.creator : null);
    return (
      currentUsername === creatorUsername ||
      (currentUser._id &&
        subreddit.creator._id &&
        currentUser._id.toString() === subreddit.creator._id.toString())
    );
  };

  // Handle community update
  const handleCommunityUpdate = (updatedSubreddit) => {
    setSubreddit(updatedSubreddit);
    setShowEditModal(false);
    setBannerLoaded(false); // Force banner reload
  };

  const cleanName = cleanCommunityName(communityName);

  // --- NEW: FIXED JOIN HANDLER ---
  const handleJoin = async () => {
    if (!currentUser) {
      alert("Please log in to join communities");
      return;
    }

    // Prevent double clicking while request is processing
    if (isJoining) return;
    setIsJoining(true);

    // Optimistic Update: Update UI immediately for speed
    const previousState = isJoined;
    const previousMembers = subreddit?.members;

    setIsJoined(!isJoined);
    setSubreddit((prev) => ({
      ...prev,
      members: !isJoined ? prev.members + 1 : prev.members - 1,
    }));

    try {
      const action = !isJoined ? "join" : "leave";
      const response = await fetch(
        `${API_URL}/subreddits/${cleanName}/${action}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: currentUser.username || currentUser,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Action failed");
      }

      // Sync with server source of truth to be safe
      const data = await response.json();
      setSubreddit((prev) => ({
        ...prev,
        members: data.members,
        membersList: data.membersList || prev.membersList,
      }));

      // Persist per-user join status locally so the button remains "Joined"
      // after navigation until the user explicitly leaves.
      try {
        const usernameKey =
          currentUser?.username ||
          (typeof currentUser === "string" ? currentUser : null);
        if (usernameKey) {
          const keyLower = `joined_${usernameKey}_${cleanName.toLowerCase()}`;
          const keyExact = `joined_${usernameKey}_${cleanName}`;
          if (action === "join") {
            localStorage.setItem(keyLower, "true");
            localStorage.setItem(keyExact, "true");
            setIsJoined(true);
          } else {
            localStorage.removeItem(keyLower);
            localStorage.removeItem(keyExact);
            setIsJoined(false);
          }
        }
      } catch (e) {
        /* ignore localStorage errors */
      }
    } catch (error) {
      console.error("Join/Leave error:", error);
      // Revert UI if API fails
      setIsJoined(previousState);
      setSubreddit((prev) => ({ ...prev, members: previousMembers }));
    } finally {
      setIsJoining(false);
    }
  };

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const baseUrl = API_URL.replace("/api", "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  };

  // Preload banner image when subreddit data changes
  useEffect(() => {
    if (subreddit?.banner) {
      const bannerUrl = getMediaUrl(subreddit.banner);
      console.log("🎨 Preloading banner:", bannerUrl);

      const img = new Image();
      img.onload = () => {
        console.log("✅ Banner loaded successfully");
        setBannerLoaded(true);
      };
      img.onerror = () => {
        console.error("❌ Failed to load banner");
        setBannerLoaded(false);
      };
      img.src = bannerUrl;
    } else {
      setBannerLoaded(true);
    }
  }, [subreddit?.banner]);

  // Fetch posts specifically for this community
  useEffect(() => {
    const fetchCommunityPosts = async () => {
      setLoading(true);
      try {
        const cleanName = cleanCommunityName(communityName);
        const url = `${API_URL}/posts?community=${encodeURIComponent(
          cleanName
        )}&sortBy=${sortBy}`;
        const response = await fetch(url);
        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          const savedUserStr = localStorage.getItem("user");
          let currentUsername = null;
          if (savedUserStr) {
            try {
              const parsed = JSON.parse(savedUserStr);
              currentUsername = parsed.username || parsed;
            } catch (e) {
              currentUsername = savedUserStr;
            }
          }

          const mappedPosts = data.map((post) => {
            const upList = post.upvotedBy || [];
            const downList = post.downvotedBy || [];
            const upvoted = upList.includes(currentUsername);
            const downvoted = downList.includes(currentUsername);
            let status = 0;
            if (upvoted) status = 1;
            if (downvoted) status = -1;

            return {
              id: post._id,
              community: post.community,
              username: post.username,
              user: `u/${post.username}`,
              time: post.createdAt,
              title: post.title,
              content: post.content,
              votes: post.votes,
              comments: post.commentsCount,
              image: post.image,
              mediaUrl: post.mediaUrl,
              userVote: status,
              upvotedBy: upList,
              downvotedBy: downList,
            };
          });
          setPosts(mappedPosts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("Failed to load community posts", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityPosts();

    const fetchSubreddit = async () => {
      try {
        const cleanName = cleanCommunityName(communityName);
        const res = await fetch(
          `${API_URL}/subreddits/${encodeURIComponent(cleanName)}`
        );
        if (res.ok) {
          const data = await res.json();
          console.log("📊 Subreddit data loaded:", data);
          setSubreddit(data);
          setBannerLoaded(false);

          // --- FIXED: Robust Join Check with localStorage fallback ---
          // Try to determine the effective current user from props first,
          // otherwise fall back to localStorage (the same format used elsewhere).
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

          // Determine effective user identifiers
          const currentUserId =
            (effectiveUser && (effectiveUser._id || effectiveUser.id)) || null;
          const currentUsername =
            (effectiveUser &&
              (effectiveUser.username ||
                (typeof effectiveUser === "string" ? effectiveUser : null))) ||
            null;

          // If user created the community, they should be treated as joined
          let creatorMatch = false;
          if (effectiveUser && data.creator) {
            const creator = data.creator;
            if (typeof creator === "string") {
              creatorMatch =
                (currentUserId &&
                  creator.toString() === currentUserId.toString()) ||
                (currentUsername && creator === currentUsername);
            } else if (typeof creator === "object") {
              const cid = creator._id || creator.id;
              const cusername = creator.username || null;
              creatorMatch =
                (currentUserId &&
                  cid &&
                  cid.toString() === currentUserId.toString()) ||
                (currentUsername && cusername === currentUsername);
            }
          }

          if (creatorMatch) {
            setIsJoined(true);
            // Keep local flag consistent (used as fallback elsewhere)
            try {
              const usernameKey =
                effectiveUser.username ||
                (typeof effectiveUser === "string" ? effectiveUser : null);
              if (usernameKey) {
                const keyLower = `joined_${usernameKey}_${cleanName.toLowerCase()}`;
                localStorage.setItem(keyLower, "true");
              }
            } catch (e) {
              /* ignore localStorage errors */
            }
          } else if (
            effectiveUser &&
            data.membersList &&
            Array.isArray(data.membersList)
          ) {
            const isMember = data.membersList.some((member) => {
              if (!member) return false;
              // member might be an ObjectId (string) or an object when populated
              if (typeof member === "string") {
                return (
                  (currentUserId &&
                    member.toString() === currentUserId.toString()) ||
                  (currentUsername && member === currentUsername)
                );
              }
              if (typeof member === "object") {
                const memberId = member._id || member.id;
                const memberUsername = member.username || null;
                return (
                  (currentUserId &&
                    memberId &&
                    memberId.toString() === currentUserId.toString()) ||
                  (currentUsername && memberUsername === currentUsername)
                );
              }
              return false;
            });

            if (isMember) {
              setIsJoined(true);
            } else {
              // Fallback: check localStorage flag preserved after a successful join
              try {
                // Only consider per-user localStorage fallback when an effective user exists
                if (effectiveUser) {
                  const usernameKey =
                    effectiveUser.username ||
                    (typeof effectiveUser === "string" ? effectiveUser : null);
                  if (usernameKey) {
                    const keyLower = `joined_${usernameKey}_${cleanName.toLowerCase()}`;
                    const keyExact = `joined_${usernameKey}_${cleanName}`;
                    const savedFlag =
                      localStorage.getItem(keyLower) ||
                      localStorage.getItem(keyExact);
                    if (savedFlag === "true") {
                      setIsJoined(true);
                    } else {
                      setIsJoined(false);
                    }
                  } else {
                    setIsJoined(false);
                  }
                } else {
                  setIsJoined(false);
                }
              } catch (e) {
                setIsJoined(false);
              }
            }
          } else {
            // No membersList provided by server: rely on per-user localStorage fallback only
            try {
              if (effectiveUser) {
                const usernameKey =
                  effectiveUser.username ||
                  (typeof effectiveUser === "string" ? effectiveUser : null);
                if (usernameKey) {
                  const keyLower = `joined_${usernameKey}_${cleanName.toLowerCase()}`;
                  const keyExact = `joined_${usernameKey}_${cleanName}`;
                  const savedFlag =
                    localStorage.getItem(keyLower) ||
                    localStorage.getItem(keyExact);
                  setIsJoined(savedFlag === "true");
                } else {
                  setIsJoined(false);
                }
              } else {
                setIsJoined(false);
              }
            } catch (e) {
              setIsJoined(false);
            }
          }
        } else {
          setSubreddit(null);
        }
      } catch (err) {
        console.error("Failed to load subreddit metadata", err);
        setSubreddit(null);
      }
    };

    fetchSubreddit();
  }, [communityName, sortBy, currentUser]); // Added currentUser dependency

  const handleVote = async (postId, direction) => {
    if (!currentUser) return alert("You must be logged in to vote!");

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    let newVoteCount = post.votes;
    let newUserVote = 0;
    if (post.userVote === 0) {
      if (direction === "up") {
        newVoteCount += 1;
        newUserVote = 1;
      } else {
        newVoteCount -= 1;
        newUserVote = -1;
      }
    } else if (post.userVote === 1) {
      if (direction === "up") {
        newVoteCount -= 1;
        newUserVote = 0;
      } else {
        newVoteCount -= 2;
        newUserVote = -1;
      }
    } else if (post.userVote === -1) {
      if (direction === "up") {
        newVoteCount += 2;
        newUserVote = 1;
      } else {
        newVoteCount += 1;
        newUserVote = 0;
      }
    }

    const updatedPosts = posts.map((p) =>
      p.id === postId ? { ...p, votes: newVoteCount, userVote: newUserVote } : p
    );
    setPosts(updatedPosts);

    try {
      await fetch(`${API_URL}/posts/${postId}/vote`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          username: currentUser.username || currentUser,
        }),
      });
    } catch (error) {
      console.error("Vote error:", error);
    }
  };

  // Get banner style - improved with forced visibility
  const getBannerStyle = () => {
    if (subreddit?.banner) {
      const bannerUrl = getMediaUrl(subreddit.banner);
      console.log("🎨 Banner URL being used:", bannerUrl);

      try {
        const usernameKey =
          currentUser?.username ||
          (typeof currentUser === "string" ? currentUser : null);
        if (usernameKey) {
          const key = `joined_${usernameKey}_${cleanName}`;
          if (action === "join") {
            localStorage.setItem(key, "true");
            setIsJoined(true);
          } else {
            localStorage.removeItem(key);
            setIsJoined(false);
          }
        }
      } catch (e) {
        /* ignore localStorage errors */
      }
    }
    return {
      height: "200px",
      background:
        "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 50%, #f5576c 100%)",
      position: "relative",
      marginBottom: "0",
    };
  };

  return (
    <div
      className="community-page"
      style={{ background: "#030303", minHeight: "100vh" }}
    >
      {/* BANNER SECTION - Click to zoom */}
      <div
        className="community-banner"
        style={getBannerStyle()}
        onClick={() => {
          if (subreddit?.banner) {
            setZoomedImage({
              url: getMediaUrl(subreddit.banner),
              type: "banner",
            });
          }
        }}
        title={subreddit?.banner ? "Click to view full size" : ""}
      >
        {/* Hidden img tag to force browser to load the image */}
        {subreddit?.banner && (
          <img
            src={getMediaUrl(subreddit.banner)}
            alt="Banner preload"
            style={{ display: "none" }}
            onLoad={() => setBannerLoaded(true)}
            onError={() => console.error("Banner load error")}
          />
        )}

        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "24px",
            color: "#ffffff",
            zIndex: 2,
          }}
        >
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "32px",
              fontWeight: 800,
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            {subreddit ? subreddit.name.toUpperCase() : cleanName.toUpperCase()}
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "16px",
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            {subreddit?.description || `Where History and Culture Meet`}
          </p>
        </div>

        {subreddit?.banner && (
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              background: "rgba(0, 0, 0, 0.5)",
              padding: "6px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              color: "white",
              zIndex: 2,
            }}
          >
            Click to view full size 🔍
          </div>
        )}
      </div>

      {/* COMMUNITY INFO BAR */}
      <div
        style={{
          background: "#1a1a1b",
          borderBottom: "1px solid #343536",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          {/* Community Logo */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#0079d3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              border: "4px solid #1a1a1b",
              marginTop: "-36px",
              flexShrink: 0,
              cursor: subreddit?.logo ? "pointer" : "default",
              transition: "transform 0.2s",
            }}
            onClick={() => {
              if (subreddit?.logo) {
                setZoomedImage({
                  url: getMediaUrl(subreddit.logo),
                  type: "logo",
                });
              }
            }}
            onMouseEnter={(e) => {
              if (subreddit?.logo)
                e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              if (subreddit?.logo) e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {subreddit?.logo ? (
              <img
                src={getMediaUrl(subreddit.logo)}
                alt="Community logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <span
                style={{ fontSize: "24px", color: "white", fontWeight: "bold" }}
              >
                r/
              </span>
            )}
          </div>

          {/* Community Info */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#d7dadc",
                }}
              >
                {displayCommunityName(subreddit ? subreddit.name : cleanName)}
              </h1>
              {subreddit?.isOver18 && (
                <span
                  style={{
                    background: "#ea0027",
                    color: "white",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  18+
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "14px",
                color: "#818384",
              }}
            >
              <span>{subreddit?.members || 0} members</span>
              <span>•</span>
              <span>Online now</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            {isCreator() && (
              <button
                onClick={() => setShowEditModal(true)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "20px",
                  border: "1px solid #343536",
                  background: "#272729",
                  color: "#d7dadc",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Edit Community
              </button>
            )}
            <button
              onClick={() => onCreatePostClick()}
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: "1px solid #ff4500",
                background: "#ff4500",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              + Create Post
            </button>
            <button
              style={{
                padding: "8px",
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: "#d7dadc",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
              }}
            >
              🔔
            </button>

            {/* JOIN BUTTON (FIXED) */}
            <button
              onClick={handleJoin}
              disabled={isJoining} // Disable if loading
              style={{
                padding: "8px 20px",
                borderRadius: "20px",
                border: isJoined ? "1px solid #343536" : "1px solid #0079d3",
                fontWeight: 700,
                color: isJoined ? "#d7dadc" : "#ffffff",
                backgroundColor: isJoined ? "transparent" : "#0079d3",
                cursor: isJoining ? "wait" : "pointer",
                opacity: isJoining ? 0.7 : 1,
                fontSize: "14px",
                minWidth: "100px",
              }}
            >
              {isJoining ? "..." : isJoined ? "Joined" : "Join"}
            </button>

            <button
              style={{
                padding: "8px",
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: "#d7dadc",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
              }}
            >
              ⋯
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-container" style={{ background: "#030303" }}>
        <Sidebar
          onCreatePost={refreshPosts}
          currentUser={currentUser}
          communities={communities}
          onCreatePostClick={onCreatePostClick}
          currentCommunity={cleanName}
        />

        <div className="posts-container">
          {/* Content Filtering */}
          <div className="posts-header" style={{ marginBottom: "16px" }}>
            <select
              className="sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="best">Best</option>
              <option value="hot">Hot</option>
              <option value="new">New</option>
              <option value="top">Top</option>
            </select>
            <button className="view-toggle" title="Change view">
              <span>⊞</span>
            </button>
          </div>

          {/* Posts */}
          {loading ? (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#d7dadc" }}
            >
              Loading {displayCommunityName(communityName)}...
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                currentUser={currentUser}
                onVote={handleVote}
              />
            ))
          ) : (
            <div
              style={{ textAlign: "center", padding: "40px", color: "#d7dadc" }}
            >
              <h3>
                There are no posts in {displayCommunityName(communityName)} yet.
              </h3>
              <p>Be the first to post!</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Community Info */}
        <div className="right-sidebar">
          <div className="top-communities" style={{ marginBottom: "16px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#d7dadc",
                margin: 0,
                padding: "16px",
                borderBottom: "1px solid #343536",
              }}
            >
              {subreddit ? subreddit.name : cleanName}
            </h3>
            <div style={{ padding: "16px" }}>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "#d7dadc",
                  margin: "0 0 16px 0",
                }}
              >
                {subreddit?.description ||
                  `Welcome to ${displayCommunityName(communityName)}!`}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  fontSize: "14px",
                  color: "#818384",
                }}
              >
                <span>📅</span>
                <span>
                  Created{" "}
                  {subreddit?.createdAt
                    ? new Date(subreddit.createdAt).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )
                    : "Recently"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                  fontSize: "14px",
                  color: "#818384",
                }}
              >
                <span>🌐</span>
                <span>Public</span>
              </div>

              <button
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "20px",
                  border: "1px solid #343536",
                  background: "#272729",
                  color: "#d7dadc",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#343536")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#272729")
                }
              >
                <span>📄</span>
                <span>Community Guide</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* IMAGE ZOOM MODAL */}
      {zoomedImage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "zoom-out",
          }}
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "white",
              fontSize: "32px",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
            }
          >
            ×
          </button>
          <img
            src={zoomedImage.url}
            alt={
              zoomedImage.type === "logo"
                ? "Community Logo"
                : "Community Banner"
            }
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: zoomedImage.type === "logo" ? "50%" : "8px",
              boxShadow: "0 0 50px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              left: "50%",
              transform: "translateX(-50%)",
              color: "white",
              fontSize: "14px",
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              padding: "8px 16px",
              borderRadius: "20px",
            }}
          >
            {zoomedImage.type === "logo"
              ? "Community Logo"
              : "Community Banner"}
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      <EditCommunityModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        subreddit={subreddit}
        currentUser={currentUser}
        onUpdate={handleCommunityUpdate}
      />
    </div>
  );
};

export default Community;
