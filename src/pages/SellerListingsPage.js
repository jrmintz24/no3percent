// src/pages/SellerListingsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const SellerListingsPage = () => {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListings = async () => {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, 'listings'),
          where('createdBy', '==', currentUser.uid),
          where('listingType', '==', 'seller'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const listingsData = [];
        
        querySnapshot.forEach((doc) => {
          listingsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setListings(listingsData);
      } catch (error) {
        setError('Error fetching listings: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [currentUser]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>My Seller Listings</h1>
        <Link to="/seller/create-listing" className="btn btn-primary">Create New Listing</Link>
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
      
      {listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ marginBottom: '1rem' }}>You don't have any seller listings yet.</p>
          <Link to="/seller/create-listing" className="btn btn-primary">Create Your First Listing</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {listings.map((listing) => (
            <div 
              key={listing.id} 
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                padding: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontWeight: '600' }}>
                  {listing.sellerListing.location.address}, {listing.sellerListing.location.city}
                </h3>
                <span style={{ 
                  backgroundColor: listing.status === 'active' ? '#dcfce7' : '#fee2e2',
                  color: listing.status === 'active' ? '#15803d' : '#b91c1c',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </span>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                  {listing.sellerListing.bedrooms} bed • {listing.sellerListing.bathrooms} bath • {listing.sellerListing.squareFeet} sq ft
                </span>
              </div>
              <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
                {formatCurrency(listing.sellerListing.priceExpectation)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                  {listing.bidCount} {listing.bidCount === 1 ? 'bid' : 'bids'} • {listing.viewCount} {listing.viewCount === 1 ? 'view' : 'views'}
                </span>
                <Link 
                  to={`/seller/listings/${listing.id}`} 
                  style={{ 
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerListingsPage;