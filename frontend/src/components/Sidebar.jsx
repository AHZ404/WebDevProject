import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from './config.jsx';

// <--- 1. Receive 'communities' as a prop
const Sidebar = ({ onCreatePost, currentUser, communities = [], onCreatePostClick }) => {

  return (
    <aside className="sidebar">
      <div className="community-card">
        <h3>About Community</h3>
        <p style={{ fontSize: '14px', marginBottom: '12px' }}>
          Welcome to Reddit Clone! A community for sharing and discussing web development topics.
        </p>
        
        <button 
          onClick={() => {
            if (!currentUser) {
              alert('Please log in to create a post');
              return;
            }
            onCreatePostClick();
          }}
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