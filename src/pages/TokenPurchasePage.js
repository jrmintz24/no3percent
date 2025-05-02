// src/pages/TokenPurchasePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTokenBalance, addTokens, initializeTokenAccount } from '../firebase/tokenModel';

const TokenPurchasePage = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    
    // Make sure user is an agent
    if (userProfile && userProfile.userType !== 'agent') {
      navigate('/');
      return;
    }
    
    const fetchTokenBalance = async () => {
      try {
        // Initialize token account if it doesn't exist
        await initializeTokenAccount(currentUser.uid);
        
        // Get current token balance
        const balance = await getTokenBalance(currentUser.uid);
        setTokenBalance(balance);
      } catch (error) {
        setError('Error fetching token balance: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTokenBalance();
  }, [currentUser, userProfile, navigate]);
  
  // Token packages
  const tokenPackages = [
    { id: 'basic', tokens: 5, price: 49.99, savePercent: 0 },
    { id: 'standard', tokens: 15, price: 129.99, savePercent: 13 },
    { id: 'premium', tokens: 30, price: 239.99, savePercent: 20 },
    { id: 'unlimited', tokens: 100, price: 499.99, savePercent: 33 }
  ];
  
  const handlePackageSelect = (packageId) => {
    setSelectedPackage(packageId);
  };
  
  const handlePurchase = async () => {
    if (!selectedPackage) {
      setError('Please select a token package');
      return;
    }
    
    try {
      setPurchasing(true);
      setError('');
      
      const packageInfo = tokenPackages.find(pkg => pkg.id === selectedPackage);
      
      // In a real app, you would integrate with a payment processor here
      // For now, we'll just add the tokens directly
      
      await addTokens(currentUser.uid, packageInfo.tokens);
      
      // Update the local token balance
      setTokenBalance(prev => prev + packageInfo.tokens);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/agent/dashboard');
      }, 3000);
    } catch (error) {
      setError('Error purchasing tokens: ' + error.message);
    } finally {
      setPurchasing(false);
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }
  
  return (
    <div className="container" style={{ maxWidth: '800px', padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Purchase Bid Tokens
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
      
      {success ? (
        <div style={{ 
          backgroundColor: '#dcfce7', 
          color: '#15803d', 
          padding: '1rem', 
          borderRadius: '0.375rem', 
          marginBottom: '1rem',
          textAlign: 'center' 
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Purchase Successful!</p>
          <p>Your tokens have been added to your account.</p>
          <p>Redirecting to dashboard...</p>
        </div>
      ) : (
        <>
          <div style={{ 
            backgroundColor: '#f3f4f6',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                Current Token Balance
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                You can use tokens to bid on listings
              </p>
            </div>
            <div style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: tokenBalance > 0 ? '#2563eb' : '#b91c1c' 
            }}>
              {tokenBalance}
            </div>
          </div>
          
          <div className="card">
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                Bid tokens allow you to submit proposals to potential clients. Each bid requires one token.
              </p>
              <p>
                Select a package below to purchase tokens:
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {tokenPackages.map((pkg) => (
                <div 
                  key={pkg.id}
                  style={{ 
                    border: selectedPackage === pkg.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: selectedPackage === pkg.id ? '#eff6ff' : 'white'
                  }}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'capitalize' }}>
                    {pkg.id}
                  </h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.5rem' }}>
                    {pkg.tokens}
                  </div>
                  <p style={{ marginBottom: '0.5rem' }}>Tokens</p>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {formatCurrency(pkg.price)}
                  </div>
                  {pkg.savePercent > 0 && (
                    <span style={{ 
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      Save {pkg.savePercent}%
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            <button
              onClick={handlePurchase}
              disabled={!selectedPackage || purchasing}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {purchasing ? 'Processing...' : `Purchase ${selectedPackage ? tokenPackages.find(pkg => pkg.id === selectedPackage).tokens : ''} Tokens`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TokenPurchasePage;