import React from 'react';

const Header = ({ currentUser, onAuthClick, onLogout }) => {
  return (
    <header className="header">
      <nav className="navbar">
        <div className="logo">
          <img 
            src="https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png" 
            alt="Reddit" 
          />
          <span>reddit</span>
        </div>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search Reddit" 
          />
        </div>
        <div className="nav-links">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '14px', color: '#1c1c1c' }}>
                Welcome, {currentUser}
              </span>
              <button 
                className="login-btn"
                onClick={onLogout}
              >
                Log Out
              </button>
            </div>
          ) : (
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