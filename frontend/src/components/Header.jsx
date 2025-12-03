import React from 'react';
// ----------------------------------------------------
// NEW: Import Link for navigation
import { Link } from 'react-router-dom'; 
// ----------------------------------------------------
import './Header.css'; // Assuming you have this import

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
            // LOGGED IN VIEW: Now includes a Link to the profile page
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              
              {/* NEW: Link component wraps the username */}
              <Link to={`/u/${currentUser}`} style={{ textDecoration: 'none', color: '#0079d3', fontWeight: 'bold' }}>
                <span style={{ fontSize: '14px' }}>
                  Welcome, {currentUser}
                </span>
              </Link>

              <button 
                className="login-btn"
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