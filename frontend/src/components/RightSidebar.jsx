import React from 'react';
import { useNavigate } from 'react-router-dom'; // <--- 1. Import Hook
import { API_URL } from './config';

const RightSidebar = ({ communities }) => {
  const navigate = useNavigate(); // <--- 2. Initialize Hook

  // Helper function to clean community name (remove r/ if present)
  const cleanCommunityName = (name) => {
    if (!name) return '';
    return name.startsWith('r/') ? name.substring(2) : name;
  };

  return (
    <aside className="right-sidebar">
      <div className="top-communities">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
          <h3 style={{ margin: 0 }}>RECENT POSTS</h3>
          <button style={{ 
            background: 'none', 
            border: 'none', 
            color: '#0079d3', 
            cursor: 'pointer', 
            fontSize: '12px', 
            fontWeight: 600,
            padding: 0
          }}>Clear</button>
        </div>
      </div>
      
      <div className="top-communities">
        <h3>Top Growing Communities</h3>
        <ul className="community-list">
          {communities.map((community, index) => {
            const cleanName = cleanCommunityName(community.name);
            return (
              <li key={community._id || community.id} className="community-item">
                <span className="community-number">{index + 1}</span>
                <div className="community-icon">
                  {community.logo ? (
                    <img 
                      src={`${API_URL}/${community.logo}`} 
                      alt={cleanName} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <div style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>r/</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div 
                    onClick={() => navigate(`/r/${cleanName}`)}
                    style={{ 
                      fontWeight: 600, 
                      fontSize: '14px', 
                      cursor: 'pointer',
                      color: '#d7dadc',
                      marginBottom: '2px'
                    }}
                  >
                    {`r/${cleanName}`}
                  </div>
                  <div style={{ fontSize: '12px', color: '#818384' }}>{community.members || 0} members</div>
                </div>
                <button className="join-btn">Join</button>
              </li>
            );
          })}
        </ul>
      </div>
      
      <div className="top-communities">
        <h3>About</h3>
        <div style={{ padding: '12px', fontSize: '14px', lineHeight: '1.5', color: '#d7dadc' }}>
          Reddit Clone is a demonstration of building a social media platform interface using React, HTML, and CSS.
          <br />
          <br />
          This is a frontend-only implementation for educational purposes.
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;