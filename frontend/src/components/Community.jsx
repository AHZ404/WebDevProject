import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Post from './Post';
import { API_URL } from './config';

const Community = ({ currentUser, onCreatePostClick, communities = [], refreshPosts }) => {
  const { communityName } = useParams(); // Grabs "reactjs" from url /r/reactjs
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch posts specifically for this community
  useEffect(() => {
    const fetchCommunityPosts = async () => {
      setLoading(true);
      try {
        // Use the filter endpoint we just built!
        const response = await fetch(`${API_URL}/posts?community=r/${communityName}`);
        const data = await response.json();
        
        if (response.ok) {
           setPosts(data.map(post => ({
            id: post._id,
            community: post.community,
            user: `u/${post.username}`,
            time: post.createdAt, 
            title: post.title,
            content: post.content,
            votes: post.votes,
            comments: post.commentsCount,
            image: post.image,
            userVote: 0 
          })));
        }
      } catch (error) {
        console.error("Failed to load community posts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityPosts();
  }, [communityName]);

  return (
    <div className="community-page">
      {/* --- BANNER SECTION --- */}
      <div className="community-banner" style={{ height: '150px', backgroundColor: '#33a8ff' }}>
        {/* Placeholder for real banner image later */}
      </div>

      {/* --- HEADER SECTION --- */}
      <div className="community-header" style={{ padding: '0 24px', background: 'white', marginBottom: '20px' }}>
        <div style={{ maxWidth: '984px', margin: '0 auto', display: 'flex', alignItems: 'flex-start', marginTop: '-14px' }}>
          
          {/* Icon */}
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', border: '4px solid white', 
            backgroundColor: '#0079d3', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '40px', color: 'white', fontWeight: 'bold'
          }}>
            r/
          </div>

          <div style={{ marginLeft: '16px', paddingTop: '24px', paddingBottom: '24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
              {/* Capitalize the first letter */}
              r/{communityName}
            </h1>
            <p style={{ color: '#7c7c7c', margin: '4px 0 0 0', fontSize: '14px' }}>r/{communityName}</p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px', marginLeft: '24px' }}>
            <button 
              onClick={onCreatePostClick}
              style={{ 
                padding: '8px 24px', 
                borderRadius: '99px', 
                border: 'none', 
                fontWeight: 'bold',
                color: 'white', 
                backgroundColor: '#0079d3', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Create Post
            </button>
            <button style={{ 
              padding: '4px 24px', 
              borderRadius: '99px', 
              border: '1px solid #0079d3', 
              fontWeight: 'bold',
              color: 'white', 
              backgroundColor: '#0079d3', 
              cursor: 'pointer'
            }}>
              Join
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <div className="main-container">
        <div className="posts-container">
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading r/{communityName}...</div>
            ) : posts.length > 0 ? (
                posts.map(post => (
                    <Post key={post.id} post={post} currentUser={currentUser} />
                ))
            ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <h3>There are no posts in r/{communityName} yet.</h3>
                    <p>Be the first to post!</p>
                </div>
            )}
        </div>
        
        {/* We can reuse Sidebar or make a specialized CommunitySidebar later */}
        <div className="right-sidebar">
             <div className="community-card">
                 <h3>About Community</h3>
                 <p>Welcome to r/{communityName}!</p>
                 <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                     Created Today
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default Community;