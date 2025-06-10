import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

function AddBookmark({ onBookmarkAdded }) {
  const [url, setUrl] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const linkPreviewApiKey = import.meta.env.VITE_LINKPREVIEW_API_KEY;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch link preview data
      let fetchedTitle = '';
      let fetchedDescription = '';
      let image = null;
      let linkPreviewFailed = false;

      try {
        const previewResponse = await fetch(`https://api.linkpreview.net/?key=${linkPreviewApiKey}&q=${encodeURIComponent(url)}`);
        const previewData = await previewResponse.json();

        if (previewData.error) {
          console.warn('Link preview failed:', previewData.description);
          // If LinkPreview fails, use the URL as title and a generic description
          fetchedTitle = url;
          fetchedDescription = 'No description available from link preview.';
          linkPreviewFailed = true;
        } else {
          fetchedTitle = previewData.title || url;
          fetchedDescription = previewData.description || 'No description available from link preview.';
          image = previewData.image || null;
        }
      } catch (previewError) {
        console.error('Error fetching link preview:', previewError.message);
        // If fetching LinkPreview fails entirely, use the URL as title and a generic description
        fetchedTitle = url;
        fetchedDescription = 'No description available from link preview.';
        linkPreviewFailed = true;
      }

      // Determine final title
      let finalTitle;
      if (titleInput) {
        finalTitle = titleInput;
      } else if (linkPreviewFailed) {
        // If LinkPreview failed and user didn't provide a title, ask for one
        setError('Link preview failed. Please provide a title for the bookmark.');
        setLoading(false);
        return;
      } else {
        finalTitle = fetchedTitle;
      }

      // If for some reason finalTitle is still empty (e.g., fetchedTitle was also empty and not caught by linkPreviewFailed)
      if (!finalTitle) {
        setError('Please provide a title for the bookmark.');
        setLoading(false);
        return;
      }

      // Use user-provided description if available, otherwise use the one from LinkPreview
      const finalDescription = descriptionInput || fetchedDescription;

      // 2. Save to Supabase
      const { data, error } = await supabase
        .from('bookmarks')
        .insert([
          {
            user_id: (await supabase.auth.getSession()).data.session.user.id,
            url: url,
            title: finalTitle,
            description: finalDescription,
            image_url: image,
          },
        ])
        .select();

      if (error) throw error;

      setUrl('');
      setTitleInput('');
      setDescriptionInput('');
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
        <input
          type="text"
          placeholder="Optional: Add a title"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
        />
        <textarea
          placeholder="Optional: Add a description"
          value={descriptionInput}
          onChange={(e) => setDescriptionInput(e.target.value)}
          rows="3"
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