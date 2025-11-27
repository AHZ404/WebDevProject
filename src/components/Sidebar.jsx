import React, { useState } from 'react';

const Sidebar = ({ onCreatePost }) => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });

  const handleCreatePost = () => {
    if (newPost.title.trim()) {
      const post = {
        id: Date.now(),
        community: 'r/javascript',
        user: 'u/current_user',
        time: 'Just now',
        title: newPost.title,
        content: newPost.content,
        votes: 1,
        comments: 0,
        image: null,
        userVote: 1
      };
      onCreatePost(post);
      setNewPost({ title: '', content: '' });
      setShowCreatePost(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="community-card">
        <h3>About Community</h3>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          Welcome to Reddit Clone! A community for sharing and discussing web development topics.
        </p>
        
        <button 
          className="create-post-btn"
          onClick={() => setShowCreatePost(true)}
        >
          Create Post
        </button>

        {showCreatePost && (
          <div className="create-post-modal" style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000,
            width: '90%',
            maxWidth: '500px'
          }}>
            <h3>Create Post</h3>
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCreatePost} style={{ padding: '8px 16px' }}>Post</button>
              <button onClick={() => setShowCreatePost(false)} style={{ padding: '8px 16px' }}>Cancel</button>
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