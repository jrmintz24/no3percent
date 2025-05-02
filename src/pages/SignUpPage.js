// src/pages/SignUpPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignUpPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Form validation
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (!userType) {
      return setError('Please select a user type');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Create the user account
      await signup(email, password, name, userType);
      
      // Redirect based on user type
      if (userType === 'buyer') {
        navigate('/buyer');
      } else if (userType === 'seller') {
        navigate('/seller');
      } else if (userType === 'agent') {
        navigate('/agent');
      }
    } catch (error) {
      setError('Failed to create an account: ' + error.message);
    }
    
    setLoading(false);
  }
  
  return (
    <div className="container" style={{ padding: '3rem 0', maxWidth: '500px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
        Create Your No3Percent Account
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
              I am a:
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ 
                flex: 1, 
                padding: '1rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem',
                backgroundColor: userType === 'buyer' ? '#eff6ff' : 'white',
                borderColor: userType === 'buyer' ? '#2563eb' : '#e5e7eb',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio" 
                  name="userType" 
                  value="buyer" 
                  checked={userType === 'buyer'}
                  onChange={() => setUserType('buyer')}
                  style={{ marginRight: '0.5rem' }}
                />
                Buyer
              </label>
              <label style={{ 
                flex: 1, 
                padding: '1rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem',
                backgroundColor: userType === 'seller' ? '#f0fdf4' : 'white',
                borderColor: userType === 'seller' ? '#16a34a' : '#e5e7eb',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio" 
                  name="userType" 
                  value="seller" 
                  checked={userType === 'seller'}
                  onChange={() => setUserType('seller')}
                  style={{ marginRight: '0.5rem' }}
                />
                Seller
              </label>
              <label style={{ 
                flex: 1, 
                padding: '1rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem',
                backgroundColor: userType === 'agent' ? '#faf5ff' : 'white',
                borderColor: userType === 'agent' ? '#9333ea' : '#e5e7eb',
                cursor: 'pointer'
              }}>
                <input 
                  type="radio" 
                  name="userType" 
                  value="agent" 
                  checked={userType === 'agent'}
                  onChange={() => setUserType('agent')}
                  style={{ marginRight: '0.5rem' }}
                />
                Agent
              </label>
            </div>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Full Name
            </label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem'
              }}
            />
          </div>
          
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
          
          <div style={{ marginBottom: '1rem' }}>
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
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Confirm Password
            </label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <p style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          Already have an account? <Link to="/signin" style={{ color: '#2563eb' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;