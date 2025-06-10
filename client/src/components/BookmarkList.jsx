import React, { useState } from 'react';

function BookmarkList({ bookmarks, onDelete, onEdit }) {
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

  return (
    <div className="bookmark-list-container">
      {bookmarks.length === 0 ? (
        <p>No bookmarks yet. Add one above!</p>
      ) : (
        <ul className="bookmark-grid">
          {bookmarks.map((bookmark) => (
            <li key={bookmark.id} className="bookmark-item">
              {bookmark.image_url && (
                <div className="bookmark-image-wrapper">
                  <img src={bookmark.image_url} alt={bookmark.title} className="bookmark-thumbnail" />

                </div>
              )}
              <div className="bookmark-details">
                {editingBookmarkId === bookmark.id ? (
                  <>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                    />
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                    />
                    <button className='btn' onClick={() => handleSaveEdit(bookmark.id)}>Save</button>
                    <button className='btn' onClick={() => setEditingBookmarkId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <h3>{bookmark.title}</h3>
                    <p>{bookmark.description}</p>
                    <div className="bookmark-actions">
                      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="view-link button">Open Link</a>
                      <button onClick={() => handleEditClick(bookmark)} className="edit-button">Edit</button>
                      <button onClick={() => onDelete(bookmark.id)} className="delete-button">Delete</button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default BookmarkList;