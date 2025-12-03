// Profile.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Post from './Post'; // 🔑 Make sure to import your Post component
// Use the same API_URL you defined in your config.jsx
const API_URL = "http://localhost:3000"; 


const Profile = (
    // Assuming currentUser is passed from App.jsx, like: <Profile currentUser={currentUser} />
    { currentUser } 
) => {
    const { username } = useParams();

    // 1. STATE MANAGEMENT
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [bioText, setBioText] = useState(''); 
    
    // 🔑 STATE FOR USER POSTS
    const [userPosts, setUserPosts] = useState([]); 
    const [postsLoading, setPostsLoading] = useState(false);

    // Helper to check if the current logged-in user matches the profile owner
    const isOwner = currentUser && currentUser.toLowerCase() === username.toLowerCase();


    // ----------------------------------------------------
    // 2. EFFECT 1: FETCH PROFILE DATA (Bio, Karma, etc.)
    // ----------------------------------------------------
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_URL}/users/${username}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch profile.');
                }

                setProfileData(data);
                // Initialize bioText state with the fetched bio for editing
                setBioText(data.profile.bio || ''); 

            } catch (err) {
                console.error('Fetch Profile Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]); 


    // ----------------------------------------------------
    // 3. EFFECT 2: FETCH USER POSTS (Fix for missing posts)
    // ----------------------------------------------------
    useEffect(() => {
        const fetchUserPosts = async () => {
            setPostsLoading(true);
            try {
                // Fetch from the correct backend route: /users/:username/posts
                const response = await fetch(`${API_URL}/users/${username}/posts`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to fetch user posts.');
                }
                
                setUserPosts(data);

            } catch (err) {
                console.error('Fetch User Posts Error:', err);
                // The main error state is only for profile data, not posts
            } finally {
                setPostsLoading(false);
            }
        };

        if (username) {
            fetchUserPosts();
        }
    }, [username]);


    // ----------------------------------------------------
    // 4. HANDLE SAVE BIO (The working fix)
    // ----------------------------------------------------
    const handleSaveBio = async () => {
        if (!isOwner) {
            alert('You are not authorized to edit this profile.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users/${username}`, {
                method: 'PATCH', 
                headers: {
                    'Content-Type': 'application/json',
                },
                // Send the updated bio text
                body: JSON.stringify({ bio: bioText }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update bio.');
            }

            const data = await response.json();
            
            // Update the local state with the new bio returned from the server
            setProfileData(prev => ({ 
                ...prev, 
                profile: { 
                    ...prev.profile, 
                    bio: data.newBio
                } 
            }));

            setIsEditing(false); // Close edit mode
            
        } catch (error) {
            console.error('Bio update error:', error);
            alert(`Failed to save bio: ${error.message}`);
        }
    };
    
    // ----------------------------------------------------
    // 5. RENDERING
    // ----------------------------------------------------
    if (loading) return <div className="profile-page" style={{ textAlign: 'center', padding: '50px' }}>Loading profile...</div>;
    if (error) return <div className="profile-page error" style={{ textAlign: 'center', padding: '50px', color: 'red' }}>Error: {error}</div>;
    if (!profileData) return <div className="profile-page" style={{ textAlign: 'center', padding: '50px' }}>Profile data unavailable.</div>;

    const bioContent = profileData.profile.bio;
    
    return (
        <div className="profile-page" style={{ 
            maxWidth: '1000px', margin: '0 auto', padding: '20px', 
            display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' 
        }}>
            {/* Left Content Column */}
            <div className="profile-main-content">
                
                {/* Profile Header Card (Bio/Edit Section) */}
                <div className="profile-header-card" style={{ background: 'white', padding: '20px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '20px' }}>
                    <h1 style={{ marginBottom: '10px' }}>u/{profileData.username}</h1>
                    <div style={{ fontSize: '14px', color: '#787c7e' }}>
                        Cake Day: {new Date(profileData.profile.cakeDay).toLocaleDateString()}
                    </div>
                    
                    <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>About Me</h3>

                    {/* Edit Bio Logic (Working) */}
                    {isEditing ? (
                        <div className="bio-edit-container">
                            <textarea
                                value={bioText}
                                onChange={(e) => setBioText(e.target.value)}
                                style={{ width: '100%', minHeight: '100px', padding: '10px', marginBottom: '10px' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={handleSaveBio} style={{ background: '#0079d3', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>
                                    Save
                                </button>
                                <button onClick={() => {
                                    setIsEditing(false);
                                    setBioText(bioContent || ''); 
                                }} style={{ background: '#edeff1', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bio-display-container">
                            <p style={{ marginBottom: '10px', minHeight: '30px' }}>
                                {bioContent || "This user hasn't written a bio yet."}
                            </p>
                            
                            {isOwner && (
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    style={{ background: 'none', border: '1px solid #0079d3', color: '#0079d3', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}
                                >
                                    Edit Bio
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* 🔑 USER POSTS DISPLAY (The Fix) */}
                <div className="user-posts-container">
                    <h3 style={{ marginBottom: '15px' }}>{profileData.username}'s Posts</h3>
                    {postsLoading ? (
                        <p>Loading posts...</p>
                    ) : userPosts.length === 0 ? (
                        <p style={{ color: '#787c7e' }}>This user hasn't created any posts yet.</p>
                    ) : (
                        userPosts.map(post => (
                            <Post 
                                key={post._id} 
                                // Map backend post data to your Post component props
                                post={{
                                    id: post._id,
                                    community: post.community,
                                    user: post.user,
                                    // Convert the timestamp to a readable format
                                    time: new Date(post.createdAt).toLocaleDateString(), 
                                    title: post.title,
                                    content: post.content,
                                    votes: post.votes,
                                    comments: post.comments, // Ensure commentsCount is mapped to comments
                                    image: post.image,
                                    userVote: 0 
                                }}
                                // Pass any required functions (e.g., onVote) and currentUser if needed for voting
                            />
                        ))
                    )}
                </div>

            </div>

            {/* Right Sidebar Column (Karma/Stats) */}
            <div className="profile-sidebar">
                <div className="karma-card" style={{ background: 'white', padding: '20px', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <h3>Karma</h3>
                    <div style={{ marginTop: '10px', fontSize: '14px' }}>
                        <p><strong>Post Karma:</strong> {profileData.karma.postKarma}</p>
                        <p><strong>Comment Karma:</strong> {profileData.karma.commentKarma}</p>
                        <p style={{ marginTop: '10px' }}><strong>Total Karma:</strong> {profileData.karma.postKarma + profileData.karma.commentKarma}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;