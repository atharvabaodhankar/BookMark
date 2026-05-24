import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Navbar({ session }) {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (session?.user) {
      const getProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle();
        if (data) {
          setUsername(data.username);
        }
      };
      getProfile();
    } else {
      setUsername('');
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        BookMark Hub
      </Link>
      <ul className="navbar-links">
        {session ? (
          <>
            <li className="navbar-user-pill">
              <span className="navbar-avatar">👤</span>
              <span className="navbar-username">@{username || 'user'}</span>
            </li>
            <li>
              <button onClick={handleLogout} className="navbar-button">
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/auth" className="navbar-link">
              Login / Sign Up
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;