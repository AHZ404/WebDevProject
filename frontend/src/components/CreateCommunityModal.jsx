import React, { useState } from 'react';
import { API_URL } from './config';

const CreateCommunityModal = ({ isOpen, onClose, refreshCommunities, currentUser }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacyMode, setPrivacyMode] = useState('public'); // Default to public
  const [isOver18, setIsOver18] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return alert("Name is required");

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/subreddits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: `r/${name}`, 
            description,
            privacyMode, 
            isOver18,
            // <--- UPDATED: Send the username correctly
            username: currentUser.username || currentUser 
        })
      });

      const data = await response.json();

      if (response.ok) {
        refreshCommunities();
        onClose();
        // Reset Form
        setName('');
        setDescription('');
        setPrivacyMode('public');
        setIsOver18(false);
      } else {
        alert(data.message || "Failed to create community");
      }
    } catch (error) {
      console.error(error);
      alert("Network error");
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
    inputContainer: {
      display: 'flex', alignItems: 'center', border: '1px solid #EDEFF1', borderRadius: '4px', padding: '0 10px', marginBottom: '20px', height: '48px'
    },
    input: {
      border: 'none', outline: 'none', width: '100%', fontSize: '14px', marginLeft: '5px'
    },
    textarea: {
      width: '100%', border: '1px solid #EDEFF1', borderRadius: '4px', padding: '10px', minHeight: '100px', marginBottom: '20px', fontFamily: 'inherit', resize: 'vertical'
    },
    radioGroup: { marginBottom: '20px' },
    radioOption: { display: 'flex', alignItems: 'flex-start', marginBottom: '15px', cursor: 'pointer' },
    radioLabel: { marginLeft: '8px', fontWeight: '500', fontSize: '14px', color: '#1c1c1c' },
    subText: { fontSize: '12px', color: '#7c7c7c', marginTop: '2px' },
    footer: {
      padding: '16px 20px', backgroundColor: '#F6F7F8', borderTop: '1px solid #EDEFF1', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderRadius: '0 0 12px 12px'
    },
    btnCancel: {
      padding: '8px 16px', borderRadius: '99px', border: '1px solid #0079d3', color: '#0079d3', fontWeight: 'bold', background: 'transparent', cursor: 'pointer'
    },
    btnCreate: {
      padding: '8px 16px', borderRadius: '99px', border: 'none', backgroundColor: '#0079d3', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: name ? 1 : 0.5
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={{ fontSize: '16px', margin: 0 }}>Create a community</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#878A8C' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={styles.body}>
            {/* LEFT COLUMN: INPUTS */}
            <div style={styles.leftCol}>
              <div style={{ marginBottom: '15px' }}>
                <label style={styles.label}>Name</label>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#7c7c7c' }}>
                  Community names including capitalization cannot be changed.
                </div>
                <div style={styles.inputContainer}>
                  <span style={{ color: '#7c7c7c', fontWeight: 'bold' }}>r/</span>
                  <input 
                    style={styles.input} 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    maxLength={21}
                  />
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

              <label style={styles.label}>Community type</label>
              <div style={styles.radioGroup}>
                {/* PUBLIC OPTION */}
                <div style={styles.radioOption} onClick={() => setPrivacyMode('public')}>
                  <input 
                    type="radio" 
                    checked={privacyMode === 'public'} 
                    readOnly 
                    style={{ marginTop: '3px' }}
                  />
                  <div style={{marginLeft: '8px'}}>
                     <div style={{fontWeight: '500', fontSize: '14px'}}>
                        <span style={{marginRight: '5px'}}>Public</span> 
                        <span style={{fontSize: '10px', color: '#878A8C'}}>Anyone can view, post, and comment to this community</span>
                     </div>
                  </div>
                </div>

                {/* RESTRICTED OPTION */}
                <div style={styles.radioOption} onClick={() => setPrivacyMode('restricted')}>
                  <input 
                    type="radio" 
                    checked={privacyMode === 'restricted'} 
                    readOnly 
                    style={{ marginTop: '3px' }}
                  />
                  <div style={{marginLeft: '8px'}}>
                     <div style={{fontWeight: '500', fontSize: '14px'}}>
                        <span style={{marginRight: '5px'}}>Restricted</span> 
                        <span style={{fontSize: '10px', color: '#878A8C'}}>Anyone can view, but only approved users can contribute</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* MATURE CHECKBOX */}
              <label style={styles.label}>Adult content</label>
              <div style={styles.radioOption} onClick={() => setIsOver18(!isOver18)}>
                 <input 
                    type="checkbox" 
                    checked={isOver18} 
                    readOnly 
                    style={{ marginTop: '3px', width: '16px', height: '16px' }}
                 />
                 <div style={{marginLeft: '8px'}}>
                    <div style={{backgroundColor: '#ff585b', color: 'white', padding: '0 4px', borderRadius: '2px', fontSize: '10px', display: 'inline-block', marginRight: '5px', fontWeight: 'bold'}}>NSFW</div>
                    <span style={{fontSize: '14px', fontWeight: '500'}}>18+ year old community</span>
                 </div>
              </div>
            </div>

            {/* RIGHT COLUMN: PREVIEW CARD */}
            <div style={styles.rightCol}>
               <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#7c7c7c', textTransform: 'uppercase', fontWeight: 'bold' }}>Preview</h4>
               <div style={{ backgroundColor: 'white', borderRadius: '4px', border: '1px solid #ccc', overflow: 'hidden' }}>
                  {/* Fake Banner */}
                  <div style={{ height: '32px', backgroundColor: '#0079d3' }}></div>
                  
                  <div style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '-20px', marginBottom: '8px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0079d3', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>r/</div>
                        </div>
                        <div style={{ marginLeft: '8px', marginTop: '14px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>r/{name || 'name'}</div>
                        </div>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>
                        1 member • 1 online
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
            <button type="submit" style={styles.btnCreate} disabled={loading || !name}>
              {loading ? "Creating..." : "Create Community"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityModal;