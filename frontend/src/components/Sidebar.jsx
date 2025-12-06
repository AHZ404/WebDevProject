import React, { useState } from 'react';
import { API_URL } from './config.jsx';

// <--- 1. Receive 'communities' as a prop
const Sidebar = ({ onCreatePost, currentUser, communities = [] }) => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  
  // <--- 2. Add 'community' to the state (default to the first one in the list)
  const [newPost, setNewPost] = useState({ 
    title: '', 
    content: '', 
    image: '',
    community: communities[0]?.name || 'r/javascript' 
  }); 
  
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
            username: currentUser, 
            community: newPost.community, // <--- 3. Use the selected community
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
        
        onCreatePost(createdPost); 

        // Reset state (Keep the current community selected)
        setNewPost(prev => ({ ...prev, title: '', content: '', image: '' }));
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
            
            {/* <--- 4. New Dropdown Menu for Communities */}
            <select
              value={newPost.community}
              onChange={(e) => setNewPost({...newPost, community: e.target.value})}
              style={{ 
                width: '100%', 
                marginBottom: '10px', 
                padding: '8px', 
                borderRadius: '4px',
                border: '1px solid #ccc' 
              }}
            >
              {communities.map(comm => (
                <option key={comm.id} value={comm.name}>
                  {comm.name}
                </option>
              ))}
            </select>

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