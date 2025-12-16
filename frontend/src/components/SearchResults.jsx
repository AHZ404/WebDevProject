import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "./config";
import Post from "./Post";

const SearchResults = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q");

  useEffect(() => {
    if (!query) return;

    const fetchSearch = async () => {
      setLoading(true);
      try {
        // Get current username
        const savedUserStr = localStorage.getItem("user");
        let currentUsername = null;
        if (savedUserStr) {
          try {
            const parsed = JSON.parse(savedUserStr);
            currentUsername = parsed.username || parsed;
          } catch(e) { 
            currentUsername = savedUserStr; 
          }
        }

        const url = `${API_URL}/posts/search?q=${query}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        // Map the data correctly with all required fields and check vote status
        setPosts((data || []).map(post => {
          const upList = post.upvotedBy || [];
          const downList = post.downvotedBy || [];
          
          const upvoted = upList.includes(currentUsername);
          const downvoted = downList.includes(currentUsername);
          
          let status = 0;
          if (upvoted) status = 1;
          if (downvoted) status = -1;

          return {
            id: post._id,
            title: post.title,
            content: post.content,
            votes: post.votes,
            comments: post.commentsCount,
            mediaUrl: post.mediaUrl,
            community: post.community,
            user: `u/${post.username}`,
            userVote: status,
            time: post.createdAt,
            upvotedBy: upList,
            downvotedBy: downList
          };
        }));
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearch();
  }, [query]); 

  // Handle voting
  const handleVote = async (postId, direction) => {
    if (!currentUser) return alert("You must be logged in to vote!");

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    let newVoteCount = post.votes;
    let newUserVote = post.userVote || 0;
    
    if (newUserVote === 0) {
      if (direction === 'up') { newVoteCount += 1; newUserVote = 1; } 
      else { newVoteCount -= 1; newUserVote = -1; }
    } else if (newUserVote === 1) {
      if (direction === 'up') { newVoteCount -= 1; newUserVote = 0; } 
      else { newVoteCount -= 2; newUserVote = -1; }
    } else if (newUserVote === -1) {
      if (direction === 'up') { newVoteCount += 2; newUserVote = 1; } 
      else { newVoteCount += 1; newUserVote = 0; }
    }

    const updatedPosts = posts.map(p => 
      p.id === postId ? { ...p, votes: newVoteCount, userVote: newUserVote } : p
    );
    setPosts(updatedPosts);

    try {
      await fetch(`${API_URL}/posts/${postId}/vote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          direction, 
          username: currentUser.username || currentUser 
        })
      });
    } catch (error) { 
      console.error("Vote error:", error); 
    }
  };

  if (loading) return <div style={{ padding: "20px" }}>Searching...</div>;

  return (
    <div className="main-container">
      <div className="posts-container" style={{maxWidth: '800px', margin: '20px auto'}}>

        {/* RESULTS DISPLAY */}
        <h3 style={{marginBottom: '15px'}}>Results for "{query}"</h3>

        {posts.length > 0 ? (
          posts.map(post => (
            <Post
              key={post.id}
              post={post}
              currentUser={currentUser}
              onVote={handleVote}
            />
          ))
        ) : (
          <p>No results found for "{query}"</p>
        )}
      </div>
    </div>
  );
};

export default SearchResults;