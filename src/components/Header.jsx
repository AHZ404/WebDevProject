import React from 'react';

const Header = () => {
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
          <button className="login-btn">Log In</button>
          <button className="signup-btn">Sign Up</button>
        </div>
      </nav>
    </header>
  );
};

export default Header;