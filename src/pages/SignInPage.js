// src/pages/SignInPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignInPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      await login(email, password);
      navigate('/');
    } catch (error) {
      setError('Failed to sign in: ' + error.message);
    }
    
    setLoading(false);
  }
  
  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: '500px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
        Sign In to No3Percent
      </h2>
      
      {error && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c', 
          padding: '1rem', 
          borderRadius: '0.375rem', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
      )}
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Email
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Password
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem'
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#2563eb' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;