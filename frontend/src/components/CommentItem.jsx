import React, { useState, useEffect } from 'react';
import { API_URL } from './config';
import './CommentItem.css'; // Import the CSS file

const CommentItem = ({ comment, postId, currentUser }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  
  const [votes, setVotes] = useState(comment.votes || 0);
  const [userVote, setUserVote] = useState(0); 

  useEffect(() => {
    if (currentUser) {
        const username = currentUser.username || currentUser;
        const upvoted = (comment.upvotedBy || []).includes(username);
        const downvoted = (comment.downvotedBy || []).includes(username);

        if (upvoted) setUserVote(1);
        else if (downvoted) setUserVote(-1);
        else setUserVote(0);
    } else {
        setUserVote(0);
    }
  }, [currentUser, comment]);

  const handleReplySubmit = async () => {
    if (!currentUser) return alert("Please log in to reply");
    if (!replyContent.trim()) return;

    try {
      const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          postId: postId,
          parentId: comment._id,
          username: currentUser.username || currentUser
        })
      });

      if (res.ok) { window.location.reload(); } 
      else { alert("Failed to send reply"); }
    } catch (err) { console.error(err); }
  };

  const handleVote = async (directionStr) => {
    if (!currentUser) return alert("Log in to vote");

    let newVotes = votes;
    let newUserVote = userVote;

    if (userVote === 0) {
        if (directionStr === 'up') { newVotes += 1; newUserVote = 1; }
        else { newVotes -= 1; newUserVote = -1; }
    } else if (userVote === 1) {
        if (directionStr === 'up') { newVotes -= 1; newUserVote = 0; } 
        else { newVotes -= 2; newUserVote = -1; }
    } else if (userVote === -1) {
        if (directionStr === 'up') { newVotes += 2; newUserVote = 1; } 
        else { newVotes += 1; newUserVote = 0; }
    }

    setVotes(newVotes);
    setUserVote(newUserVote);

    try {
      await fetch(`${API_URL}/comments/${comment._id}/vote`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
             direction: directionStr,
             username: currentUser.username || currentUser 
         })
      });
    } catch (err) { console.error(err); }
  };

  // Determine vote count class
  const getVoteCountClass = () => {
    if (userVote === 1) return 'vote-count up';
    if (userVote === -1) return 'vote-count down';
    return 'vote-count';
  };

  return (
    <div className={`comment-item ${comment.parentComment ? 'nested' : ''}`}>
      
      {/* Header */}
      <div className="comment-header">
        <div className="user-avatar"></div>
        <strong className="author-name">{comment.author?.username || 'u/deleted'}</strong>
        <span className="separator">•</span>
        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Content */}
      <div className="comment-content">
        {comment.content}
      </div>

      {/* Actions Bar */}
      <div className="comment-actions">
        {/* Upvote */}
        <div 
          className={`vote-btn up ${userVote === 1 ? 'active' : ''}`}
          onClick={() => handleVote('up')}
        >
          ⬆
        </div>
        
        {/* Vote Count */}
        <div className={getVoteCountClass()}>
          {votes}
        </div>
        
        {/* Downvote */}
        <div 
          className={`vote-btn down ${userVote === -1 ? 'active' : ''}`} 
          onClick={() => handleVote('down')}
        >
          ⬇
        </div>
        
        {/* Reply Button */}
        <div 
          className="action-btn"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          Reply
        </div>
        
        {/* Delete Button (Conditional) */}
        {currentUser && (currentUser.username || currentUser) === (comment.author?.username) && (
          <div 
            className="action-btn delete"
            onClick={async () => {
              if (!confirm('Delete this comment?')) return;
              try {
                const username = currentUser.username || currentUser;
                const res = await fetch(`${API_URL}/comments/${comment._id}`, { 
                  method: 'DELETE', 
                  headers: { 'Content-Type': 'application/json' }, 
                  body: JSON.stringify({ username }) 
                });
                if (res.ok) window.location.reload(); 
                else { 
                  const data = await res.json(); 
                  alert(data.message || 'Failed to delete'); 
                }
              } catch (err) { 
                console.error(err); 
                alert('Failed to delete'); 
              }
            }}
          >
            Delete
          </div>
        )}
      </div>

      {/* Reply Form */}
      {showReplyForm && (
         <div className="reply-form-container">
            <textarea 
              className="reply-textarea"
              value={replyContent} 
              onChange={(e) => setReplyContent(e.target.value)} 
              placeholder="What are your thoughts?" 
            />
            <button 
              className="reply-submit-btn"
              onClick={handleReplySubmit} 
            >
              Reply
            </button>
         </div>
      )}

      {/* Nested Children */}
      {comment.children && comment.children.length > 0 && (
        <div className="comment-children">
          {comment.children.map(childReply => (
            <CommentItem 
              key={childReply._id} 
              comment={childReply} 
              postId={postId} 
              currentUser={currentUser} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;