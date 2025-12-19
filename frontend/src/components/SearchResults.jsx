import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { API_URL } from "./config";
import Post from "./Post";

const SearchResults = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState("posts"); 
  const [results, setResults] = useState({
    posts: [],
    communities: [],
    users: []
  });
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q");

  useEffect(() => {
    if (!query) return;

    const fetchAllResults = async () => {
      setLoading(true);
      try {
        // Fetch all 3 in parallel
        const [postsRes, commsRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/posts/search?q=${query}`),
          fetch(`${API_URL}/subreddits/search?q=${query}`),
          fetch(`${API_URL}/users/search?q=${query}`)
        ]);

        const postsData = await postsRes.json();
        const commsData = await commsRes.json();
        const usersData = await usersRes.json();

        // Process posts (add vote status)
        const processedPosts = (postsData || []).map(post => {
            const upList = post.upvotedBy || [];
            const downList = post.downvotedBy || [];
            const username = currentUser?.username || currentUser;
            
            let userVote = 0;
            if (username) {
                if (upList.includes(username)) userVote = 1;
                else if (downList.includes(username)) userVote = -1;
            }

            return {
                ...post,
                id: post._id,
                user: post.username || post.user?.username || 'unknown',
                votes: (post.votes || 0),
                userVote
            };
        });

        setResults({
            posts: processedPosts,
            communities: commsData || [],
            users: usersData || []
        });

      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllResults();
  }, [query, currentUser]);

  const tabStyle = (tabName) => ({
    padding: "10px 20px",
    cursor: "pointer",
    borderBottom: activeTab === tabName ? "2px solid #d7dadc" : "2px solid transparent",
    color: activeTab === tabName ? "#d7dadc" : "#818384",
    fontWeight: "bold",
    background: "transparent",
    border: "none",
    fontSize: "14px"
  });

  if (loading) return <div style={{ padding: "20px", color: "#d7dadc" }}>Searching...</div>;

  return (
    <div className="main-container">
      <div className="posts-container" style={{maxWidth: '800px', margin: '0 auto'}}>
        
        <h2 style={{ margin: "20px 0 10px", color: "#d7dadc" }}>
            Results for "{query}"
        </h2>

        {/* TABS */}
        <div style={{ display: "flex", borderBottom: "1px solid #343536", marginBottom: "20px" }}>
            <button onClick={() => setActiveTab("posts")} style={tabStyle("posts")}>
                Posts ({results.posts.length})
            </button>
            <button onClick={() => setActiveTab("communities")} style={tabStyle("communities")}>
                Communities ({results.communities.length})
            </button>
            <button onClick={() => setActiveTab("people")} style={tabStyle("people")}>
                People ({results.users.length})
            </button>
        </div>

        {/* POSTS TAB */}
        {activeTab === "posts" && (
            <div>
                {results.posts.length > 0 ? (
                    results.posts.map(post => (
                        <Post key={post.id} post={post} currentUser={currentUser} onVote={() => {}} />
                    ))
                ) : (
                    <div style={{ padding: "20px", color: "#818384" }}>No posts found.</div>
                )}
            </div>
        )}

        {/* COMMUNITIES TAB */}
        {activeTab === "communities" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {results.communities.length > 0 ? (
                    results.communities.map(sub => (
                        <Link 
                            to={`/r/${sub.name}`} 
                            key={sub._id}
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{ 
                                display: 'flex', alignItems: 'center', padding: '15px', 
                                background: '#1a1a1b', border: '1px solid #343536', borderRadius: '4px' 
                            }}>
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '50%', 
                                    background: '#0079d3', marginRight: '15px', overflow: 'hidden',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                }}>
                                    {sub.logo ? (
                                        <img src={`${API_URL}/${sub.logo}`} alt={sub.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontWeight: 'bold' }}>r/</span>
                                    )}
                                </div>
                                <div>
                                    <div style={{ color: '#d7dadc', fontWeight: 'bold' }}>r/{sub.name}</div>
                                    <div style={{ color: '#818384', fontSize: '12px' }}>
                                        {sub.members} members • {sub.description || "No description"}
                                    </div>
                                </div>
                                <button style={{ 
                                    marginLeft: 'auto', padding: '6px 20px', borderRadius: '20px', 
                                    border: '1px solid #d7dadc', background: 'transparent', color: '#d7dadc', 
                                    fontWeight: 'bold', cursor: 'pointer' 
                                }}>
                                    View
                                </button>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div style={{ padding: "20px", color: "#818384" }}>No communities found.</div>
                )}
            </div>
        )}

        {/* PEOPLE TAB */}
        {activeTab === "people" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {results.users.length > 0 ? (
                    results.users.map(user => (
                        <Link 
                            to={`/u/${user.username}`} 
                            key={user._id}
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{ 
                                display: 'flex', alignItems: 'center', padding: '15px', 
                                background: '#1a1a1b', border: '1px solid #343536', borderRadius: '4px' 
                            }}>
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '50%', 
                                    background: '#343536', marginRight: '15px', overflow: 'hidden'
                                }}>
                                    {user.profile?.avatar ? (
                                        <img src={`${API_URL}/${user.profile.avatar}`} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: '#ff4500' }} />
                                    )}
                                </div>
                                <div>
                                    <div style={{ color: '#d7dadc', fontWeight: 'bold' }}>u/{user.username}</div>
                                    <div style={{ color: '#818384', fontSize: '12px' }}>
                                        {user.profile?.bio || "No bio available"}
                                    </div>
                                </div>
                                <button style={{ 
                                    marginLeft: 'auto', padding: '6px 20px', borderRadius: '20px', 
                                    background: '#0079d3', color: 'white', border: 'none', 
                                    fontWeight: 'bold', cursor: 'pointer' 
                                }}>
                                    View Profile
                                </button>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div style={{ padding: "20px", color: "#818384" }}>No users found.</div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};

export default SearchResults;