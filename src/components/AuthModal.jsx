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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      // Login logic
      console.log('Logging in:', { username: formData.username, password: formData.password });
      onLogin(formData.username);
      onClose();
    } else {
      // Register logic
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords don't match!");
        return;
      }
      console.log('Registering:', formData);
      onLogin(formData.username);
      onClose();
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