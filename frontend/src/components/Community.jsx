import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Post from './Post';
import { API_URL } from './config';
import EditCommunityModal from './EditCommunityModal';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';

const Community = ({ currentUser, onCreatePostClick, communities = [], refreshPosts }) => {
  const { communityName } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subreddit, setSubreddit] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [sortBy, setSortBy] = useState('best');

  // Helper function to clean community name (remove r/ if present)
  const cleanCommunityName = (name) => {
    if (!name) return '';
    return name.startsWith('r/') ? name.substring(2) : name;
  };

  // Helper function to display community name with r/ prefix
  const displayCommunityName = (name) => {
    const clean = cleanCommunityName(name);
    return `r/${clean}`;
  };

  // Check if current user is the creator
  const isCreator = () => {
    if (!currentUser || !subreddit || !subreddit.creator) return false;
    const currentUsername = currentUser.username || currentUser;
    const creatorUsername = subreddit.creator.username || (typeof subreddit.creator === 'string' ? subreddit.creator : null);
    return currentUsername === creatorUsername || 
           (currentUser._id && subreddit.creator._id && currentUser._id.toString() === subreddit.creator._id.toString());
  };

  // Handle community update
  const handleCommunityUpdate = (updatedSubreddit) => {
    setSubreddit(updatedSubreddit);
    setShowEditModal(false);
  };

  // Handle join/leave community
  const handleJoin = async () => {
    if (!currentUser) {
      alert('Please log in to join communities');
      return;
    }
    // TODO: Implement join/leave API call
    setIsJoined(!isJoined);
  };

  // Fetch posts specifically for this community
  useEffect(() => {
    const fetchCommunityPosts = async () => {
      setLoading(true);
      try {
        const cleanName = cleanCommunityName(communityName);
        const url = `${API_URL}/posts?community=${encodeURIComponent(cleanName)}&sortBy=${sortBy}`;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eb9f592d-6c6e-42f5-ac3f-390714336380',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Community.jsx:61',message:'Fetching community posts - request params',data:{communityName,cleanName,sortBy,url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        const response = await fetch(url);
        const data = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/eb9f592d-6c6e-42f5-ac3f-390714336380',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Community.jsx:65',message:'Received posts response',data:{responseOk:response.ok,dataIsArray:Array.isArray(data),postCount:Array.isArray(data)?data.length:0,firstPostCommunity:Array.isArray(data)&&data[0]?data[0].community:null,firstPostDate:Array.isArray(data)&&data[0]?data[0].createdAt:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        if (response.ok && Array.isArray(data)) {
          const savedUserStr = localStorage.getItem("user");
          let currentUsername = null;
          if (savedUserStr) {
            try {
              const parsed = JSON.parse(savedUserStr);
              currentUsername = parsed.username || parsed; 
            } catch(e) { currentUsername = savedUserStr; }
          }

          const mappedPosts = data.map(post => {
            const upList = post.upvotedBy || [];
            const downList = post.downvotedBy || [];
            const upvoted = upList.includes(currentUsername);
            const downvoted = downList.includes(currentUsername);
            let status = 0;
            if (upvoted) status = 1;
            if (downvoted) status = -1;

            return {
              id: post._id,
              community: post.community,
              username: post.username,
              user: `u/${post.username}`,
              time: post.createdAt, 
              title: post.title,
              content: post.content,
              votes: post.votes,
              comments: post.commentsCount,
              image: post.image,
              mediaUrl: post.mediaUrl,
              userVote: status,
              upvotedBy: upList,
              downvotedBy: downList
            };
          });
          setPosts(mappedPosts);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("Failed to load community posts", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityPosts();

    // Fetch subreddit metadata
    const fetchSubreddit = async () => {
      try {
        const cleanName = cleanCommunityName(communityName);
        const res = await fetch(`${API_URL}/subreddits/${encodeURIComponent(cleanName)}`);
        if (res.ok) {
          const data = await res.json();
          setSubreddit(data);
        } else {
          setSubreddit(null);
        }
      } catch (err) {
        console.error('Failed to load subreddit metadata', err);
        setSubreddit(null);
      }
    };

    fetchSubreddit();
  }, [communityName, sortBy]);

  const handleVote = async (postId, direction) => {
    if (!currentUser) return alert("You must be logged in to vote!");

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    let newVoteCount = post.votes;
    let newUserVote = 0; 
    if (post.userVote === 0) {
        if (direction === 'up') { newVoteCount += 1; newUserVote = 1; } 
        else { newVoteCount -= 1; newUserVote = -1; }
    } else if (post.userVote === 1) {
        if (direction === 'up') { newVoteCount -= 1; newUserVote = 0; } 
        else { newVoteCount -= 2; newUserVote = -1; }
    } else if (post.userVote === -1) {
        if (direction === 'up') { newVoteCount += 2; newUserVote = 1; } 
        else { newVoteCount += 1; newUserVote = 0; }
    }

    const updatedPosts = posts.map(p => p.id === postId ? { ...p, votes: newVoteCount, userVote: newUserVote } : p);
    setPosts(updatedPosts);

    try {
        await fetch(`${API_URL}/posts/${postId}/vote`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                direction, 
                username: currentUser.username || currentUser 
            })
        });
    } catch (error) { console.error("Vote error:", error); }
  };

  const cleanName = cleanCommunityName(communityName);
  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  return (
    <div className="community-page" style={{ background: '#030303', minHeight: '100vh' }}>
      {/* BANNER SECTION */}
      <div className="community-banner" style={{
        height: '200px',
        background: subreddit && subreddit.banner ? `url(${getMediaUrl(subreddit.banner)}) center/cover no-repeat` : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 50%, #f5576c 100%)',
        position: 'relative',
        marginBottom: '0'
      }}>
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '24px',
          color: '#ffffff',
          zIndex: 2
        }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 700, 
            margin: '0 0 8px 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            {subreddit && subreddit.title ? subreddit.title.toUpperCase() : cleanName.toUpperCase()}
          </h2>
          <p style={{ 
            fontSize: '16px', 
            margin: '0 0 16px 0',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}>
            {subreddit && subreddit.tagline ? subreddit.tagline : 'Where History and Culture Meet'}
          </p>
          <button 
            onClick={handleJoin}
            style={{
              padding: '10px 24px',
              borderRadius: '20px',
              border: 'none',
              fontWeight: 700,
              color: '#ffffff',
              backgroundColor: '#0079d3',
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            JOIN US NOW!
          </button>
        </div>
      </div>

      {/* COMMUNITY HEADER BAR */}
      <div className="community-header-bar" style={{ 
        background: '#1a1a1b', 
        borderBottom: '1px solid #343536',
        padding: '16px 24px'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Circular Logo */}
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              border: '3px solid #ffffff', 
              backgroundColor: '#0079d3', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {subreddit && subreddit.logo ? (
                <img 
                  src={getMediaUrl(subreddit.logo)} 
                  alt={cleanName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <div style={{ fontSize: '32px', color: 'white', fontWeight: 'bold' }}>r/</div>
              )}
            </div>

            {/* Community Name */}
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 700, 
                margin: 0,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {displayCommunityName(subreddit ? subreddit.name : communityName)}
                <span style={{ fontSize: '16px', color: '#818384' }}>⭐</span>
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={onCreatePostClick}
              style={{ 
                padding: '8px 20px', 
                borderRadius: '20px', 
                border: 'none', 
                fontWeight: 700,
                color: '#ffffff', 
                backgroundColor: '#ff4500', 
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>+</span>
              <span>Create Post</span>
            </button>
            <button 
              style={{ 
                padding: '8px', 
                borderRadius: '50%', 
                border: 'none', 
                background: 'transparent',
                color: '#d7dadc',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px'
              }}
            >
              🔔
            </button>
            <button 
              onClick={handleJoin}
              style={{ 
                padding: '8px 20px', 
                borderRadius: '20px', 
                border: isJoined ? '1px solid #343536' : '1px solid #0079d3', 
                fontWeight: 700,
                color: isJoined ? '#d7dadc' : '#ffffff', 
                backgroundColor: isJoined ? 'transparent' : '#0079d3', 
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {isJoined ? 'Joined' : 'Join'}
            </button>
            <button 
              style={{ 
                padding: '8px', 
                borderRadius: '50%', 
                border: 'none', 
                background: 'transparent',
                color: '#d7dadc',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px'
              }}
            >
              ⋯
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="main-container" style={{ background: '#030303' }}>
        <Sidebar 
          onCreatePost={refreshPosts} 
          currentUser={currentUser} 
          communities={communities}
          onCreatePostClick={onCreatePostClick}
          currentCommunity={cleanName}
        />
        
        <div className="posts-container">
          {/* Content Filtering */}
          <div className="posts-header" style={{ marginBottom: '16px' }}>
            <select 
              className="sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="best">Best</option>
              <option value="hot">Hot</option>
              <option value="new">New</option>
              <option value="top">Top</option>
            </select>
            <button className="view-toggle" title="Change view">
              <span>⊞</span>
            </button>
          </div>

          {/* Posts */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#d7dadc' }}>
              Loading {displayCommunityName(communityName)}...
            </div>
          ) : posts.length > 0 ? (
            posts.map(post => (
              <Post 
                key={post.id} 
                post={post} 
                currentUser={currentUser}
                onVote={handleVote}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#d7dadc' }}>
              <h3>There are no posts in {displayCommunityName(communityName)} yet.</h3>
              <p>Be the first to post!</p>
            </div>
          )}
        </div>

        {/* Right Sidebar - Community Info */}
        <div className="right-sidebar">
          <div className="top-communities" style={{ marginBottom: '16px' }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              color: '#d7dadc',
              margin: 0,
              padding: '16px',
              borderBottom: '1px solid #343536'
            }}>
              {subreddit ? subreddit.name : cleanName}
            </h3>
            <div style={{ padding: '16px' }}>
              <p style={{ 
                fontSize: '14px', 
                lineHeight: '1.6', 
                color: '#d7dadc',
                margin: '0 0 16px 0'
              }}>
                {subreddit && subreddit.description 
                  ? subreddit.description 
                  : `Welcome to ${displayCommunityName(communityName)}!`}
              </p>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '12px',
                fontSize: '14px',
                color: '#818384'
              }}>
                <span>📅</span>
                <span>Created {subreddit && subreddit.createdAt 
                  ? new Date(subreddit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Recently'}</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                color: '#818384'
              }}>
                <span>🌐</span>
                <span>Public</span>
              </div>
              
              <button style={{
                width: '100%',
                padding: '10px',
                borderRadius: '20px',
                border: '1px solid #343536',
                background: '#272729',
                color: '#d7dadc',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#343536'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#272729'}
              >
                <span>📄</span>
                <span>Community Guide</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Community Modal */}
      <EditCommunityModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        subreddit={subreddit}
        currentUser={currentUser}
        onUpdate={handleCommunityUpdate}
      />
    </div>
  );
};

export default Community;
