import React, { useState, useEffect } from 'react';
import { API_URL } from './config';

const CommentItem = ({ comment, postId, currentUser }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  
  const [votes, setVotes] = useState(comment.votes || 0);
  const [userVote, setUserVote] = useState(0); 

  const nestedStyle = {
    marginLeft: '20px',
    borderLeft: '2px solid #edeff1', 
    paddingLeft: '10px',
    marginTop: '10px'
  };

  // <--- UPDATED: Reset votes instantly on logout
  useEffect(() => {
    if (currentUser) {
        // If logged in, check if we voted
        const username = currentUser.username || currentUser;
        const upvoted = (comment.upvotedBy || []).includes(username);
        const downvoted = (comment.downvotedBy || []).includes(username);

        if (upvoted) setUserVote(1);
        else if (downvoted) setUserVote(-1);
        else setUserVote(0);
    } else {
        // <--- THIS FIXES THE BUG: If logged out, reset to grey immediately
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

  const getVoteColor = (dir) => userVote === dir ? (dir === 1 ? '#ff4500' : '#7193ff') : 'inherit';

  return (
    <div style={comment.parentComment ? nestedStyle : { marginTop: '15px' }}>
      <div style={{ fontSize: '12px', color: '#555', marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ccc', marginRight: '8px' }}></div>
        <strong>{comment.author?.username || 'u/deleted'}</strong>
        <span style={{ margin: '0 5px' }}>•</span>
        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
      </div>

      <div style={{ fontSize: '14px', marginBottom: '8px', lineHeight: '1.5' }}>
        {comment.content}
      </div>

      <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#878a8c', fontWeight: 'bold', alignItems: 'center' }}>
        <div style={{ cursor: 'pointer', color: getVoteColor(1) }} onClick={() => handleVote('up')}>⬆</div>
        <div style={{ color: userVote !== 0 ? (userVote === 1 ? '#ff4500' : '#7193ff') : 'inherit' }}>{votes}</div>
        <div style={{ cursor: 'pointer', color: getVoteColor(-1) }} onClick={() => handleVote('down')}>⬇</div>
        <div style={{ cursor: 'pointer', marginLeft: '10px' }} onClick={() => setShowReplyForm(!showReplyForm)}>Reply</div>
      </div>

      {showReplyForm && (
         <div style={{ marginTop: '10px' }}>
            <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="What are your thoughts?" style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }} />
            <button onClick={handleReplySubmit} style={{ marginTop: '5px', padding: '4px 12px', background: '#0079d3', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer' }}>Reply</button>
         </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className="comment-children">
          {comment.children.map(childReply => (
            <CommentItem key={childReply._id} comment={childReply} postId={postId} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;