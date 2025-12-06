import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Profile from './components/Profile'; 
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Post from './components/Post';
import RightSidebar from './components/RightSidebar';
import AuthModal from './components/AuthModal';
import CreateCommunityModal from './components/CreateCommunityModal';
import Community from './components/Community'; 
import { API_URL } from "./components/config.jsx";

const App = () => {
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // 1. Fetch Posts
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const response = await fetch(`${API_URL}/posts`);
      if (response.ok) {
        const data = await response.json();
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
      } else {
        setPosts([]);
      }
    } catch (error) {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // 2. Fetch Communities
  const fetchCommunities = async () => {
    try {
      const response = await fetch(`${API_URL}/subreddits`);
      if (response.ok) {
        const data = await response.json();
        setCommunities(data); 
      }
    } catch (error) {
      console.error("Failed to fetch communities", error);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCommunities(); 

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
         setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
         setCurrentUser(savedUser); 
      }
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
    alert('Logged out successfully.');
  };

  // <--- UPDATED: Real Reddit Logic (Toggle & Switch)
  const handleVote = async (postId, direction) => {
    if (!currentUser) {
        return alert("You must be logged in to vote!");
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Calculate the new state locally
    let newVoteCount = post.votes;
    let newUserVote = 0; // 0 = none, 1 = up, -1 = down

    // CASE 1: User has NOT voted yet (0)
    if (post.userVote === 0) {
        if (direction === 'up') {
            newVoteCount += 1; 
            newUserVote = 1;
        } else {
            newVoteCount -= 1;
            newUserVote = -1;
        }
    }
    // CASE 2: User has already UPVOTED (1)
    else if (post.userVote === 1) {
        if (direction === 'up') {
            newVoteCount -= 1; // Toggle off (Undo vote)
            newUserVote = 0;
        } else {
            newVoteCount -= 2; // Switch from Up (+1) to Down (-1) = change of 2
            newUserVote = -1;
        }
    }
    // CASE 3: User has already DOWNVOTED (-1)
    else if (post.userVote === -1) {
        if (direction === 'up') {
            newVoteCount += 2; // Switch from Down (-1) to Up (+1) = change of 2
            newUserVote = 1;
        } else {
            newVoteCount += 1; // Toggle off (Undo vote)
            newUserVote = 0;
        }
    }

    // Update UI Instantly
    const updatedPosts = posts.map(p => 
        p.id === postId 
        ? { ...p, votes: newVoteCount, userVote: newUserVote } 
        : p
    );
    setPosts(updatedPosts);

    // Send to Backend
    try {
        await fetch(`${API_URL}/posts/${postId}/vote`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ direction })
        });
    } catch (error) {
        console.error("Network error voting:", error);
    }
  };

  return (
    <Router>
      <div className="app">
        <Header 
          currentUser={currentUser} 
          onAuthClick={() => setShowAuthModal(true)}
          onLogout={handleLogout}
          onCreateCommunityClick={() => setShowCommunityModal(true)} 
        />
        
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />

        <CreateCommunityModal
          isOpen={showCommunityModal}
          onClose={() => setShowCommunityModal(false)}
          refreshCommunities={fetchCommunities}
          currentUser={currentUser} 
        />

        <Routes>
          <Route path="/" element={
            <div className="main-container">
              <Sidebar onCreatePost={fetchPosts} currentUser={currentUser} communities={communities} />
              
              <div className="posts-container">
                {loadingPosts ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>Loading feed...</div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <Post
                            key={post.id}
                            post={post}
                            currentUser={currentUser}
                            onVote={handleVote} 
                        />
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '50px' }}>No posts found.</div>
                )}
              </div>

              <RightSidebar communities={communities} />
            </div>
          } />

          <Route path="/r/:communityName" element={<Community currentUser={currentUser} />} />
          <Route path="/u/:username" element={<Profile currentUser={currentUser} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;