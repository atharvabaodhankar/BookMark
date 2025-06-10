import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function AddBookmark({ onBookmarkAdded }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const linkPreviewApiKey = import.meta.env.VITE_LINKPREVIEW_API_KEY;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch link preview data
      const previewResponse = await fetch(`https://api.linkpreview.net/?key=${linkPreviewApiKey}&q=${encodeURIComponent(url)}`);
      const previewData = await previewResponse.json();

      if (previewData.error) {
        throw new Error(previewData.description || 'Failed to fetch link preview.');
      }

      const { title, description, image } = previewData;

      // 2. Save to Supabase
      const { data, error } = await supabase
        .from('bookmarks')
        .insert([
          {
            user_id: (await supabase.auth.getSession()).data.session.user.id,
            url: url,
            title: title || 'No Title',
            description: description || 'No Description',
            image_url: image || null,
          },
        ])
        .select();

      if (error) throw error;

      setUrl('');
      onBookmarkAdded(); // Trigger refresh in Dashboard
      console.log('Bookmark added:', data);
    } catch (error) {
      console.error('Error adding bookmark:', error.message);
      setError(error.message || 'Failed to add bookmark.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-bookmark-container">
      <h3>Add New Bookmark</h3>
      <form onSubmit={handleSubmit} className="add-bookmark-form">
        <input
          type="url"
          placeholder="Enter link (e.g., https://youtube.com/watch?v=example)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Bookmark'}
        </button>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default AddBookmark;