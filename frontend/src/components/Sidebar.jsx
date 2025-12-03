import React, { useState } from 'react';
import { API_URL } from './config.jsx';

const Sidebar = ({ onCreatePost, currentUser }) => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', image: '' }); // Added image
  const [loading, setLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!currentUser) {
      alert('Please log in to create a post');
      return;
    }
    
    if (!newPost.title.trim()) {
        alert('Post title cannot be empty.');
        return;
    }
    
    setLoading(true);

    try {
        const postData = {
            // CRITICAL: Send the username of the current user
            username: currentUser, 
            community: 'r/javascript', // Hardcoded community
            title: newPost.title,
            content: newPost.content,
            image: newPost.image,
        };

        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create post: Server error.');
        }

        const createdPost = await response.json();
        
        // Pass the successfully created post to the parent App component
        onCreatePost(createdPost); 

        // Reset state
        setNewPost({ title: '', content: '', image: '' });
        setShowCreatePost(false);
        
    } catch (error) {
        console.error('Post creation error:', error);
        alert(`Failed to create post: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleCreatePostClick = () => {
    if (!currentUser) {
      alert('Please log in to create a post');
      return;
    }
    setShowCreatePost(true);
  };

  return (
    <aside className="sidebar">
      <div className="community-card">
        <h3>About Community</h3>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          Welcome to Reddit Clone! A community for sharing and discussing web development topics.
        </p>
        
        <button 
          onClick={handleCreatePostClick} 
          style={{ 
            width: '100%', 
            padding: '10px', 
            background: '#0079d3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '20px', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            cursor: 'pointer'
          }}
        >
          CREATE POST
        </button>
        
        {showCreatePost && (
          <div style={{ padding: '10px 0', borderTop: '1px solid #ccc', marginTop: '10px' }}>
            <h4>New Post in r/javascript</h4>
            <input
              type="text"
              placeholder="Title"
              value={newPost.title}
              onChange={(e) => setNewPost({...newPost, title: e.target.value})}
              style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <textarea
              placeholder="Content (optional)"
              value={newPost.content}
              onChange={(e) => setNewPost({...newPost, content: e.target.value})}
              style={{ width: '100%', marginBottom: '10px', padding: '8px', minHeight: '100px' }}
            />
            <input
              type="text"
              placeholder="Image URL (optional)"
              value={newPost.image}
              onChange={(e) => setNewPost({...newPost, image: e.target.value})}
              style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleCreatePost} 
                disabled={loading}
                style={{ 
                  padding: '8px 16px', 
                  background: loading ? '#ccc' : '#0079d3', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
              <button 
                onClick={() => setShowCreatePost(false)} 
                style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '20px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="community-stats" style={{ fontSize: '14px', marginBottom: '12px' }}>
          <div><strong>1.2m</strong> Members</div>
          <div><strong>2.4k</strong> Online</div>
          <div><strong>Created </strong>Jan 1, 2024</div>
        </div>
        
        <div className="community-rules">
          <h4>Community Rules</h4>
          <ul>
            <li>✓ Be kind and respectful</li>
            <li>✓ No spam or self-promotion</li>
            <li>✓ Keep posts relevant to web development</li>
            <li>✓ Use appropriate language</li>
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;