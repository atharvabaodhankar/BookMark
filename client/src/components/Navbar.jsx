import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Navbar({ session }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Bookmark Manager</Link>
      <ul className="navbar-links">
        {session ? (
          <>
            <li><button onClick={handleLogout} className="navbar-button">Logout</button></li>
          </>
        ) : (
          <li><Link to="/auth" className="navbar-link">Login/Sign Up</Link></li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;