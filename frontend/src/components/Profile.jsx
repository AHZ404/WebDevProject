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
    
    // Avatar/Banner Upload
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);

    // Tabs & Data
    const [activeTab, setActiveTab] = useState('posts'); // 'posts' or 'comments'
    const [userPosts, setUserPosts] = useState([]); 
    const [userComments, setUserComments] = useState([]); 
    const [postsLoading, setPostsLoading] = useState(false);
    const [adminActions, setAdminActions] = useState([]); // admin audit log

    const isOwner = currentUser && currentUser.toLowerCase() === username.toLowerCase();

    // 1. FETCH PROFILE DATA
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                console.log(`📥 Fetching profile for: ${username}`);
                const response = await fetch(`${API_URL}/users/${username}`);
                const data = await response.json();
                console.log('Profile data received:', data);
                if (!response.ok) throw new Error(data.message);
                setProfileData(data);
                setBioText(data.profile.bio || '');
                console.log('Avatar from DB:', data.profile.avatar);
                console.log('Banner from DB:', data.profile.banner);

                // If profile belongs to an admin, fetch their admin action history
                if (data.role === 'admin') {
                    (async () => {
                        try {
                            const res = await fetch(`${API_URL}/admin/actions/${username}`);
                            const actions = await res.json();
                            if (res.ok) setAdminActions(actions);
                        } catch (err) {
                            console.error('Failed to fetch admin actions:', err);
                        }
                    })();
                }
            } catch (err) {
                console.error('❌ Error fetching profile:', err);
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

    // 3. HANDLE SAVE BIO AND PROFILE IMAGES
    const handleSaveBio = async () => {
        try {
            const formData = new FormData();
            formData.append('bio', bioText);
            if (avatarFile) {
                console.log('📤 Uploading avatar:', avatarFile.name);
                formData.append('avatar', avatarFile);
            }
            if (bannerFile) {
                console.log('📤 Uploading banner:', bannerFile.name);
                formData.append('banner', bannerFile);
            }

            console.log('🔄 Sending PATCH request to:', `${API_URL}/users/${username}`);
            const response = await fetch(`${API_URL}/users/${username}`, {
                method: 'PATCH',
                body: formData
            });
            const data = await response.json();
            console.log('📥 Response data:', data);
            
            if (response.ok) {
                console.log('✅ Profile saved successfully');
                console.log('Avatar path:', data.avatar);
                console.log('Banner path:', data.banner);
                
                setProfileData(prev => ({ 
                    ...prev, 
                    profile: { 
                        ...prev.profile, 
                        bio: data.newBio,
                        avatar: data.avatar || prev.profile.avatar,
                        banner: data.banner || prev.profile.banner
                    } 
                }));
                setIsEditing(false);
                setAvatarFile(null);
                setAvatarPreview(null);
                setBannerFile(null);
                setBannerPreview(null);
            } else {
                console.error('❌ Error response:', data);
                alert('Failed to save profile: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Network error:', error);
            alert("Failed to save profile: " + error.message);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBannerFile(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    if (loading) return <div style={styles.loading}>Loading profile...</div>;
    if (error) return <div style={styles.error}>Error: {error}</div>;

    return (
        <div style={styles.pageContainer}>
            
            {/* --- LEFT COLUMN --- */}
            <div style={styles.mainContent}>
                
                {/* BANNER */}
                {(bannerPreview || profileData.profile.banner) && (
                    <div style={{ 
                        height: '150px', 
                        background: '#f0f0f0', 
                        marginBottom: '10px',
                        borderRadius: '4px',
                        backgroundImage: bannerPreview || (profileData.profile.banner ? `url(${API_URL}/${profileData.profile.banner})` : 'none'),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }} />
                )}
                
                {/* 1. Header Card */}
                <div style={styles.headerCard}>
                    <div style={styles.headerTop}>
                         {/* Avatar Placeholder */}
                         <div style={{...styles.avatar, backgroundImage: avatarPreview || profileData.profile.avatar ? `url(${avatarPreview || (profileData.profile.avatar ? `${API_URL}/${profileData.profile.avatar}` : '')})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', fontSize: avatarPreview || profileData.profile.avatar ? '0' : '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
                            {!avatarPreview && !profileData.profile.avatar && profileData.username[0].toUpperCase()}
                            {isOwner && (
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleAvatarChange} 
                                    style={{ display: 'none' }} 
                                    id="avatar-upload"
                                />
                            )}
                         </div>
                         <div>
                            <h1 style={styles.usernameTitle}>u/{profileData.username}</h1>
                            <div style={styles.cakeDay}>
                                Cake Day: {new Date(profileData.profile.cakeDay).toLocaleDateString()}
                            </div>
                            {isOwner && (
                                <label htmlFor="avatar-upload" style={{ cursor: 'pointer', color: '#0079d3', fontSize: '12px', fontWeight: 'bold', marginTop: '8px', display: 'inline-block' }}>
                                    Change Avatar
                                </label>
                            )}
                         </div>
                    </div>
                    
                    <h3 style={styles.sectionTitle}>About Me</h3>
                    




                    {isEditing ? ( <>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Profile Picture</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleAvatarChange} 
                                    style={{ marginBottom: '10px' }}
                                />
                                {avatarPreview && (
                                    <div>
                                        <img src={avatarPreview} alt="Avatar preview" style={{ maxHeight: '80px', width: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                                        <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} style={{ marginLeft: '10px', color: '#ff4500', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Profile Banner</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleBannerChange} 
                                    style={{ marginBottom: '10px' }}
                                />
                                {bannerPreview && (
                                    <div>
                                        <img src={bannerPreview} alt="Banner preview" style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '4px', objectFit: 'cover' }} />
                                        <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }} style={{ marginLeft: '10px', color: '#ff4500', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                    </div>
                                )}
                            </div>
                            
                            <div style={styles.buttonGroup}>
                                <button onClick={handleSaveBio} style={styles.saveBtn}>Save</button>
                                <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>Cancel</button>
                            </div>
                        </>
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

                {/* --- ADMIN ACTIONS (visible when this profile is an admin) --- */}
                {profileData.role === 'admin' && (
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={styles.sectionTitle}>Admin Action History</h3>
                    {adminActions.length === 0 ? (
                      <div style={{ color: '#666', fontSize: '13px' }}>No admin actions recorded yet.</div>
                    ) : (
                      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                        {adminActions.map(act => (
                          <li key={act._id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                            <div style={{ fontSize: '13px', color: '#333' }}>
                              <strong style={{ textTransform: 'capitalize' }}>{act.actionType}</strong> {act.targetType} — {act.targetSummary}
                            </div>
                            <div style={{ fontSize: '12px', color: '#777' }}>{new Date(act.createdAt).toLocaleString()}</div>
                            {act.details && <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{act.details}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

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
                                <span style={styles.communityName}>
                                  r/{comment.post?.community ? (comment.post.community.startsWith('r/') ? comment.post.community.substring(2) : comment.post.community) : ''}
                                </span>
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