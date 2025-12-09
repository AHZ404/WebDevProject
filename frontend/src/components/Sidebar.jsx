import React, { useState } from 'react';
import axios from 'axios';
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
  const [mediaFile, setMediaFile] = useState(null); // To store the selected File object
  const [mediaPreview, setMediaPreview] = useState(null);
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setMediaFile(file);
            setMediaPreview(URL.createObjectURL(file)); // Create a temporary URL for browser preview
        } else {
            setMediaFile(null);
            setMediaPreview(null);
        }

    };
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
   
    const formData = new FormData();
    // FIX: Use currentUser.username || currentUser to ensure it's always a string
    formData.append('username', currentUser.username || currentUser);
    formData.append('community', newPost.community);
    formData.append('title', newPost.title);
    formData.append('content', newPost.content);
    if (mediaFile) {
        formData.append("media", mediaFile);
    }
    // Log FormData contents for debugging
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }
    try {
        const response = await axios.post(`${API_URL}/posts/create`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data' // <--- Make sure this is set
            }
        });
        const createdPost = response.data;
        onCreatePost(createdPost);
        setNewPost(prev => ({ ...prev, title: '', content: '' }));
        setMediaFile(null);
        setMediaPreview(null);
        setShowCreatePost(false);
    } catch (error) {
        console.error('❌ Post creation error:', error);
        console.error('❌ Response:', error.response?.data); // <--- ADD THIS to see backend error
        alert(`Failed to create post: ${error.response?.data?.message || error.message}`);
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
       <div style={{ marginBottom: '10px', border: '1px dashed #ccc', padding: '10px', borderRadius: '4px' }}>
                            {mediaPreview ? (
                                <div>
                                    {/* Preview: Check if it's an image or video */}
                                    {mediaFile.type.startsWith('image/') ? (
                                        <img src={mediaPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px' }} />
                                    ) : (
                                        <video controls src={mediaPreview} style={{ maxWidth: '100%', maxHeight: '150px' }} />
                                    )}
                                    <button 
                                        type="button" 
                                        onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                                        style={{ marginTop: '5px', background: '#ccc', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                                    >
                                        Remove File
                                    </button>
                                </div>
                            ) : (
                                <label style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
                                    Click to upload Image/Video
                                    <input
                                        type="file"
                                        accept="image/*,video/*" // Accepts both images and videos
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }} // Hide the actual input element
                                    />
                                </label>
                            )}
                        </div>
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