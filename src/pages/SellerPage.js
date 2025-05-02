// src/pages/SellerPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SellerPage = () => {
  const { currentUser } = useAuth();
  
  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        For Sellers
      </h1>
      <p style={{ marginBottom: '2rem' }}>
        List your property and get competitive offers from agents with transparent à la carte pricing.
      </p>
      
      {currentUser ? (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/seller/create-listing" className="btn btn-primary">
            Create New Listing
          </Link>
          <Link to="/seller/listings" className="btn">
            View My Listings
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
          <Link to="/signup" className="btn btn-primary">
            Sign Up to Create a Seller Listing
          </Link>
          <p>Already have an account? <Link to="/signin" style={{ color: '#2563eb' }}>Sign In</Link></p>
        </div>
      )}
    </div>
  );
};

export default SellerPage;