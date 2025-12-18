import React, { useState, useEffect } from 'react';
import { API_URL } from './config';
import './CreateCommunityModal.css';

const CreateCommunityModal = ({ isOpen, onClose, refreshCommunities, currentUser }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacyMode, setPrivacyMode] = useState('public');
  const [isOver18, setIsOver18] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  if (!isOpen) return null;

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return alert("Name is required");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('privacyMode', privacyMode);
      formData.append('isOver18', isOver18);
      formData.append('username', currentUser.username || currentUser);
      
      if (logoFile) formData.append('logo', logoFile);
      if (bannerFile) formData.append('banner', bannerFile);

      const response = await fetch(`${API_URL}/subreddits`, {
        method: 'POST',
        body: formData 
      });

      const data = await response.json();

      if (response.ok) {
        if (refreshCommunities) refreshCommunities();
        onClose();
        // Reset form
        setName('');
        setDescription('');
        setPrivacyMode('public');
        setIsOver18(false);
        setLogoFile(null);
        setLogoPreview(null);
        setBannerFile(null);
        setBannerPreview(null);
      } else {
        alert(data.message || "Failed to create community");
      }
    } catch (error) {
      alert("Network error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-community-overlay" onClick={onClose}>
      <div className="create-community-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <h2>Create a community</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-body">
            
            {/* LEFT COLUMN: INPUTS */}
            <div className="left-col">
              <div className="form-group">
                <label className="form-label">Name</label>
                <div className="help-text">
                  Community names including capitalization cannot be changed.
                </div>
                <div className="input-container">
                  <span className="input-prefix">r/</span>
                  <input 
                    className="form-input"
                    value={name} 
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value.startsWith('r/')) {
                        value = value.substring(2);
                      }
                      setName(value);
                    }} 
                    maxLength={21}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your community..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Community Logo (Optional)</label>
                <p className="help-text">
                  Upload a square image for your community icon
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="upload-btn">
                  Choose Logo
                </label>
                {logoPreview && (
                  <div className="preview-thumbnail-container">
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="preview-thumbnail"
                      style={{ maxHeight: '60px', width: '60px', objectFit: 'cover', borderRadius: '50%' }} 
                    />
                    <button
                      type="button"
                      onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Community Banner (Optional)</label>
                <p className="help-text">
                  Upload a wide banner image (recommended 1920x384px)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  style={{ display: 'none' }}
                  id="banner-upload"
                />
                <label htmlFor="banner-upload" className="upload-btn">
                  Choose Banner
                </label>
                {bannerPreview && (
                  <div className="preview-thumbnail-container">
                    <img 
                      src={bannerPreview} 
                      alt="Banner preview" 
                      className="preview-thumbnail"
                      style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'cover', borderRadius: '4px' }} 
                    />
                    <button
                      type="button"
                      onClick={() => { setBannerFile(null); setBannerPreview(null); }}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <label className="form-label" style={{marginTop: '24px'}}>Community type</label>
              
              {/* PUBLIC */}
              <div className="radio-option" onClick={() => setPrivacyMode('public')}>
                <input 
                  type="radio" 
                  checked={privacyMode === 'public'} 
                  readOnly 
                  className="radio-input"
                />
                <div className="radio-details">
                  <span className="radio-label-text">Public</span> 
                  <span className="radio-subtext">Anyone can view, post, and comment to this community</span>
                </div>
              </div>

              {/* RESTRICTED */}
              <div className="radio-option" onClick={() => setPrivacyMode('restricted')}>
                <input 
                  type="radio" 
                  checked={privacyMode === 'restricted'} 
                  readOnly 
                  className="radio-input"
                />
                <div className="radio-details">
                  <span className="radio-label-text">Restricted</span> 
                  <span className="radio-subtext">Anyone can view, but only approved users can contribute</span>
                </div>
              </div>

              {/* MATURE CHECKBOX */}
              <label className="form-label" style={{marginTop: '24px'}}>Adult content</label>
              <div className="radio-option" onClick={() => setIsOver18(!isOver18)}>
                 <input 
                   type="checkbox" 
                   checked={isOver18} 
                   readOnly 
                   className="radio-input"
                   style={{accentColor: '#ff4500'}}
                 />
                 <div className="radio-details">
                    <span className="nsfw-tag">NSFW</span>
                    <span className="radio-label-text">18+ year old community</span>
                 </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PREVIEW CARD & ACTIONS */}
            <div className="right-col">
              <h4 className="preview-header">Preview</h4>
              
              <div className="preview-card">
                {/* Banner Preview */}
                <div 
                  className="preview-banner" 
                  style={{ backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none' }}
                ></div>
                
                <div className="preview-content">
                  <div className="preview-id-row">
                      <div className="preview-logo">
                          {logoPreview ? 
                            <img src={logoPreview} alt="Logo" /> :
                            <span>r/</span>
                          }
                      </div>
                      <div className="preview-title-container">
                          <div className="preview-title">r/{name ? name.replace(/^r\//, '') : 'name'}</div>
                      </div>
                  </div>
                  
                  <div className="preview-subtitle" style={{marginBottom: '8px'}}>
                      1 member • 1 online
                  </div>
                  <div className="preview-desc">
                      {description || "Your community description will appear here."}
                  </div>
                </div>
              </div>

              {/* MOVED ACTION BUTTONS HERE */}
              <div className="action-buttons">
                <button 
                  type="submit" 
                  className="btn btn-create" 
                  disabled={loading || !name}
                >
                  {loading ? "Creating..." : "Create Community"}
                </button>
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="btn btn-cancel"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityModal;