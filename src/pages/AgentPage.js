// src/pages/AgentPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AgentPage = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        For Agents
      </h1>
      <p style={{ marginBottom: '2rem' }}>
        Find qualified leads and submit competitive bids without cold calling or paying for expensive lead services.
      </p>
      
      {currentUser ? (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/agent/dashboard" className="btn btn-primary">
            Go to Agent Dashboard
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <Link to="/signup" className="btn btn-primary">
            Sign Up as an Agent
          </Link>
          <p>Already have an account? <Link to="/signin" style={{ color: '#2563eb' }}>Sign In</Link></p>
        </div>
      )}
    </div>
  );
};

export default AgentPage;