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

    // Follow Feature State
    const [isFollowing, setIsFollowing] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);

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

    const isOwner = currentUser && currentUser.username && username &&
        currentUser.username.toLowerCase() === username.toLowerCase();

    // 1. FETCH PROFILE DATA
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                console.log(`📥 Fetching profile for: ${username}`);

                const viewerParam = currentUser?.username ? `?viewer=${encodeURIComponent(currentUser.username)}` : '';
                const response = await fetch(`${API_URL}/users/${username}${viewerParam}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch profile');
                }

                const data = await response.json();
                console.log('Profile data received:', data);

                if (!data) {
                    throw new Error('No profile data received');
                }

                const profileWithDefaults = {
                    ...data,
                    profile: data.profile || {
                        bio: '',
                        cakeDay: new Date().toISOString(),
                        avatar: '',
                        banner: ''
                    }
                };

                setProfileData(profileWithDefaults);
                setBioText(profileWithDefaults.profile.bio || '');

                // Follow feature data (non-breaking)
                setFollowerCount(typeof profileWithDefaults.followerCount === 'number' ? profileWithDefaults.followerCount : 0);
                setIsFollowing(!!profileWithDefaults.isFollowedByViewer);

                // If profile belongs to an admin, fetch their admin action history
                if (profileWithDefaults.role === 'admin') {
                    try {
                        const res = await fetch(`${API_URL}/admin/actions/${username}`);
                        if (res.ok) {
                            const actions = await res.json();
                            setAdminActions(actions);
                        }
                    } catch (err) {
                        console.error('Failed to fetch admin actions:', err);
                    }
                }
            } catch (err) {
                console.error('❌ Error fetching profile:', err);
                setError(err.message || 'An error occurred while loading the profile');
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchProfile();
        }
    }, [username, currentUser?.username]);

    // 2. FETCH POSTS OR COMMENTS (Based on activeTab)
    useEffect(() => {
        const fetchData = async () => {
            setPostsLoading(true);
            try {
                if (activeTab === 'posts') {
                    const response = await fetch(`${API_URL}/users/${username}/posts`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserPosts(data || []);
                    }
                } else {
                    const response = await fetch(`${API_URL}/comments/user/${username}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserComments(data || []);
                    }
                }
            } catch (err) {
                console.error('Fetch Error:', err);
                if (activeTab === 'posts') {
                    setUserPosts([]);
                } else {
                    setUserComments([]);
                }
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

                setProfileData(prev => {
                    if (!prev) return prev;

                    return {
                        ...prev,
                        profile: {
                            ...prev.profile,
                            bio: data.newBio || bioText,
                            avatar: data.avatar || prev.profile.avatar,
                            banner: data.banner || prev.profile.banner
                        }
                    };
                });

                setIsEditing(false);
                setAvatarFile(null);
                setAvatarPreview(null);
                setBannerFile(null);
                setBannerPreview(null);

                alert('Profile updated successfully!');
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

    // FOLLOW / UNFOLLOW HANDLERS
    const handleToggleFollow = async () => {
        if (!currentUser?.username) {
            alert('You must be logged in to follow users.');
            return;
        }
        if (isOwner) return;

        setFollowLoading(true);
        try {
            const endpoint = isFollowing ? 'unfollow' : 'follow';
            const res = await fetch(`${API_URL}/users/${username}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentUsername: currentUser.username })
            });

            const data = await res.json();

            if (!res.ok) {
                alert(data.message || 'Failed to update follow status');
                return;
            }

            // Update UI from server truth (prevents drift)
            setIsFollowing(!!data.following);
            if (typeof data.followerCount === 'number') setFollowerCount(data.followerCount);
        } catch (err) {
            console.error('❌ Follow toggle error:', err);
            alert('Failed to update follow status.');
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) return <div style={styles.loading}>Loading profile...</div>;
    if (error) return <div style={styles.error}>Error: {error}</div>;

    if (!profileData) return <div style={styles.error}>Profile not found</div>;

    return (
        <div style={styles.pageContainer}>

            {/* --- LEFT COLUMN --- */}
            <div style={styles.mainContent}>

                {/* BANNER */}
                {(bannerPreview || profileData.profile.banner) && (
                    <div style={{
                        height: '150px',
                        background: '#1a1a1b',
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
                        <div style={{
                            ...styles.avatar,
                            backgroundImage: avatarPreview || profileData.profile.avatar ? `url(${avatarPreview || (profileData.profile.avatar ? `${API_URL}/${profileData.profile.avatar}` : '')})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            fontSize: avatarPreview || profileData.profile.avatar ? '0' : '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}>
                            {!avatarPreview && !profileData.profile.avatar && profileData.username && profileData.username[0].toUpperCase()}
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

                        <div style={{ flex: 1 }}>
                            <h1 style={styles.usernameTitle}>u/{profileData.username}</h1>
                            <div style={styles.cakeDay}>
                                Cake Day: {new Date(profileData.profile.cakeDay || new Date()).toLocaleDateString()}
                            </div>

                            {/* Followers Count */}
                            <div style={{ marginTop: '6px', color: '#d7dadc', fontSize: '13px' }}>
                                Followers: <strong style={{ color: '#ffffff' }}>{followerCount}</strong>
                            </div>

                            {isOwner && (
                                <label htmlFor="avatar-upload" style={{ cursor: 'pointer', color: '#4fbcff', fontSize: '12px', fontWeight: 'bold', marginTop: '8px', display: 'inline-block' }}>
                                    Change Avatar
                                </label>
                            )}
                        </div>

                        {/* Follow Button (only if not owner) */}
                        {!isOwner && (
                            <button
                                onClick={handleToggleFollow}
                                disabled={followLoading}
                                style={{
                                    ...styles.followBtn,
                                    ...(isFollowing ? styles.followingBtn : {})
                                }}
                            >
                                {followLoading ? '...' : (isFollowing ? 'Following' : 'Follow')}
                            </button>
                        )}
                    </div>

                    <h3 style={styles.sectionTitle}>About Me</h3>

                    {isEditing ? (<>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#d7dadc' }}>Profile Picture</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{
                                    marginBottom: '10px',
                                    color: '#d7dadc',
                                    backgroundColor: '#1a1a1b',
                                    border: '1px solid #343536',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    width: '100%'
                                }}
                            />
                            {avatarPreview && (
                                <div>
                                    <img src={avatarPreview} alt="Avatar preview" style={{ maxHeight: '80px', width: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #343536' }} />
                                    <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} style={{ marginLeft: '10px', color: '#ff4500', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#d7dadc' }}>Profile Banner</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleBannerChange}
                                style={{
                                    marginBottom: '10px',
                                    color: '#d7dadc',
                                    backgroundColor: '#1a1a1b',
                                    border: '1px solid #343536',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    width: '100%'
                                }}
                            />
                            {bannerPreview && (
                                <div>
                                    <img src={bannerPreview} alt="Banner preview" style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '4px', objectFit: 'cover', border: '1px solid #343536' }} />
                                    <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }} style={{ marginLeft: '10px', color: '#ff4500', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#d7dadc' }}>Bio</label>
                            <textarea
                                value={bioText}
                                onChange={(e) => setBioText(e.target.value)}
                                placeholder="Tell us about yourself..."
                                style={styles.textarea}
                            />
                        </div>

                        <div style={styles.buttonGroup}>
                            <button onClick={handleSaveBio} style={styles.saveBtn}>Save</button>
                            <button onClick={() => setIsEditing(false)} style={styles.cancelBtn}>Cancel</button>
                        </div>
                    </>) : (
                        <div>
                            <p style={{ ...styles.bioText, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                                {profileData.profile.bio || "No bio yet."}
                            </p>
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
                            <div style={{ color: '#818384', fontSize: '13px' }}>No admin actions recorded yet.</div>
                        ) : (
                            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                                {adminActions.map(act => (
                                    <li key={act._id} style={{ padding: '8px 0', borderBottom: '1px solid #343536' }}>
                                        <div style={{ fontSize: '13px', color: '#d7dadc' }}>
                                            <strong style={{ textTransform: 'capitalize' }}>{act.actionType}</strong> {act.targetType} — {act.targetSummary}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#818384' }}>{new Date(act.createdAt).toLocaleString()}</div>
                                        {act.details && <div style={{ fontSize: '12px', color: '#b0b3b4', marginTop: '4px' }}>{act.details}</div>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* 2. TAB NAVIGATION */}
                <div style={styles.tabsContainer}>
                    <button
                        style={{ ...styles.tabBtn, ...(activeTab === 'posts' ? styles.tabBtnActive : {}) }}
                        onClick={() => setActiveTab('posts')}
                    >
                        POSTS
                    </button>
                    <button
                        style={{ ...styles.tabBtn, ...(activeTab === 'comments' ? styles.tabBtnActive : {}) }}
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
                                    onVote={() => { }}
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
                                            <span style={styles.authorName}>{comment.author?.username || 'Unknown'}</span> commented on

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
                                            <span style={styles.timestamp}>
                                                {new Date(comment.createdAt || Date.now()).toLocaleDateString()}
                                            </span>
                                        </span>
                                    </div>

                                    <div style={styles.commentBody}>
                                        <p style={{ margin: 0, color: '#d7dadc' }}>{comment.content || 'No content'}</p>
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
                            <span style={styles.karmaLabel}>Post Karma</span>
                            <strong style={styles.karmaValue}>{profileData.karma?.postKarma || 0}</strong>
                        </div>
                        <div style={styles.karmaRow}>
                            <span style={styles.karmaLabel}>Comment Karma</span>
                            <strong style={styles.karmaValue}>{profileData.karma?.commentKarma || 0}</strong>
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
        backgroundColor: '#030303',
        display: 'grid',
        gridTemplateColumns: '1fr 312px',
        gap: '24px',
        alignItems: 'start',
        minHeight: '100vh'
    },
    mainContent: {
        minWidth: 0,
    },
    sidebar: {
        display: 'block',
    },
    // Header Card
    headerCard: {
        background: '#1a1a1b',
        padding: '20px',
        borderRadius: '4px',
        border: '1px solid #343536',
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
        background: 'linear-gradient(135deg, #ff4500, #ff6314)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '30px',
        fontWeight: 'bold',
        border: '4px solid #1a1a1b',
    },
    usernameTitle: {
        marginBottom: '5px',
        fontSize: '22px',
        color: '#ffffff',
    },
    cakeDay: {
        fontSize: '14px',
        color: '#818384',
    },
    sectionTitle: {
        marginTop: '20px',
        marginBottom: '10px',
        fontSize: '14px',
        textTransform: 'uppercase',
        color: '#818384',
        fontWeight: '700',
    },
    bioText: {
        marginBottom: '10px',
        lineHeight: '1.5',
        fontSize: '14px',
        color: '#d7dadc',
    },
    // Buttons
    editBtn: {
        color: '#4fbcff',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 'bold',
        padding: 0,
        fontSize: '14px',
        '&:hover': {
            textDecoration: 'underline'
        }
    },
    textarea: {
        width: '100%',
        minHeight: '100px',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #343536',
        fontFamily: 'inherit',
        resize: 'vertical',
        fontSize: '14px',
        backgroundColor: '#1a1a1b',
        color: '#d7dadc',
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px',
    },
    saveBtn: {
        background: '#0079d3',
        color: 'white',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        transition: 'background-color 0.2s',
        '&:hover': {
            backgroundColor: '#0060a9',
        }
    },
    cancelBtn: {
        background: '#272729',
        color: '#d7dadc',
        border: '1px solid #343536',
        padding: '8px 20px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        transition: 'background-color 0.2s',
        '&:hover': {
            backgroundColor: '#343536',
        }
    },

    // ✅ Follow button styles (added)
    followBtn: {
        background: '#ff4500',
        color: 'white',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '14px',
        minWidth: '110px'
    },
    followingBtn: {
        background: '#272729',
        border: '1px solid #343536',
        color: '#d7dadc'
    },

    tabsContainer: {
        display: 'flex',
        backgroundColor: '#1a1a1b',
        borderRadius: '4px 4px 0 0',
        border: '1px solid #343536',
        borderBottom: '1px solid #343536',
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
        color: '#818384',
        fontSize: '14px',
        borderBottom: '3px solid transparent',
        transition: 'all 0.2s',
    },
    tabBtnActive: {
        color: '#ffffff',
        borderBottom: '3px solid #0079d3',
        backgroundColor: '#272729',
    },
    // Comment Card Styles
    commentCard: {
        background: '#1a1a1b',
        border: '1px solid #343536',
        borderRadius: '4px',
        marginBottom: '12px',
        padding: '12px',
        cursor: 'default',
    },
    commentHeader: {
        fontSize: '12px',
        color: '#818384',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    authorName: {
        color: '#ffffff',
        fontWeight: 'bold',
        marginRight: '4px',
    },
    postLink: {
        color: '#4fbcff',
        fontWeight: '600',
        textDecoration: 'none',
        margin: '0 4px',
        '&:hover': {
            textDecoration: 'underline'
        }
    },
    communityName: {
        color: '#d7dadc',
        fontWeight: 'bold',
        margin: '0 4px',
    },
    metaDivider: {
        margin: '0 2px',
        color: '#818384',
    },
    timestamp: {
        marginLeft: '4px',
    },
    commentBody: {
        fontSize: '14px',
        lineHeight: '1.5',
        color: '#d7dadc',
        padding: '10px 12px',
        backgroundColor: '#272729',
        borderRadius: '4px',
        marginTop: '6px',
    },
    commentFooter: {
        marginTop: '8px',
        fontSize: '12px',
        color: '#818384',
        fontWeight: 'bold',
    },
    voteLabel: {
        color: '#ff4500',
    },
    // Right Sidebar Karma
    karmaCard: {
        background: '#1a1a1b',
        padding: '20px',
        borderRadius: '4px',
        border: '1px solid #343536',
    },
    karmaTitle: {
        fontSize: '14px',
        textTransform: 'uppercase',
        color: '#818384',
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
        color: '#d7dadc',
    },
    karmaLabel: {
        color: '#d7dadc',
    },
    karmaValue: {
        color: '#ffffff',
    },
    // Utility
    loading: {
        textAlign: 'center',
        padding: '40px',
        color: '#818384',
        fontSize: '16px',
        backgroundColor: '#030303',
        minHeight: '100vh'
    },
    error: {
        textAlign: 'center',
        padding: '40px',
        color: '#ff4500',
        fontSize: '16px',
        backgroundColor: '#030303',
        minHeight: '100vh'
    },
    emptyState: {
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#1a1a1b',
        border: '1px solid #343536',
        borderRadius: '4px',
        color: '#818384',
    }
};

export default Profile;
