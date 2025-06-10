import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import AddBookmark from './AddBookmark';
import BookmarkList from './BookmarkList';

function Dashboard({ session }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data);
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
  }, [session]);

  const handleBookmarkAdded = () => {
    fetchBookmarks(); // Refresh list after adding
  };

  const handleDeleteBookmark = async (id) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setBookmarks(bookmarks.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting bookmark:', error.message);
      setError('Failed to delete bookmark.');
    }
  };

  const handleEditBookmark = async (id, updatedFields) => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .update(updatedFields)
        .eq('id', id)
        .select();

      if (error) throw error;
      setBookmarks(bookmarks.map(b => (b.id === id ? data[0] : b)));
    } catch (error) {
      console.error('Error updating bookmark:', error.message);
      setError('Failed to update bookmark.');
    }
  };

  if (!session) return <p>Please log in to view your bookmarks.</p>;
  if (loading) return <p>Loading bookmarks...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="dashboard-container">
      <h1>Your Bookmarks</h1>
      <AddBookmark onBookmarkAdded={handleBookmarkAdded} />
      <BookmarkList
        bookmarks={bookmarks}
        onDelete={handleDeleteBookmark}
        onEdit={handleEditBookmark}
      />
    </div>
  );
}

export default Dashboard;