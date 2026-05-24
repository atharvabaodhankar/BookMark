import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function BookmarkList({
  bookmarks,
  onDelete,
  onEdit,
  playlists = [],
  currentUserId,
  activePlaylistId,
  onRemoveFromPlaylist,
}) {
  const [editingBookmarkId, setEditingBookmarkId] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  const handleEditClick = (bookmark) => {
    setEditingBookmarkId(bookmark.id);
    setEditedTitle(bookmark.title);
    setEditedDescription(bookmark.description);
  };

  const handleSaveEdit = (bookmarkId) => {
    onEdit(bookmarkId, { title: editedTitle, description: editedDescription });
    setEditingBookmarkId(null);
    setEditedTitle('');
    setEditedDescription('');
  };

  const handleAddToPlaylist = async (playlistId, bookmarkId) => {
    try {
      const { error } = await supabase
        .from('playlist_bookmarks')
        .insert([{ playlist_id: playlistId, bookmark_id: bookmarkId }]);

      if (error) {
        if (error.code === '23505') {
          alert('This video is already in that playlist!');
        } else {
          throw error;
        }
      } else {
        alert('Added to playlist successfully!');
      }
    } catch (err) {
      console.error('Error adding to playlist:', err.message);
      alert('Failed to add to playlist.');
    }
  };

  // Only allow adding to playlists owned by the current user
  const myPlaylists = playlists.filter((p) => p.user_id === currentUserId);

  // Check if current user owns the active playlist to allow removing videos
  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);
  const isPlaylistOwner = activePlaylist && activePlaylist.user_id === currentUserId;

  return (
    <div className="bookmark-list-container">
      {bookmarks.length === 0 ? (
        <p className="no-bookmarks-placeholder">No videos found. Be the first to add one!</p>
      ) : (
        <ul className="bookmark-grid">
          {bookmarks.map((bookmark) => {
            const isOwner = bookmark.user_id === currentUserId;
            return (
              <li key={bookmark.id} className="bookmark-item">
                {bookmark.image_url && (
                  <div className="bookmark-image-wrapper">
                    <img
                      src={bookmark.image_url}
                      alt={bookmark.title}
                      className="bookmark-thumbnail"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500&auto=format&fit=crop&q=60';
                      }}
                    />
                  </div>
                )}
                <div className="bookmark-details">
                  <div className="bookmark-meta">
                    <span className="creator-tag">
                      👤 @{bookmark.profiles?.username || 'user'}
                    </span>
                  </div>

                  {editingBookmarkId === bookmark.id ? (
                    <div className="edit-form-inline">
                      <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="inline-edit-input"
                      />
                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="inline-edit-textarea"
                        rows={3}
                      />
                      <div className="inline-edit-actions">
                        <button
                          className="btn-save"
                          onClick={() => handleSaveEdit(bookmark.id)}
                        >
                          Save
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => setEditingBookmarkId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{bookmark.title}</h3>
                      <p>{bookmark.description}</p>

                      {/* Dropdown to add to personal playlists */}
                      {myPlaylists.length > 0 && (
                        <div className="playlist-actions-area">
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddToPlaylist(e.target.value, bookmark.id);
                              }
                            }}
                            className="playlist-add-dropdown"
                          >
                            <option value="" disabled>
                              ➕ Add to playlist...
                            </option>
                            {myPlaylists.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="bookmark-actions">
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="view-link button"
                        >
                          Watch Video
                        </a>

                        {isOwner && (
                          <>
                            <button
                              onClick={() => handleEditClick(bookmark)}
                              className="edit-button"
                              title="Edit details"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete(bookmark.id)}
                              className="delete-button"
                              title="Delete permanently"
                            >
                              Delete
                            </button>
                          </>
                        )}

                        {activePlaylistId && isPlaylistOwner && (
                          <button
                            onClick={() => onRemoveFromPlaylist(bookmark.id)}
                            className="remove-playlist-button"
                            title="Remove from this playlist"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default BookmarkList;