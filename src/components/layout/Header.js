// src/components/layout/Header.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container flex justify-between items-center p-4">
        <Link to="/" className="text-decoration-none">
          <h1 style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '1.5rem' }}>No3Percent</h1>
        </Link>
        
        <nav>
          <ul className="flex" style={{ gap: '1.5rem', listStyle: 'none' }}>
            <li><Link to="/" style={{ textDecoration: 'none', color: '#333' }}>Home</Link></li>
            <li><Link to="/buyer" style={{ textDecoration: 'none', color: '#333' }}>For Buyers</Link></li>
            <li><Link to="/seller" style={{ textDecoration: 'none', color: '#333' }}>For Sellers</Link></li>
            <li><Link to="/agent" style={{ textDecoration: 'none', color: '#333' }}>For Agents</Link></li>
          </ul>
        </nav>
        
        <div className="flex" style={{ gap: '1rem' }}>
          {!currentUser ? (
            <>
              <Link to="/signin" className="btn" style={{ color: '#333' }}>Sign In</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          ) : (
            <div className="flex items-center" style={{ gap: '1rem' }}>
              {userProfile && (
                <Link to="/dashboard" style={{ textDecoration: 'none', color: '#333' }}>
                  <span style={{ fontWeight: '500' }}>
                    {userProfile.displayName} ({userProfile.userType})
                  </span>
                </Link>
              )}
              <button onClick={handleLogout} className="btn" style={{ color: '#333' }}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;