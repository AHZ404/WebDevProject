import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from './config.jsx';
import './CreatePostModal.css';

const CreatePostModal = ({ isOpen, onClose, communities = [], currentUser, refreshPosts, currentCommunity = null }) => {
  const cleanCommunityName = (name) => {
    if (!name) return '';
    return name.startsWith('r/') ? name.substring(2) : name;
  };

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    community: currentCommunity ? cleanCommunityName(currentCommunity) : (communities[0]?.name ? cleanCommunityName(communities[0].name) : 'javascript')
  });

  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);

  useEffect(() => {
    if (currentCommunity) {
      setNewPost(prev => ({ ...prev, community: cleanCommunityName(currentCommunity) }));
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
    formData.append('community', cleanCommunityName(newPost.community));
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
      
      if (refreshPosts) {
        refreshPosts();
      }

      setNewPost({
        title: '',
        content: '',
        community: currentCommunity ? cleanCommunityName(currentCommunity) : (communities[0]?.name ? cleanCommunityName(communities[0].name) : 'javascript')
      });
      setMediaFile(null);
      setMediaPreview(null);
      onClose();
    } catch (error) {
      console.error('❌ Post creation error:', error);
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
      community: currentCommunity ? cleanCommunityName(currentCommunity) : (communities[0]?.name ? cleanCommunityName(communities[0].name) : 'javascript')
    });
    setMediaFile(null);
    setMediaPreview(null);
    onClose();
  };

  return (
    <div className="create-post-overlay" onClick={handleCancel}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="create-post-header">
          <h2>Create a Post</h2>
          <button className="close-btn" onClick={handleCancel}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="create-post-content">
          {/* Community Selector */}
          <div className="form-group">
            <label className="form-label">Community *</label>
            <select
              value={newPost.community}
              onChange={(e) => setNewPost({ ...newPost, community: cleanCommunityName(e.target.value) })}
              className="form-select"
            >
              {communities.map((comm) => {
                const cleanName = cleanCommunityName(comm.name);
                return (
                  <option key={comm.id} value={cleanName}>
                    r/{cleanName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Title Input */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              placeholder="Enter post title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              className="form-input"
            />
          </div>

          {/* Content Textarea */}
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea
              placeholder="Enter post content (optional)"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="form-textarea"
            />
          </div>

          {/* Media Upload */}
          <div className="form-group">
            <label className="form-label">Image or Video</label>
            <div className="media-upload-box">
              {mediaPreview ? (
                <div className="media-preview-container">
                  {mediaFile.type.startsWith('image/') ? (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="media-preview-img"
                    />
                  ) : (
                    <video
                      controls
                      src={mediaPreview}
                      className="media-preview-img"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="remove-media-btn"
                  >
                    Remove Media
                  </button>
                </div>
              ) : (
                <label className="upload-label">
                  <div style={{ marginBottom: '8px' }}>
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
        <div className="create-post-footer">
          <button
            onClick={handleCancel}
            className="btn btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePost}
            disabled={loading}
            className="btn btn-submit"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;