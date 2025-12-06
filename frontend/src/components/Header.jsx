import React from 'react';
// ----------------------------------------------------
// NEW: Import Link for navigation
import { Link } from 'react-router-dom'; 
// ----------------------------------------------------
import './Header.css'; // Assuming you have this import

const Header = ({ currentUser, onAuthClick, onLogout }) => {
  // State to toggle the Create menu
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
          {/* --- NEW CREATE DROPDOWN --- */}
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
                <div className="dropdown-item" onClick={() => console.log('Go to Create Community')}>
                  <span className="item-icon">r/</span>
                  Create Community
                </div>
              </div>
            )}
          </div>
          {/* --------------------------- */}

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