import React, { useState } from 'react';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // 1. Made function async to handle the API request
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      // Login logic (Unchanged)
      console.log('Logging in:', { username: formData.username, password: formData.password });
      onLogin(formData.username);
      onClose();
    } else {
      // Register logic
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords don't match!");
        return;
      }

      // --- NEW CODE STARTS HERE ---
      try {
        const response = await fetch('http://localhost:3000/users/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Success!
          console.log('Registered User:', data);
          alert("Account created successfully!");
          onLogin(data.user.username); // Log the user in with the username from DB
          onClose(); // Close the modal
        } else {
          // Error (e.g., User already exists)
          alert(data.message || "Registration failed");
        }
      } catch (error) {
        console.error("Connection Error:", error);
        alert("Could not connect to the server.");
      }
      // --- NEW CODE ENDS HERE ---
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const switchToSignup = () => {
    setIsLogin(false);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="auth-header">
          <img 
            src="https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png" 
            alt="Reddit" 
          />
          <h2>{isLogin ? 'Log in' : 'Sign up'}</h2>
          <p className="auth-subtitle">
            {isLogin ? 'By continuing, you agree to our User Agreement and Privacy Policy.' 
                     : 'By continuing, you agree to our User Agreement and Privacy Policy.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          )}
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {!isLogin && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          )}
          
          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "New to Reddit? " : "Already a redditor? "}
            <button 
              className="switch-btn"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'SIGN UP' : 'LOG IN'}
            </button>
          </p>
        </div>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="social-auth">
          <button className="social-btn google-btn">
            Continue with Google
          </button>
          <button className="social-btn apple-btn">
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;