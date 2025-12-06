import React from 'react';
import { useNavigate } from 'react-router-dom'; // <--- 1. Import Hook

const RightSidebar = ({ communities }) => {
  const navigate = useNavigate(); // <--- 2. Initialize Hook

  return (
    <aside className="right-sidebar">
      <div className="top-communities">
        <h3>Top Growing Communities</h3>
        <ul className="community-list">
          {communities.map((community, index) => (
            <li key={community.id} className="community-item">
              <span className="community-number">{index + 1}</span>
              <div className="community-icon"></div>
              <div style={{ flex: 1 }}>
                
                {/* <--- 3. Update onClick to navigate to the new page */}
                <div 
                  onClick={() => navigate(`/${community.name}`)} // Goes to /r/reactjs
                  style={{ fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  className="community-name-hover" 
                >
                  {community.name}
                </div>
                
                <div style={{ fontSize: '12px', color: '#787c7e' }}>{community.members} members</div>
              </div>
              <button className="join-btn">Join</button>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="top-communities">
        <h3>About</h3>
        <div style={{ padding: '12px', fontSize: '14px', lineHeight: '1.4' }}>
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