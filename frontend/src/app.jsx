import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Profile from './components/Profile'; 
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Post from './components/Post';
import RightSidebar from './components/RightSidebar';
import AuthModal from './components/AuthModal';
import { API_URL } from "./components/config.jsx";

const communities = [
  { id: 1, name: 'r/reactjs', members: '800k' },
  { id: 2, name: 'r/webdev', members: '2.1m' },
  { id: 3, name: 'r/programming', members: '4.5m' },
];

const App = () => {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Function to fetch posts from the backend
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch(`${API_URL}/posts`);
      if (response.ok) {
        const data = await response.json();
        // The data is already formatted correctly by the backend (Post model fields)
        setPosts(data.map(post => ({
            id: post._id,
            community: post.community,
            user: `u/${post.username}`,
            time: post.createdAt, // Will be formatted by Post.jsx/Profile.jsx
            title: post.title,
            content: post.content,
            votes: post.votes,
            comments: post.commentsCount,
            image: post.image,
            userVote: 0 
        })));
      } else {
        console.error("Failed to fetch posts from API");
        setPosts([]);
      }
    } catch (error) {
      console.error("Network error during post fetch:", error);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLogin = (username) => {
    setCurrentUser(username);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    alert('Logged out successfully.');
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
  };

  // 💡 FIX: This function now just triggers a re-fetch, which gets the new post.
  const addPost = () => {
    fetchPosts(); 
  };
  
  const handleVote = (postId, direction) => {
    // Voting logic here (currently not hooked up to backend)
    console.log(`Voted ${direction} on post ${postId}`);
  };

  return (
    <Router>
      <div className="app">
        <Header 
          currentUser={currentUser} 
          onAuthClick={handleAuthClick}
          onLogout={handleLogout}
        />
        
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />

        <Routes>
          
          <Route path="/" element={
            <div className="main-container">
              <Sidebar onCreatePost={addPost} currentUser={currentUser} />
              <div className="posts-container">
                {loadingPosts ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading feed...</div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <Post
                            key={post.id}
                            post={post}
                            onVote={handleVote}
                            currentUser={currentUser}
                        />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '50px' }}>No posts to display.</div>
                )}
              </div>
              <RightSidebar communities={communities} />
            </div>
          } />

          {/* 💡 FIX: Pass currentUser prop */}
          <Route path="/u/:username" element={<Profile currentUser={currentUser} />} />

        </Routes>
      </div>
    </Router>
  );
};

export default App;