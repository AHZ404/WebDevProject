import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config.jsx';

const CreatePostModal = ({ isOpen, onClose, communities = [], currentUser, refreshPosts, currentCommunity = null }) => {
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    community: currentCommunity || (communities[0]?.name || 'r/javascript')
  });

  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  // Update community when currentCommunity prop changes
  useEffect(() => {
    if (currentCommunity) {
      setNewPost(prev => ({ ...prev, community: currentCommunity }));
    }
  }, [currentCommunity]);

  if (!isOpen) return null;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaFile(null);
      setMediaPreview(null);
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) {
      alert('Please log in to create a post');
      return;
    }

    if (!newPost.title.trim()) {
      alert('Post title cannot be empty.');
      return;
    }

    if (!newPost.community) {
      alert('Please select a community.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('username', currentUser.username || currentUser);
    formData.append('community', newPost.community);
    formData.append('title', newPost.title);
    formData.append('content', newPost.content);
    if (mediaFile) {
      formData.append('media', mediaFile);
    }

    try {
      const response = await axios.post(`${API_URL}/posts/create`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const createdPost = response.data;
      
      // Call refresh function if provided
      if (refreshPosts) {
        refreshPosts();
      }

      // Reset form
      setNewPost({
        title: '',
        content: '',
        community: currentCommunity || (communities[0]?.name || 'r/javascript')
      });
      setMediaFile(null);
      setMediaPreview(null);
      onClose();
    } catch (error) {
      console.error('❌ Post creation error:', error);
      console.error('❌ Response:', error.response?.data);
      alert(`Failed to create post: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleCancel = () => {
    setNewPost({
      title: '',
      content: '',
      community: currentCommunity || (communities[0]?.name || 'r/javascript')
    });
    setMediaFile(null);
    setMediaPreview(null);
    onClose();
  };

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '600px',
      maxWidth: '95%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      padding: '20px',
      borderBottom: '1px solid #ccc',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#999',
    },
    content: {
      padding: '20px',
      flex: 1,
    },
    formGroup: {
      marginBottom: '16px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
      fontSize: '14px',
      color: '#1c1c1c',
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    textarea: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      minHeight: '120px',
      boxSizing: 'border-box',
      resize: 'vertical',
    },
    select: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    mediaBox: {
      border: '1px dashed #ccc',
      padding: '16px',
      borderRadius: '4px',
      textAlign: 'center',
      marginBottom: '16px',
    },
    mediaPreview: {
      marginBottom: '12px',
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '200px',
      borderRadius: '4px',
    },
    removeMediaButton: {
      marginTop: '8px',
      padding: '6px 12px',
      background: '#ccc',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    footer: {
      padding: '16px 20px',
      borderTop: '1px solid #ccc',
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
    },
    button: {
      padding: '8px 24px',
      borderRadius: '20px',
      border: 'none',
      fontWeight: 'bold',
      cursor: 'pointer',
      fontSize: '14px',
    },
    postButton: {
      background: '#0079d3',
      color: 'white',
    },
    postButtonDisabled: {
      background: '#ccc',
      color: '#666',
    },
    cancelButton: {
      background: '#f0f0f0',
      color: '#1c1c1c',
      border: '1px solid #ccc',
    },
  };

  return (
    <div style={styles.overlay} onClick={handleCancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Create a Post</h2>
          <button style={styles.closeButton} onClick={handleCancel}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Community Selector */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Community *</label>
            <select
              value={newPost.community}
              onChange={(e) => setNewPost({ ...newPost, community: e.target.value })}
              style={styles.select}
            >
              {communities.map((comm) => (
                <option key={comm.id} value={comm.name}>
                  {comm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title Input */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              placeholder="Enter post title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              style={styles.input}
            />
          </div>

          {/* Content Textarea */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Content</label>
            <textarea
              placeholder="Enter post content (optional)"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              style={styles.textarea}
            />
          </div>

          {/* Media Upload */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Image or Video</label>
            <div style={styles.mediaBox}>
              {mediaPreview ? (
                <div>
                  <div style={styles.mediaPreview}>
                    {mediaFile.type.startsWith('image/') ? (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        style={styles.previewImage}
                      />
                    ) : (
                      <video
                        controls
                        src={mediaPreview}
                        style={styles.previewImage}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    style={styles.removeMediaButton}
                  >
                    Remove Media
                  </button>
                </div>
              ) : (
                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                    Click to upload Image/Video
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            onClick={handleCancel}
            style={{ ...styles.button, ...styles.cancelButton }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePost}
            disabled={loading}
            style={{
              ...styles.button,
              ...(loading ? styles.postButtonDisabled : styles.postButton),
            }}
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
