// src/pages/AgentDashboardPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import TokenDashboard from '../components/agent/TokenDashboard';

const AgentDashboardPage = () => {
  const { currentUser } = useAuth();
  const [activeListings, setActiveListings] = useState([]);
  const [activeBids, setActiveBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListingsAndBids = async () => {
      if (!currentUser) return;
      
      try {
        // Fetch active listings
        const listingsQuery = query(
          collection(db, 'listings'),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );
        
        const listingsSnapshot = await getDocs(listingsQuery);
        const listingsData = [];
        
        listingsSnapshot.forEach((doc) => {
          listingsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setActiveListings(listingsData);
        
        // Fetch agent's active bids
        const bidsQuery = query(
          collection(db, 'bids'),
          where('agentId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const bidsSnapshot = await getDocs(bidsQuery);
        const bidsData = [];
        
        bidsSnapshot.forEach((doc) => {
          bidsData.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setActiveBids(bidsData);
      } catch (error) {
        setError('Error fetching data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListingsAndBids();
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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Agent Dashboard
      </h1>
      
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
      
      {/* Token Dashboard */}
      <TokenDashboard />
      
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Your Active Bids ({activeBids.length})
      </h2>
      
      {activeBids.length === 0 ? (
        <div style={{ 
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <p style={{ marginBottom: '1rem' }}>You haven't placed any bids yet.</p>
          <p style={{ marginBottom: '1rem' }}>Browse available listings to submit your proposals.</p>
          <button
            onClick={() => window.scrollTo(0, document.body.scrollHeight)}
            className="btn btn-primary"
          >
            Browse Listings
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {activeBids.map((bid) => (
              <div 
                key={bid.id} 
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  padding: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontWeight: '600' }}>
                    Bid on Listing #{bid.listingId}
                  </h3>
                  <span style={{ 
                    backgroundColor: bid.status === 'accepted' ? '#dcfce7' : '#f3f4f6',
                    color: bid.status === 'accepted' ? '#15803d' : '#4b5563',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                  </span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>
                    {bid.commissionType === 'percentage' 
                      ? `${bid.commissionBaseValue}% commission` 
                      : formatCurrency(bid.commissionBaseValue) + ' flat fee'}
                  </span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Submitted: {new Date(bid.createdAt?.toDate()).toLocaleDateString()}
                  </span>
                </div>
                <Link 
                  to={`/agent/listings/${bid.listingId}`} 
                  style={{ 
                    color: '#2563eb',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  View Listing
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Active Listings ({activeListings.length})
      </h2>
      
      {activeListings.length === 0 ? (
        <div style={{ 
          border: '1px solid #e5e7eb',
          borderRadius: '0.375rem',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <p>There are no active listings at the moment.</p>
          <p>Check back soon for new opportunities.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {activeListings.map((listing) => (
            <div 
              key={listing.id} 
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                padding: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ 
                  backgroundColor: listing.listingType === 'buyer' ? '#eff6ff' : '#f0fdf4',
                  color: listing.listingType === 'buyer' ? '#2563eb' : '#16a34a',
                  fontWeight: '500',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem'
                }}>
                  {listing.listingType === 'buyer' ? 'Buyer' : 'Seller'}
                </span>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {listing.bidCount} {listing.bidCount === 1 ? 'bid' : 'bids'}
                </span>
              </div>
              
              {listing.listingType === 'buyer' ? (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: '600' }}>
                      {listing.buyerListing.location.city}, {listing.buyerListing.location.state}
                    </h3>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                      Budget: {formatCurrency(listing.buyerListing.budget.min)} - {formatCurrency(listing.buyerListing.budget.max)}
                    </span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                      {listing.buyerListing.bedrooms}+ bed • {listing.buyerListing.bathrooms}+ bath
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: '600' }}>
                      {listing.sellerListing.location.address}, {listing.sellerListing.location.city}
                    </h3>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '500' }}>
                      {formatCurrency(listing.sellerListing.priceExpectation)}
                    </span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ color: '#4b5563', fontSize: '0.875rem' }}>
                      {listing.sellerListing.bedrooms} bed • {listing.sellerListing.bathrooms} bath • {listing.sellerListing.squareFeet} sq ft
                    </span>
                  </div>
                </>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Posted: {new Date(listing.createdAt?.toDate()).toLocaleDateString()}
                </span>
                <Link 
                  to={`/agent/listings/${listing.id}`} 
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

export default AgentDashboardPage;