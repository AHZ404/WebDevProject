import React, { useState, useEffect } from 'react';
import { API_URL } from './config';

const EditCommunityModal = ({ isOpen, onClose, subreddit, currentUser, onUpdate }) => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // State for images
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  // Initialize form with existing data when modal opens or subreddit changes
  useEffect(() => {
    if (subreddit) {
      setDescription(subreddit.description || '');
      setLogoPreview(subreddit.logo ? `${API_URL}/${subreddit.logo}` : null);
      setBannerPreview(subreddit.banner ? `${API_URL}/${subreddit.banner}` : null);
      setLogoFile(null);
      setBannerFile(null);
    }
  }, [subreddit, isOpen]);

  // Clean up previews to prevent memory leaks
  useEffect(() => {
    return () => {
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      if (bannerPreview && bannerPreview.startsWith('blob:')) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  if (!isOpen || !subreddit) return null;

  // Handlers for file inputs
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

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', subreddit.name);
      formData.append('description', description);
      formData.append('username', currentUser.username || currentUser);
      
      if (logoFile) formData.append('logo', logoFile);
      if (bannerFile) formData.append('banner', bannerFile);

      console.log('=== COMMUNITY UPDATE FORM ===');
      console.log('Name:', subreddit.name);
      console.log('Description:', description);
      console.log('Username:', currentUser.username || currentUser);
      console.log('Has logo:', !!logoFile);
      console.log('Has banner:', !!bannerFile);
      console.log('===============================');

      const response = await fetch(`${API_URL}/subreddits/${encodeURIComponent(subreddit.name)}`, {
        method: 'PUT',
        body: formData 
      });

      const data = await response.json();

      if (response.ok) {
        if (onUpdate) onUpdate(data);
        onClose();
      } else {
        console.error('❌ Server error:', data);
        alert(data.message || "Failed to update community");
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert("Network error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Styles (Reddit-like Look)
  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    },
    modal: {
      backgroundColor: 'white', borderRadius: '12px', width: '800px', maxWidth: '95%',
      height: 'auto', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
    },
    header: {
      padding: '16px 20px', borderBottom: '1px solid #EDEFF1', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    body: {
      padding: '20px', display: 'flex', gap: '30px', flexDirection: 'row'
    },
    leftCol: { flex: 1.5 },
    rightCol: { flex: 1, backgroundColor: '#F6F7F8', borderRadius: '8px', padding: '15px', height: 'fit-content' },
    label: { fontWeight: '700', fontSize: '14px', marginBottom: '8px', display: 'block', color: '#1c1c1c' },
    textarea: {
      width: '100%', border: '1px solid #EDEFF1', borderRadius: '4px', padding: '10px', minHeight: '100px', marginBottom: '20px', fontFamily: 'inherit', resize: 'vertical'
    },
    imageUploadSection: { marginBottom: '20px' },
    uploadButton: {
      display: 'inline-block', padding: '6px 12px', borderRadius: '20px', border: '1px solid #0079d3', color: '#0079d3', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginBottom: '10px'
    },
    footer: {
      padding: '16px 20px', backgroundColor: '#F6F7F8', borderTop: '1px solid #EDEFF1', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderRadius: '0 0 12px 12px'
    },
    btnCancel: {
      padding: '8px 16px', borderRadius: '99px', border: '1px solid #0079d3', color: '#0079d3', fontWeight: 'bold', background: 'transparent', cursor: 'pointer'
    },
    btnSave: {
      padding: '8px 16px', borderRadius: '99px', border: 'none', backgroundColor: '#0079d3', color: 'white', fontWeight: 'bold', cursor: 'pointer'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={{ fontSize: '16px', margin: 0 }}>Edit Community</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#878A8C' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={styles.body}>
            {/* LEFT COLUMN: INPUTS */}
            <div style={styles.leftCol}>
              <div style={{ marginBottom: '15px' }}>
                <label style={styles.label}>Community Name</label>
                <div style={{ padding: '10px', backgroundColor: '#F6F7F8', borderRadius: '4px', color: '#7c7c7c', fontSize: '14px' }}>
                  r/{subreddit.name}
                </div>
                <div style={{ fontSize: '12px', color: '#7c7c7c', marginTop: '4px' }}>
                  Community names cannot be changed.
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={styles.label}>Description</label>
                <textarea 
                  style={styles.textarea} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us about your community..."
                />
              </div>

              <div style={styles.imageUploadSection}>
                <label style={styles.label}>Community Logo (Optional)</label>
                <p style={{ fontSize: '12px', color: '#7c7c7c', marginBottom: '10px' }}>
                  Upload a square image for your community icon
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                  id="logo-upload-edit"
                />
                <label htmlFor="logo-upload-edit" style={styles.uploadButton}>
                  {logoPreview ? 'Change Logo' : 'Choose Logo'}
                </label>
                {logoPreview && (
                  <div>
                    <img src={logoPreview} alt="Logo preview" style={{ maxHeight: '80px', width: '80px', objectFit: 'cover', borderRadius: '50%' }} />
                    <button
                      type="button"
                      onClick={() => { 
                        setLogoFile(null); 
                        if (subreddit.logo) {
                          setLogoPreview(`${API_URL}/${subreddit.logo}`);
                        } else {
                          setLogoPreview(null);
                        }
                      }}
                      style={{ marginLeft: '10px', fontSize: '12px', color: '#ff4500', cursor: 'pointer', border: 'none', background: 'none' }}
                    >
                      Remove New
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.imageUploadSection}>
                <label style={styles.label}>Community Banner (Optional)</label>
                <p style={{ fontSize: '12px', color: '#7c7c7c', marginBottom: '10px' }}>
                  Upload a wide banner image (recommended 1920x384px)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  style={{ display: 'none' }}
                  id="banner-upload-edit"
                />
                <label htmlFor="banner-upload-edit" style={styles.uploadButton}>
                  {bannerPreview ? 'Change Banner' : 'Choose Banner'}
                </label>
                {bannerPreview && (
                  <div>
                    <img src={bannerPreview} alt="Banner preview" style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                    <button
                      type="button"
                      onClick={() => { 
                        setBannerFile(null); 
                        if (subreddit.banner) {
                          setBannerPreview(`${API_URL}/${subreddit.banner}`);
                        } else {
                          setBannerPreview(null);
                        }
                      }}
                      style={{ marginLeft: '10px', fontSize: '12px', color: '#ff4500', cursor: 'pointer', border: 'none', background: 'none' }}
                    >
                      Remove New
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: PREVIEW CARD */}
            <div style={styles.rightCol}>
               <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#7c7c7c', textTransform: 'uppercase', fontWeight: 'bold' }}>Preview</h4>
               <div style={{ backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ccc', overflow: 'hidden' }}>
                  {/* Banner Preview */}
                  <div style={{ height: '32px', backgroundColor: '#0079d3', backgroundImage: bannerPreview ? `url(${bannerPreview})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                  
                  <div style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '-20px', marginBottom: '8px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', overflow: 'hidden' }}>
                            {logoPreview ? 
                              <img src={logoPreview} alt="" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> :
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0079d3', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>r/</div>
                            }
                        </div>
                        <div style={{ marginLeft: '8px', marginTop: '14px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>r/{subreddit.name}</div>
                        </div>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                        {subreddit.members || 1} member{subreddit.members !== 1 ? 's' : ''}
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#1c1c1c' }}>
                        {description || "Your community description will appear here."}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* FOOTER */}
          <div style={styles.footer}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>Cancel</button>
            <button type="submit" style={styles.btnSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCommunityModal;
