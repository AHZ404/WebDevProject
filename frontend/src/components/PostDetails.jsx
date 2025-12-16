import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Post from './Post'; 
import CommentItem from './CommentItem';
import { API_URL } from './config';

const PostDetails = ({ currentUser }) => {
  const { postId } = useParams(); 
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  // Helper: Build Tree from Flat List
  const buildCommentTree = (flatComments) => {
    const commentMap = {};
    const roots = [];

    // 1. Init map
    flatComments.forEach(c => {
      c.children = [];
      commentMap[c._id] = c;
    });

    // 2. Link children
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

  if (loading) return <div style={{padding:'40px', textAlign:'center'}}>Loading...</div>;
  if (!post) return <div style={{padding:'40px'}}>Post not found.</div>;

  return (
    <div className="main-container">
       <div className="posts-container">
          {/* Post Card */}
          <Post post={{
              ...post, 
              id: post._id, 
              user: `u/${post.username}`, 
              time: post.createdAt,
              mediaUrl: post.mediaUrl
          }} onVote={() => {}} currentUser={currentUser} />

          {/* Comment Section */}
          <div style={{ background: 'white', marginTop: '10px', padding: '20px', borderRadius: '4px' }}>
              
              <div style={{ marginBottom: '30px' }}>
                  <div style={{ fontSize: '12px', marginBottom: '5px' }}>
                      Comment as <span style={{color: '#0079d3'}}>{currentUser?.username || currentUser || 'Guest'}</span>
                  </div>
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="What are your thoughts?"
                    style={{ width: '100%', height: '100px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  />
                  <div style={{ textAlign: 'right', marginTop: '5px' }}>
                      <button 
                        onClick={handleCommentSubmit}
                        style={{ background: '#0079d3', color: 'white', border: 'none', padding: '6px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                          Comment
                      </button>
                  </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />
              
              {comments.length > 0 ? (
                  comments.map(c => (
                    <CommentItem 
                        key={c._id} 
                        comment={c} 
                        // <--- IMPORTANT: Passing these props down is what fixes your reply button!
                        postId={post._id}           
                        currentUser={currentUser}   
                    />
                  ))
              ) : (
                  <div style={{ textAlign: 'center', color: '#777', padding: '20px' }}>
                      No comments yet.
                  </div>
              )}
          </div>
       </div>
       
       <div className="right-sidebar">
          <div className="community-card">
              <h3>About r/{post.community}</h3>
              <p>Welcome to the discussion!</p>
          </div>
       </div>
    </div>
  );
};

export default PostDetails;