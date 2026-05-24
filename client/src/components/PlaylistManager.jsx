import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function PlaylistManager({
  playlists,
  currentUserId,
  activePlaylistId,
  onSelectPlaylist,
  onPlaylistCreated,
  onSocialAction,
}) {
  const [activeTab, setActiveTab] = useState('playlists'); // 'playlists' | 'social'
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Social States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialMessage, setSocialMessage] = useState(null);
  const [connections, setConnections] = useState([]);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          sender:sender_id ( id, username ),
          receiver:receiver_id ( id, username )
        `)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      if (error) throw error;
      setConnections(data || []);
    } catch (err) {
      console.error('Error fetching connections:', err.message);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchConnections();
    }
  }, [currentUserId]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setLoading(true);
    setPlaylistError(null);

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert([
          {
            name: newPlaylistName.trim(),
            user_id: currentUserId,
          },
        ])
        .select();

      if (error) throw error;

      setNewPlaylistName('');
      setIsCreating(false);
      if (onPlaylistCreated) {
        onPlaylistCreated(data[0]);
      }
    } catch (err) {
      console.error('Error creating playlist:', err.message);
      setPlaylistError(err.message || 'Failed to create playlist.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    setSocialLoading(true);
    setSocialMessage(null);
    setSearchResult(null);

    try {
      // Find the profile matching username (excluding current user)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', query)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setSocialMessage('No user found with that username.');
      } else if (data.id === currentUserId) {
        setSocialMessage("You can't add yourself!");
      } else {
        setSearchResult(data);
      }
    } catch (err) {
      console.error(err);
      setSocialMessage('Error performing search.');
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSendFriendRequest = async (receiverId) => {
    try {
      const { error } = await supabase
        .from('connections')
        .insert([{ sender_id: currentUserId, receiver_id: receiverId, status: 'pending' }]);

      if (error) throw error;
      setSocialMessage('Friend request sent!');
      setSearchResult(null);
      setSearchQuery('');
      fetchConnections();
    } catch (err) {
      console.error(err);
      setSocialMessage('Already connected or request pending.');
    }
  };

  const handleAcceptRequest = async (connId) => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connId);

      if (error) throw error;
      fetchConnections();
      if (onSocialAction) onSocialAction();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveConnection = async (connId) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connId);

      if (error) throw error;
      fetchConnections();
      if (onSocialAction) onSocialAction();
    } catch (err) {
      console.error(err);
    }
  };

  // Group connections
  const pendingIncoming = connections.filter(
    (c) => c.status === 'pending' && c.receiver_id === currentUserId
  );
  const pendingOutgoing = connections.filter(
    (c) => c.status === 'pending' && c.sender_id === currentUserId
  );
  const activeFriends = connections.filter((c) => c.status === 'accepted');

  const myPlaylists = playlists.filter((p) => p.user_id === currentUserId);
  const otherPlaylists = playlists.filter((p) => p.user_id !== currentUserId);

  return (
    <div className="playlist-sidebar">
      {/* Premium Sidebar Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          📁 Playlists
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          👥 Social 
          {pendingIncoming.length > 0 && (
            <span className="incoming-request-dot"></span>
          )}
        </button>
      </div>

      {activeTab === 'playlists' ? (
        <div className="tab-panel">
          <div className="sidebar-header">
            <h2>Playlists</h2>
            <button
              className="create-playlist-toggle-btn"
              onClick={() => setIsCreating(!isCreating)}
            >
              {isCreating ? 'Cancel' : '+ New'}
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreatePlaylist} className="create-playlist-form">
              <input
                type="text"
                placeholder="Playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </button>
              {playlistError && <p className="error-message-small">{playlistError}</p>}
            </form>
          )}

          <ul className="playlist-menu">
            <li
              className={`playlist-item ${activePlaylistId === null ? 'active' : ''}`}
              onClick={() => onSelectPlaylist(null)}
            >
              <span className="playlist-icon">📺</span>
              <span className="playlist-name-text">All Videos</span>
            </li>

            {myPlaylists.length > 0 && (
              <li className="playlist-section-label">My Playlists</li>
            )}
            {myPlaylists.map((playlist) => (
              <li
                key={playlist.id}
                className={`playlist-item ${activePlaylistId === playlist.id ? 'active' : ''}`}
                onClick={() => onSelectPlaylist(playlist.id)}
              >
                <span className="playlist-icon">📁</span>
                <span className="playlist-name-text" title={playlist.name}>
                  {playlist.name}
                </span>
                <span className="playlist-creator-badge">You</span>
              </li>
            ))}

            {otherPlaylists.length > 0 && (
              <li className="playlist-section-label">Friends' Playlists</li>
            )}
            {otherPlaylists.map((playlist) => (
              <li
                key={playlist.id}
                className={`playlist-item ${activePlaylistId === playlist.id ? 'active' : ''}`}
                onClick={() => onSelectPlaylist(playlist.id)}
              >
                <span className="playlist-icon">🌐</span>
                <span className="playlist-name-text" title={playlist.name}>
                  {playlist.name}
                </span>
                <span className="playlist-creator-badge">
                  @{playlist.profiles?.username || 'user'}
                </span>
              </li>
            ))}

            {playlists.length === 0 && !isCreating && (
              <p className="no-playlists-text">No accessible playlists found.</p>
            )}
          </ul>
        </div>
      ) : (
        <div className="tab-panel social-panel animate-fade-in">
          <h2>Social Connections</h2>
          <p className="social-subheading">
            Add friends to share custom playlists and unlock each other's directories.
          </p>

          {/* User Search Form */}
          <form onSubmit={handleUserSearch} className="social-search-form">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              required
            />
            <button type="submit" disabled={socialLoading}>
              {socialLoading ? '🔎' : 'Search'}
            </button>
          </form>

          {socialMessage && <p className="social-feedback">{socialMessage}</p>}

          {/* Search Result */}
          {searchResult && (
            <div className="search-result-card">
              <span className="result-username">@{searchResult.username}</span>
              <button
                className="add-friend-btn"
                onClick={() => handleSendFriendRequest(searchResult.id)}
              >
                ➕ Add Friend
              </button>
            </div>
          )}

          {/* Pending Incoming Requests */}
          {pendingIncoming.length > 0 && (
            <div className="social-section">
              <span className="social-section-title">Incoming Requests ({pendingIncoming.length})</span>
              <ul className="social-list">
                {pendingIncoming.map((conn) => (
                  <li key={conn.id} className="social-list-item">
                    <span>@{conn.sender?.username}</span>
                    <div className="social-item-actions">
                      <button
                        className="btn-social-accept"
                        onClick={() => handleAcceptRequest(conn.id)}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className="btn-social-decline"
                        onClick={() => handleRemoveConnection(conn.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pending Outgoing Requests */}
          {pendingOutgoing.length > 0 && (
            <div className="social-section">
              <span className="social-section-title">Sent Requests</span>
              <ul className="social-list">
                {pendingOutgoing.map((conn) => (
                  <li key={conn.id} className="social-list-item">
                    <span className="text-dim">@{conn.receiver?.username}</span>
                    <button
                      className="btn-social-cancel"
                      onClick={() => handleRemoveConnection(conn.id)}
                    >
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Active Friends List */}
          <div className="social-section">
            <span className="social-section-title">My Friends ({activeFriends.length})</span>
            {activeFriends.length === 0 ? (
              <p className="no-friends-text">No friends added yet. Query someone above!</p>
            ) : (
              <ul className="social-list">
                {activeFriends.map((conn) => {
                  const friend =
                    conn.sender_id === currentUserId ? conn.receiver : conn.sender;
                  return (
                    <li key={conn.id} className="social-list-item">
                      <span className="friend-name-active">👤 @{friend?.username}</span>
                      <button
                        className="btn-social-unfriend"
                        onClick={() => handleRemoveConnection(conn.id)}
                        title="Remove friend"
                      >
                        Unfriend
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistManager;
