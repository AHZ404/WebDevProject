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
import PostDetails from './components/PostDetails';

const App = () => {
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // 1. Fetch Posts (Username Check)
  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      // Get Username
      const savedUserStr = localStorage.getItem("user");
      let currentUsername = null;
      if (savedUserStr) {
          try {
              const parsed = JSON.parse(savedUserStr);
              currentUsername = parsed.username || parsed; 
          } catch(e) { currentUsername = savedUserStr; }
      }

      const response = await fetch(`${API_URL}/posts`);
      if (response.ok) {
        const data = await response.json();
        if (!Array.isArray(data)) return setPosts([]);

        setPosts(data.map(post => {
            // Check if our username is in the list
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
                user: `u/${post.username}`,
                time: post.createdAt, 
                title: post.title,
                content: post.content,
                votes: post.votes,
                comments: post.commentsCount,
                image: post.image,
                userVote: status, 
                upvotedBy: upList,
                downvotedBy: downList
            };
        }));
      } else { setPosts([]); }
    } catch (error) { setPosts([]); } finally { setLoadingPosts(false); }
  };

  const fetchCommunities = async () => {
    try {
      const response = await fetch(`${API_URL}/subreddits`);
      if (response.ok) {
        const data = await response.json();
        if(Array.isArray(data)) setCommunities(data);
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchPosts();
    fetchCommunities(); 
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try { setCurrentUser(JSON.parse(savedUser)); } catch (e) { setCurrentUser(savedUser); }
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    localStorage.setItem("user", JSON.stringify(user));
    fetchPosts(); 
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("user");
    alert('Logged out successfully.');
    fetchPosts();
  };

  const handleVote = async (postId, direction) => {
    if (!currentUser) return alert("You must be logged in to vote!");

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    let newVoteCount = post.votes;
    let newUserVote = 0; 
    if (post.userVote === 0) {
        if (direction === 'up') { newVoteCount += 1; newUserVote = 1; } 
        else { newVoteCount -= 1; newUserVote = -1; }
    } else if (post.userVote === 1) {
        if (direction === 'up') { newVoteCount -= 1; newUserVote = 0; } 
        else { newVoteCount -= 2; newUserVote = -1; }
    } else if (post.userVote === -1) {
        if (direction === 'up') { newVoteCount += 2; newUserVote = 1; } 
        else { newVoteCount += 1; newUserVote = 0; }
    }

    const updatedPosts = posts.map(p => p.id === postId ? { ...p, votes: newVoteCount, userVote: newUserVote } : p);
    setPosts(updatedPosts);

    try {
        await fetch(`${API_URL}/posts/${postId}/vote`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                direction, 
                // SEND USERNAME
                username: currentUser.username || currentUser 
            })
        });
    } catch (error) { console.error("Vote error:", error); }
  };

  return (
    <Router>
      <div className="app">
        <Header currentUser={currentUser} onAuthClick={() => setShowAuthModal(true)} onLogout={handleLogout} onCreateCommunityClick={() => setShowCommunityModal(true)} />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onLogin={handleLogin} />
        <CreateCommunityModal isOpen={showCommunityModal} onClose={() => setShowCommunityModal(false)} refreshCommunities={fetchCommunities} currentUser={currentUser} />
        <Routes>
          <Route path="/" element={<div className="main-container"><Sidebar onCreatePost={fetchPosts} currentUser={currentUser} communities={communities} /><div className="posts-container">{loadingPosts ? <div style={{textAlign:'center', padding:'50px'}}>Loading...</div> : posts.length > 0 ? posts.map(post => <Post key={post.id} post={post} currentUser={currentUser} onVote={handleVote} />) : <div style={{textAlign:'center', padding:'50px'}}>No posts found.</div>}</div><RightSidebar communities={communities} /></div>} />
          <Route path="/r/:communityName" element={<Community currentUser={currentUser} />} />
          <Route path="/u/:username" element={<Profile currentUser={currentUser} />} />
          <Route path="/r/:communityName/comments/:postId" element={<PostDetails currentUser={currentUser} />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;