import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "./config";
import Post from "./Post";

const SearchResults = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('relevance'); 
  const [timeFilter, setTimeFilter] = useState('all');

  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q");

  useEffect(() => {
    if (!query) return;

    const fetchSearch = async () => {
      setLoading(true);
      try {
        const url = `${API_URL}/posts/search?q=${query}&sortBy=${sortBy}&timeFilter=${timeFilter}`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        // Map the data correctly with all required fields
        setPosts((data || []).map(post => ({
          id: post._id,
          title: post.title,
          content: post.content,
          votes: post.votes,
          comments: post.commentsCount,
          mediaUrl: post.mediaUrl,
          community: post.community,
          user: `u/${post.username}`,
          userVote: 0,
          time: post.createdAt,
          upvotedBy: post.upvotedBy || [],
          downvotedBy: post.downvotedBy || []
        })));
      } catch (error) {
        console.error("Failed to fetch search results:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearch();
  }, [query, sortBy, timeFilter]); 

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

        {/* SEARCH HEADER/SORTING BAR */}
        <div className="search-header-bar" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px', 
          padding: '10px 15px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f6f7f8',
          marginBottom: '20px'
        }}>
          
          <span style={{fontWeight: 'bold'}}>Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            style={{padding: '5px 10px', borderRadius: '4px'}}
          >
            <option value="relevance">Relevance</option>
            <option value="hot">Hot</option>
            <option value="new">Newest</option>
            <option value="top">Top</option>
          </select>
          
          <span style={{fontWeight: 'bold', marginLeft: '15px'}}>Time:</span>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{padding: '5px 10px', borderRadius: '4px'}}
          >
            <option value="all">All time</option>
            <option value="day">Past 24 hours</option>
            <option value="week">Past week</option>
            <option value="month">Past month</option>
          </select>
        </div>

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