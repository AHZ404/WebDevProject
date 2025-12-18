import React, { useState, useEffect } from 'react';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onLogin, mode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setIsLogin(mode === 'login');
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  }, [mode, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      // In a real app, you would validate login here too
      onLogin(formData.username);
      onClose();
    } else {
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords don't match!");
        return;
      }

      if (!formData.email) {
        alert("Email is required for registration!");
        return;
      }

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
          alert("Account created successfully!");
          onLogin(data.user.username);
          onClose();
        } else {
          alert(data.message || "Registration failed");
        }
      } catch (error) {
        console.error("Connection Error:", error);
        alert("Could not connect to the server.");
      }
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

  const switchToLogin = () => {
    setIsLogin(true);
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
        <button 
          className="close-btn" 
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        
        <div className="auth-header">
          <img 
            src="https://redditinc.com/hs-fs/hubfs/Reddit%20Inc/Content/Brand%20Page/Reddit_Logo.png?width=600&height=600&name=Reddit_Logo.png" 
            alt="Reddit" 
          />
          <h2>{isLogin ? 'Log in' : 'Sign up'}</h2>
          <p className="auth-subtitle">
            By continuing, you agree to our User Agreement and Privacy Policy.
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
              required={!isLogin}
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
              onClick={isLogin ? switchToSignup : switchToLogin}
              type="button"
            >
              {isLogin ? 'SIGN UP' : 'LOG IN'}
            </button>
          </p>
        </div>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <div className="social-auth">
          <button className="social-btn google-btn" type="button">
            Continue with Google
          </button>
          <button className="social-btn apple-btn" type="button">
            Continue with Apple
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;