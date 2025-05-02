// src/pages/BuyerListingsPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const BuyerListingsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    
    const fetchListings = async () => {
      try {
        const q = query(
          collection(db, 'listings'),
          where('createdBy', '==', currentUser.uid),
          where('listingType', '==', 'buyer'),
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
  }, [currentUser, navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          My Buyer Listings
        </h2>
        <Link to="/buyer/create-listing" className="btn btn-primary">
          Create New Listing
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
      
      {loading ? (
        <p>Loading your listings...</p>
      ) : listings.length === 0 ? (
        <div className="card text-center">
          <p>You don't have any buyer listings yet.</p>
          <Link to="/buyer/create-listing" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Create Your First Listing
          </Link>
        </div>
      ) : (
        <div>
          {listings.map((listing) => (
            <div key={listing.id} className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <span style={{ 
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    fontWeight: '500',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    marginRight: '0.5rem'
                  }}>
                    Buyer Listing
                  </span>
                  <span style={{ 
                    backgroundColor: listing.status === 'active' ? '#dcfce7' : '#fee2e2',
                    color: listing.status === 'active' ? '#15803d' : '#b91c1c',
                    fontWeight: '500',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                  }}>
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Created: {listing.createdAt?.toDate().toLocaleDateString() || 'Unknown'}
                  </p>
                </div>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                  {formatCurrency(listing.buyerListing.budget.min)} - {formatCurrency(listing.buyerListing.budget.max)}
                </h3>
                <p>
                  {listing.buyerListing.location.city}, {listing.buyerListing.location.state} | 
                  {' '}{listing.buyerListing.bedrooms}+ bed, {listing.buyerListing.bathrooms}+ bath
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {listing.buyerListing.propertyTypes.slice(0, 3).map((type) => (
                    <span 
                      key={type}
                      style={{ 
                        backgroundColor: '#f3f4f6',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {type}
                    </span>
                  ))}
                  {listing.buyerListing.propertyTypes.length > 3 && (
                    <span 
                      style={{ 
                        backgroundColor: '#f3f4f6',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      +{listing.buyerListing.propertyTypes.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '1rem'
              }}>
                <div>
                  <span style={{ color: '#6b7280', marginRight: '0.5rem' }}>
                    Bids: 
                  </span>
                  <span style={{ fontWeight: '500' }}>
                    {listing.bidCount || 0}
                  </span>
                </div>
                <Link to={`/buyer/listings/${listing.id}`} className="btn">
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

export default BuyerListingsPage;