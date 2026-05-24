import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AddBookmark from './AddBookmark';
import BookmarkList from './BookmarkList';
import PlaylistManager from './PlaylistManager';

function Dashboard({ session }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserId = session?.user?.id;

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*, profiles:user_id ( username )')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (err) {
      console.error('Error fetching playlists:', err.message);
    }
  };

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activePlaylistId) {
        // Fetch only bookmarks in the active playlist
        const { data, error } = await supabase
          .from('playlist_bookmarks')
          .select(`
            bookmarks (
              id,
              created_at,
              user_id,
              url,
              title,
              description,
              image_url,
              profiles:user_id ( username )
            )
          `)
          .eq('playlist_id', activePlaylistId);

        if (error) throw error;

        // Flatten the join query response
        const list = data
          ? data.map((item) => item.bookmarks).filter(Boolean)
          : [];
        setBookmarks(list);
      } else {
        // Fetch all bookmarks
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*, profiles:user_id ( username )')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBookmarks(data || []);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error.message);
      setError('Failed to load bookmarks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchBookmarks();
    }
  }, [session, activePlaylistId]);

  useEffect(() => {
    if (session) {
      fetchPlaylists();
    }
  }, [session]);

  const handleBookmarkAdded = () => {
    fetchBookmarks();
  };

  const handlePlaylistCreated = (newPlaylist) => {
    fetchPlaylists();
    setActivePlaylistId(newPlaylist.id);
  };

  const handleSocialAction = () => {
    fetchPlaylists();
    fetchBookmarks();
  };

  const handleDeleteBookmark = async (id) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBookmarks(bookmarks.filter((b) => b.id !== id));
    } catch (error) {
      console.error('Error deleting bookmark:', error.message);
      setError('Failed to delete bookmark.');
    }
  };

  const handleRemoveFromPlaylist = async (bookmarkId) => {
    try {
      const { error } = await supabase
        .from('playlist_bookmarks')
        .delete()
        .eq('playlist_id', activePlaylistId)
        .eq('bookmark_id', bookmarkId);

      if (error) throw error;
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
    } catch (error) {
      console.error('Error removing bookmark from playlist:', error.message);
      setError('Failed to remove bookmark from playlist.');
    }
  };

  const handleEditBookmark = async (id, updatedFields) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .update(updatedFields)
        .eq('id', id)
        .select(`
          *,
          profiles:user_id ( username )
        `);

      if (error) throw error;
      setBookmarks(bookmarks.map((b) => (b.id === id ? data[0] : b)));
    } catch (error) {
      console.error('Error updating bookmark:', error.message);
      setError('Failed to update bookmark.');
    }
  };

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);

  if (!session) return <p>Please log in to view bookmarks.</p>;

  return (
    <div className="dashboard-layout">
      <PlaylistManager
        playlists={playlists}
        currentUserId={currentUserId}
        activePlaylistId={activePlaylistId}
        onSelectPlaylist={setActivePlaylistId}
        onPlaylistCreated={handlePlaylistCreated}
        onSocialAction={handleSocialAction}
      />

      <div className="dashboard-content">
        <div className="dashboard-header-container">
          <h1>
            {activePlaylist
              ? `Playlist: ${activePlaylist.name}`
              : 'All Shared Videos'}
          </h1>
          {activePlaylist && (
            <p className="playlist-creator-subtitle">
              Created by @{activePlaylist.profiles?.username || 'user'}
            </p>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}

        {/* Only show the add bookmark form on the "All Videos" tab, or you can allow it anywhere */}
        {!activePlaylistId && (
          <AddBookmark
            onBookmarkAdded={handleBookmarkAdded}
            currentUserId={currentUserId}
          />
        )}

        {loading ? (
          <div className="loading-container">
            <span className="spinner"></span>
            <p>Loading videos...</p>
          </div>
        ) : (
          <BookmarkList
            bookmarks={bookmarks}
            onDelete={handleDeleteBookmark}
            onEdit={handleEditBookmark}
            playlists={playlists}
            currentUserId={currentUserId}
            activePlaylistId={activePlaylistId}
            onRemoveFromPlaylist={handleRemoveFromPlaylist}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;