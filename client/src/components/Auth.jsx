import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const cleanUsername = username.trim().toLowerCase();
        if (cleanUsername.length < 3) {
          throw new Error('Username must be at least 3 characters.');
        }

        // 1. Check if the username is already taken
        const { data: existing, error: checkError } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking username:', checkError);
        }

        if (existing) {
          throw new Error('Username is already taken. Please choose another.');
        }

        // 2. Perform Supabase Sign Up with metadata
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: cleanUsername,
            },
          },
        });

        if (error) throw error;

        // If email confirmation is off, data.session might be present
        if (data?.session) {
          setMessage('Account created and logged in!');
          navigate('/');
        } else {
          setMessage('Check your email for the confirmation link!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Logged in successfully!');
        navigate('/');
      }
    } catch (error) {
      setMessage(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleAuth} className="auth-form">
        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
        
        {isSignUp && (
          <input
            type="text"
            placeholder="Username (min 3 chars)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
        )}
        
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Login')}
        </button>
        <p>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <span className="auth-toggle" onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage('');
          }}>
            {isSignUp ? ' Login' : ' Sign Up'}
          </span>
        </p>
        {message && <p className="auth-message">{message}</p>}
      </form>
    </div>
  );
}

export default Auth;