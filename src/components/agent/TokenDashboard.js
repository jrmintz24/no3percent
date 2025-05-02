// src/components/agent/TokenDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getTokenBalance, initializeTokenAccount } from '../../firebase/tokenModel';

const TokenDashboard = () => {
  const { currentUser } = useAuth();
  
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!currentUser) return;
      
      try {
        // Initialize token account if it doesn't exist
        await initializeTokenAccount(currentUser.uid);
        
        // Get token balance
        const balance = await getTokenBalance(currentUser.uid);
        setTokenBalance(balance);
      } catch (error) {
        setError('Error fetching token balance: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenBalance();
  }, [currentUser]);
  
  if (loading) {
    return <div className="p-4">Loading token balance...</div>;
  }
  
  return (
    <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Your Bid Tokens</h3>
        <Link 
          to="/agent/buy-tokens"
          className="btn btn-primary"
        >
          Buy More Tokens
        </Link>
      </div>
      
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
      
      <div style={{ 
        backgroundColor: tokenBalance > 0 ? '#f3f4f6' : '#fee2e2',
        padding: '2rem',
        borderRadius: '0.5rem',
        textAlign: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: tokenBalance > 0 ? '#2563eb' : '#b91c1c' }}>
          {tokenBalance}
        </div>
        <p style={{ color: '#6b7280' }}>
          {tokenBalance === 1 ? 'Token Available' : 'Tokens Available'}
        </p>
      </div>
      
      <div>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>What are Bid Tokens?</h4>
        <p style={{ marginBottom: '1rem' }}>
          Bid tokens allow you to submit proposals to potential clients. Each bid you place on a listing requires one token.
        </p>
        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>How to get more tokens:</h4>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Purchase token packages from your dashboard</li>
          <li>Earn bonus tokens by completing successful transactions</li>
          <li>Receive monthly token allocations with your subscription</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenDashboard;