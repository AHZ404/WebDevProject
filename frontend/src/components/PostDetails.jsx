import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Post from './Post'; 
import CommentItem from './CommentItem';
import { API_URL } from './config';
import './PostDetails.css'; // Import the new CSS

const PostDetails = ({ currentUser }) => {
  const { postId } = useParams(); 
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  const [summary, setSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  const buildCommentTree = (flatComments) => {
    const commentMap = {};
    const roots = [];

    flatComments.forEach(c => {
      c.children = [];
      commentMap[c._id] = c;
    });

    flatComments.forEach(c => {
      if (c.parentComment) {
        if (commentMap[c.parentComment]) {
           commentMap[c.parentComment].children.push(c);
        }
      } else {
        roots.push(c);
      }
    });

    return roots;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const postRes = await fetch(`${API_URL}/posts/${postId}`); 
        const postData = await postRes.json();
        
        const commentRes = await fetch(`${API_URL}/comments/post/${postId}`);
        const commentData = await commentRes.json();

        setPost(postData);
        setComments(buildCommentTree(commentData));
      } catch (error) {
        console.error("Error loading post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [postId]);

  const handleSummarize = async () => {
    if (!post?.content) return alert("This post has no text content to summarize.");
    
    setSummarizing(true);
    try {
      const res = await fetch(`${API_URL}/posts/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content }),
      });
  
      const data = await res.json();
      
      if (res.ok) {
        setSummary(data.summary);
      } else {
        alert(data.message || "Error summarizing. The AI might be warming up, try again in 30s.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to AI service");
    } finally {
      setSummarizing(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!currentUser) return alert("Log in to comment");
    if (!newComment.trim()) return;

    try {
        const res = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: newComment,
                postId: post._id,
                username: currentUser.username || currentUser,
                parentId: null
            })
        });

        if (res.ok) {
            window.location.reload(); 
        }
    } catch (err) {
        console.error(err);
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (!post) return <div className="error-state">Post not found.</div>;

  return (
    <div className="main-container">
       <div className="posts-container">
          {/* Post Card */}
          <Post 
            post={{
              ...post, 
              id: post._id, 
              user: `u/${post.username}`, 
              time: post.createdAt,
              mediaUrl: post.mediaUrl
            }} 
            onVote={() => {}} 
            currentUser={currentUser} 
          />

          {/* AI Summarizer */}
          <div className={`summary-wrapper ${summary ? 'has-content' : ''}`}>
            {!summary ? (
              <button 
                className="summarize-btn"
                onClick={handleSummarize} 
                disabled={summarizing}
              >
                {summarizing ? '✨ Summarizing...' : '✨ Summarize this post with AI'}
              </button>
            ) : (
              <div>
                <div className="summary-header">
                   <h4 className="summary-title">
                     ✨ AI Summary
                   </h4>
                   <button 
                     className="close-summary-btn"
                     onClick={() => setSummary(null)} 
                   >
                     Close
                   </button>
                </div>
                <p className="summary-text">
                  {summary}
                </p>
              </div>
            )}
          </div>

          {/* Comment Section */}
          <div className="comments-section">
              
              <div className="comment-input-wrapper">
                  <div className="comment-as">
                      Comment as <span className="username-highlight">
                        {currentUser?.username || currentUser || 'Guest'}
                      </span>
                  </div>
                  <textarea 
                    className="comment-textarea"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="What are your thoughts?"
                  />
                  <div className="comment-actions">
                      <button 
                        className="comment-submit-btn"
                        onClick={handleCommentSubmit}
                      >
                          Comment
                      </button>
                  </div>
              </div>

              <hr className="divider" />
              
              {comments.length > 0 ? (
                  comments.map(c => (
                    <CommentItem 
                        key={c._id} 
                        comment={c} 
                        postId={post._id}           
                        currentUser={currentUser}   
                    />
                  ))
              ) : (
                  <div className="no-comments">
                      No comments yet.
                  </div>
              )}
          </div>
       </div>
       
       {/* Sidebar removed as requested */}
    </div>
  );
};

export default PostDetails;