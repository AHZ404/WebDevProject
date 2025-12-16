import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Post from './Post'; 
import { API_URL } from './config';

const Profile = ({ currentUser }) => {
    const { username } = useParams();

    // --- STATE ---
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Bio Editing
    const [isEditing, setIsEditing] = useState(false);
    const [bioText, setBioText] = useState(''); 

    // Tabs & Data
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'comments'
    const [userPosts, setUserPosts] = useState([]); 
    const [userComments, setUserComments] = useState([]); 
    const [postsLoading, setPostsLoading] = useState(false);

    const isOwner = currentUser && currentUser.toLowerCase() === username.toLowerCase();

    // 1. FETCH PROFILE DATA
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/users/${username}`);
                const data = await response.json();
                if (!response.ok) throw new Error(data.message);
                setProfileData(data);
                setBioText(data.profile.bio || ''); 
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]); 

    // 2. FETCH POSTS OR COMMENTS (Based on activeTab)
    useEffect(() => {
        const fetchData = async () => {
            setPostsLoading(true);
            try {
                if (activeTab === 'posts') {
                    const response = await fetch(`${API_URL}/users/${username}/posts`);
                    const data = await response.json();
                    if (response.ok) setUserPosts(data);
                } else {
                    const response = await fetch(`${API_URL}/comments/user/${username}`);
                    const data = await response.json();
                    if (response.ok) setUserComments(data);
                }
            } catch (err) {
                console.error('Fetch Error:', err);
            } finally {
                setPostsLoading(false);
            }
        };

        if (username) fetchData();
    }, [username, activeTab]); 

    // 3. HANDLE SAVE BIO
    const handleSaveBio = async () => {
        try {
            const response = await fetch(`${API_URL}/users/${username}`, {
                method: 'PATCH', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bio: bioText }), 
            });
            const data = await response.json();
            if (response.ok) {
                setProfileData(prev => ({ ...prev, profile: { ...prev.profile, bio: data.newBio } }));
                setIsEditing(false);
            }
        } catch (error) {
            alert("Failed to save bio");
        }
    };

    if (loading) return <div style={styles.loading}>Loading profile...</div>;
    if (error) return <div style={styles.error}>Error: {error}</div>;

    return (
        <div style={styles.pageContainer}>
            
            {/* --- LEFT COLUMN --- */}
            <div style={styles.mainContent}>
                
                {/* 1. Header Card */}
                <div style={styles.headerCard}>
                    <div style={styles.headerTop}>
                         {/* Avatar Placeholder */}
                         <div style={styles.avatar}>
                            {profileData.username[0].toUpperCase()}
                         </div>
                         <div>
                            <h1 style={styles.usernameTitle}>u/{profileData.username}</h1>
                            <div style={styles.cakeDay}>
                                Cake Day: {new Date(profileData.profile.cakeDay).toLocaleDateString()}
                            </div>
                         </div>
                    </div>
                    
                    <h3 style={styles.sectionTitle}>About Me</h3>
                    
                    {isEditing ? (
                        <div style={styles.bioEditContainer}>
                            <textarea 
                                value={bioText} 
                                onChange={(e) => setBioText(e.target.value)}
                                style={{...styles.textarea, whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}
                            />
                            <div style={styles.buttonGroup}>
                                <button onClick={handleSaveBio} style={styles.saveBtn}>Save</button>
                                <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p style={{...styles.bioText, whiteSpace: 'pre-wrap', wordWrap: 'break-word'}}>{profileData.profile.bio || "No bio yet."}</p>
                            {isOwner && (
                                <button onClick={() => setIsEditing(true)} style={styles.editBtn}>
                                    Edit Bio
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 2. TAB NAVIGATION */}
                <div style={styles.tabsContainer}>
                    <button 
                        style={{...styles.tabBtn, ...(activeTab === 'posts' ? styles.tabBtnActive : {})}}
                        onClick={() => setActiveTab('posts')}
                    >
                        POSTS
                    </button>
                    <button 
                        style={{...styles.tabBtn, ...(activeTab === 'comments' ? styles.tabBtnActive : {})}}
                        onClick={() => setActiveTab('comments')}
                    >
                        COMMENTS
                    </button>
                </div>

                {/* 3. CONTENT AREA */}
                <div>
                    {postsLoading ? (
                        <div style={styles.loading}>Loading content...</div>
                    ) : activeTab === 'posts' ? (
                        // --- POSTS LIST ---
                        userPosts.length === 0 ? <div style={styles.emptyState}>No posts yet.</div> : 
                        userPosts.map(post => (
                            <Post 
                                key={post._id} 
                                post={{
                                    id: post._id,
                                    community: post.community,
                                    user: `u/${post.username}`,
                                    time: post.createdAt,
                                    title: post.title,
                                    content: post.content,
                                    votes: post.votes,
                                    comments: post.commentsCount,
                                    mediaUrl: post.mediaUrl,
                                    upvotedBy: post.upvotedBy || [],
                                    downvotedBy: post.downvotedBy || []
                                }}
                                onVote={() => {}} 
                                currentUser={currentUser}
                            />
                        ))
                    ) : (
                        // --- COMMENTS LIST (NEW DESIGN) ---
                        userComments.length === 0 ? <div style={styles.emptyState}>No comments yet.</div> :
                        userComments.map(comment => (
                          <div key={comment._id} style={styles.commentCard}>
                            <div style={styles.commentHeader}>
                              <span style={styles.commentMeta}>
                                <span style={styles.authorName}>{comment.author.username}</span> commented on 
                                
                                {comment.post ? (
                                  <Link 
                                    to={`/r/${comment.post.community}/comments/${comment.post._id}`} 
                                    style={styles.postLink}
                                  >
                                     {comment.post.title}
                                  </Link>
                                ) : (
                                  <span style={styles.postLink}>Deleted Post</span>
                                )}
                                
                                <span style={styles.metaDivider}>•</span>
                                <span style={styles.communityName}>r/{comment.post?.community}</span>
                                <span style={styles.metaDivider}>•</span>
                                <span style={styles.timestamp}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                              </span>
                            </div>

                            <div style={styles.commentBody}>
                              <p style={{margin: 0}}>{comment.content}</p>
                            </div>
                            
                            <div style={styles.commentFooter}>
                               <span style={styles.voteLabel}>⬆ {comment.votes || 1} points</span>
                            </div>
                          </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- RIGHT COLUMN --- */}
            <div style={styles.sidebar}>
                <div style={styles.karmaCard}>
                    <h3 style={styles.karmaTitle}>Karma</h3>
                    <div style={styles.karmaContent}>
                        <div style={styles.karmaRow}>
                            <span>Post Karma</span>
                            <strong>{profileData.karma.postKarma}</strong>
                        </div>
                        <div style={styles.karmaRow}>
                            <span>Comment Karma</span>
                            <strong>{profileData.karma.commentKarma}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- INLINE STYLES OBJECT ---
const styles = {
    pageContainer: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: '#dae0e6',
        display: 'grid',
        gridTemplateColumns: '1fr 312px',
        gap: '24px',
        alignItems: 'start',
    },
    mainContent: {
        minWidth: 0, // Prevents grid blowout
    },
    sidebar: {
        display: 'block', // Hidden on mobile via media query logic if you used CSS, here it stays block
    },
    // Header Card
    headerCard: {
        background: 'white',
        padding: '20px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        marginBottom: '20px',
    },
    headerTop: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
    },
    avatar: {
        width: '80px',
        height: '80px',
        background: '#ff4500',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '30px',
        fontWeight: 'bold',
        border: '4px solid white',
    },
    usernameTitle: {
        marginBottom: '5px',
        fontSize: '22px',
        color: '#1c1c1c',
    },
    cakeDay: {
        fontSize: '14px',
        color: '#787c7e',
    },
    sectionTitle: {
        marginTop: '20px',
        marginBottom: '10px',
        fontSize: '14px',
        textTransform: 'uppercase',
        color: '#7c7c7c',
        fontWeight: '700',
    },
    bioText: {
        marginBottom: '10px',
        lineHeight: '1.5',
        fontSize: '14px',
        color: '#1c1c1c',
    },
    // Buttons
    editBtn: {
        color: '#0079d3',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        padding: 0,
        fontSize: '14px',
    },
    bioEditContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    textarea: {
        width: '100%',
        minHeight: '100px',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #edeff1',
        fontFamily: 'inherit',
        resize: 'vertical',
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px',
    },
    saveBtn: {
        background: '#0079d3',
        color: 'white',
        border: 'none',
        padding: '6px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    cancelBtn: {
        background: '#edeff1',
        color: '#1c1c1c',
        border: 'none',
        padding: '6px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
    },
    // Tabs
    tabsContainer: {
        display: 'flex',
        backgroundColor: 'white',
        borderRadius: '4px 4px 0 0',
        border: '1px solid #ccc',
        borderBottom: '1px solid #ccc',
        overflow: 'hidden',
        marginBottom: '15px',
    },
    tabBtn: {
        flex: 1,
        padding: '12px 0',
        background: 'none',
        border: 'none',
        fontWeight: 'bold',
        cursor: 'pointer',
        color: '#878a8c',
        fontSize: '14px',
        borderBottom: '3px solid transparent',
        transition: 'all 0.2s',
    },
    tabBtnActive: {
        color: '#0079d3',
        borderBottom: '3px solid #0079d3',
        backgroundColor: 'rgba(0, 121, 211, 0.05)',
    },
    // Comment Card Styles
    commentCard: {
        background: 'white',
        border: '1px solid #cccccc',
        borderRadius: '4px',
        marginBottom: '12px',
        padding: '12px',
        cursor: 'default',
    },
    commentHeader: {
        fontSize: '12px',
        color: '#787c7e',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    authorName: {
        color: '#1c1c1c',
        fontWeight: 'bold',
        marginRight: '4px',
    },
    postLink: {
        color: '#0079d3',
        fontWeight: '600',
        textDecoration: 'none',
        margin: '0 4px',
    },
    communityName: {
        color: '#1c1c1c',
        fontWeight: 'bold',
        margin: '0 4px',
    },
    metaDivider: {
        margin: '0 2px',
        color: '#878a8c',
    },
    timestamp: {
        marginLeft: '4px',
    },
    commentBody: {
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#1c1c1c',
        padding: '10px 12px',
        backgroundColor: '#f6f7f8',
        borderRadius: '4px',
        marginTop: '6px',
    },
    commentFooter: {
        marginTop: '8px',
        fontSize: '12px',
        color: '#878a8c',
        fontWeight: 'bold',
    },
    voteLabel: {
        color: '#ff4500',
    },
    // Right Sidebar Karma
    karmaCard: {
        background: 'white',
        padding: '20px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },
    karmaTitle: {
        fontSize: '14px',
        textTransform: 'uppercase',
        color: '#787c7e',
        letterSpacing: '0.5px',
        marginBottom: '12px',
        marginTop: 0,
    },
    karmaContent: {
        fontSize: '14px',
    },
    karmaRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        color: '#1c1c1c',
    },
    // Utility
    loading: {
        textAlign: 'center',
        padding: '40px',
        color: '#787c7e',
    },
    error: {
        textAlign: 'center',
        padding: '40px',
        color: 'red',
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        color: '#787c7e',
    }
};

export default Profile;