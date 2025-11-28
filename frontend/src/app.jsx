import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Post from './components/Post';
import RightSidebar from './components/RightSidebar';
import AuthModal from './components/AuthModal';

const App = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      community: 'r/javascript',
      user: 'u/js_dev',
      time: '4 hours ago',
      title: 'Just learned about React Hooks and my mind is blown!',
      content: 'After years of using class components, I finally tried hooks and the developer experience is incredible. The code is so much cleaner!',
      votes: 256,
      comments: 42,
      image: null,
      userVote: 0
    },
    {
      id: 2,
      community: 'r/programming',
      user: 'u/code_wizard',
      time: '6 hours ago',
      title: 'The future of web development: What to expect in 2024',
      content: '',
      votes: 189,
      comments: 78,
      image: 'https://via.placeholder.com/600x400/0079d3/ffffff?text=Web+Dev+2024',
      userVote: 0
    },
    {
      id: 3,
      community: 'r/webdev',
      user: 'u/frontend_fan',
      time: '8 hours ago',
      title: 'CSS Grid vs Flexbox: When to use which?',
      content: 'I\'ve created a comprehensive guide comparing CSS Grid and Flexbox with practical examples for different layout scenarios.',
      votes: 142,
      comments: 31,
      image: null,
      userVote: 0
    }
  ]);

  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const communities = [
    { id: 1, name: 'r/javascript', members: '2.4m' },
    { id: 2, name: 'r/reactjs', members: '1.8m' },
    { id: 3, name: 'r/webdev', members: '1.2m' },
    { id: 4, name: 'r/programming', members: '3.7m' },
    { id: 5, name: 'r/learnprogramming', members: '2.1m' }
  ];

  const handleVote = (postId, direction) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const voteChange = (post.userVote === direction) ? -direction : 
                          (post.userVote === 0) ? direction : direction * 2;
        
        return {
          ...post,
          votes: post.votes + voteChange,
          userVote: (post.userVote === direction) ? 0 : direction
        };
      }
      return post;
    }));
  };

  const addPost = (newPost) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setPosts([newPost, ...posts]);
  };

  const handleLogin = (username) => {
    setCurrentUser(username);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="app">
      <Header 
        currentUser={currentUser} 
        onAuthClick={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />
      <div className="main-container">
        <Sidebar onCreatePost={addPost} currentUser={currentUser} />
        <div className="posts-container">
          {posts.map(post => (
            <Post
              key={post.id}
              post={post}
              onVote={handleVote}
              currentUser={currentUser}
            />
          ))}
        </div>
        <RightSidebar communities={communities} />
      </div>
      
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default App;