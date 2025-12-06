import React, { useState } from 'react';
import { Link } from 'react-router-dom'; 
import './Header.css'; 

// <--- 1. Accept the new prop 'onCreateCommunityClick'
const Header = ({ currentUser, onAuthClick, onLogout, onCreateCommunityClick }) => {
  // State to toggle the Create menu
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <header className="header">
      <nav className="navbar">
        {/* --- LOGO SECTION --- */}
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <img 
            src="https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png" 
            alt="Reddit" 
          />
          <span>reddit</span>
        </Link>
        
        {/* --- SEARCH BAR --- */}
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search Reddit" 
          />
        </div>

        {/* --- NAVIGATION LINKS --- */}
        <div className="nav-links">
          
          {/* --- CREATE DROPDOWN --- */}
          <div className="create-dropdown-container">
            <button 
              className="create-btn" 
              onClick={() => setIsCreateOpen(!isCreateOpen)}
            >
              <span className="plus-icon">+</span> 
              <span className="create-text">Create</span>
            </button>

            {isCreateOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => console.log('Go to Create Post')}>
                  <span className="item-icon">📝</span>
                  Create Post
                </div>
                
                {/* <--- 2. CONNECTED BUTTON IS HERE */}
                <div 
                  className="dropdown-item" 
                  onClick={() => {
                     setIsCreateOpen(false); // Close dropdown
                     if (currentUser) {
                        onCreateCommunityClick(); // Open the new Modal
                     } else {
                        onAuthClick(); // Or ask them to login first
                     }
                  }}
                >
                  <span className="item-icon">r/</span>
                  Create Community
                </div>
              </div>
            )}
          </div>

          {/* --- AUTH BUTTONS --- */}
          {currentUser ? (
            // LOGGED IN VIEW
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              
              <Link to={`/u/${currentUser.username || currentUser}`} style={{ textDecoration: 'none', color: '#0079d3', fontWeight: 'bold' }}>
                <span style={{ fontSize: '14px' }}>
                  Welcome, {currentUser.username || currentUser}
                </span>
              </Link>

              <button 
                className="logout-btn"
                onClick={onLogout}
              >
                Log Out
              </button>
            </div>
          ) : (
            // LOGGED OUT VIEW
            <button 
              className="login-btn"
              onClick={onAuthClick}
            >
              Log In
            </button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;