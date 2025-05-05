import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import '../styles/Auth.css';

function Auth() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create or fetch user
      const user = await apiService.createUser({ username });
      localStorage.setItem('currentUser', JSON.stringify(user));
      navigate('/game');
    } catch (err) {
      console.error(err);
      alert('Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      <h2>Welcome to Mapachu</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder="Your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit">Start</button>
      </form>
    </div>
  );
}

export default Auth;