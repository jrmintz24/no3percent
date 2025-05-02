// src/components/listings/SellerListingDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const SellerListingDetail = () => {
  const { listingId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Map to store display names of services
  const serviceNames = {
    pricingStrategy: 'Pricing Strategy / CMA',
    homePreparationAdvice: 'Home Preparation Advice',
    professionalPhotography: 'Professional Photography',
    virtualTour: 'Virtual Tour / 3D Walkthrough',
    mlsListing: 'MLS Listing + Syndication',
    openHouseHosting: 'Open House Hosting',
    showingCoordination: 'Showing Coordination',
    lockboxInstallation: 'Lockbox Installation & Access Control',
    buyerScreening: 'Buyer Screening',
    offerReview: 'Offer Review & Strategy',
    counterofferDrafting: 'Counteroffer Drafting',
    negotiationOfTerms: 'Negotiation of Terms',
    inspectionNegotiation: 'Inspection Negotiation',
    contractCoordination: 'Contract Coordination',
    closingPrep: 'Closing Prep & Walkthrough Coordination',
    postSaleSupport: 'Post-Sale Support'
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingRef = doc(db, 'listings', listingId);
        const listingSnap = await getDoc(listingRef);
        
        if (listingSnap.exists()) {
          setListing({
            id: listingSnap.id,
            ...listingSnap.data()
          });
          
          // Fetch bids for this listing
          const bidsQuery = query(
            collection(db, 'bids'),
            where('listingId', '==', listingId),
            orderBy('createdAt', 'desc')
          );
          
          const bidsSnap = await getDocs(bidsQuery);
          const bidsData = [];
          
          bidsSnap.forEach((doc) => {
            bidsData.push({
              id: doc.id,
              ...doc.data()
            });
          });
          
          setBids(bidsData);
        } else {
          setError('Listing not found');
        }
      } catch (error) {
        setError('Error fetching listing: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListing();
  }, [listingId]);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'listings', listingId));
      navigate('/seller');
    } catch (error) {
      setError('Error deleting listing: ' + error.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <div className="text-center">
          <p>Loading listing details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <div style={{ 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c', 
          padding: '1rem', 
          borderRadius: '0.375rem', 
          marginBottom: '1rem' 
        }}>
          {error}
        </div>
        <Link to="/seller" className="btn btn-primary">Back to Listings</Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <div className="text-center">
          <p>Listing not found</p>
          <Link to="/seller" className="btn btn-primary mt-4">Back to Listings</Link>
        </div>
      </div>
    );
  }

  // Handle seller listing display
  if (listing.listingType === 'seller') {
    return (
      <div className="container" style={{ maxWidth: '800px', padding: '2rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Seller Listing Details
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/seller/listings" className="btn">Back to Listings</Link>
            {currentUser && listing.createdBy === currentUser.uid && (
              <>
                <Link to={`/seller/listings/${listingId}/edit`} className="btn">Edit</Link>
                <button
                  onClick={handleDelete}
                  className="btn"
                  style={{ 
                    backgroundColor: deleteConfirm ? '#b91c1c' : 'transparent',
                    color: deleteConfirm ? 'white' : '#b91c1c',
                    border: deleteConfirm ? 'none' : '1px solid #b91c1c'
                  }}
                >
                  {deleteConfirm ? 'Confirm Delete' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="card">
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ 
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                fontWeight: '500',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
              }}>
                Seller Listing
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
            <p>
              <span style={{ color: '#6b7280' }}>Created by:</span> {listing.creatorName || 'Anonymous'}
            </p>
            <p>
              <span style={{ color: '#6b7280' }}>Date:</span> {listing.createdAt?.toDate().toLocaleDateString() || 'Unknown'}
            </p>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Listing Price
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <p>{formatCurrency(listing.sellerListing.priceExpectation)}</p>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Property Location
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <p>{listing.sellerListing.location.address}</p>
            <p>{listing.sellerListing.location.city}, {listing.sellerListing.location.state} {listing.sellerListing.location.zipCode}</p>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Property Details
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Property Type:</p>
              <p>{listing.sellerListing.propertyType}</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: '#6b7280' }}>Bedrooms:</p>
                <p>{listing.sellerListing.bedrooms}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280' }}>Bathrooms:</p>
                <p>{listing.sellerListing.bathrooms}</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <p style={{ color: '#6b7280' }}>Square Feet:</p>
                <p>{listing.sellerListing.squareFeet}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280' }}>Lot Size:</p>
                <p>{listing.sellerListing.lotSize}</p>
              </div>
              <div>
                <p style={{ color: '#6b7280' }}>Year Built:</p>
                <p>{listing.sellerListing.yearBuilt}</p>
              </div>
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Features & Amenities
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Property Features:</p>
              {listing.sellerListing.features.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {listing.sellerListing.features.map((feature) => (
                    <span 
                      key={feature}
                      style={{ 
                        backgroundColor: '#eff6ff',
                        border: '1px solid #dbeafe',
                        borderRadius: '9999px',
                        padding: '0.25rem 0.75rem',
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              ) : (
                <p>None specified</p>
              )}
            </div>
            
            <div>
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Neighborhood Amenities:</p>
              {listing.sellerListing.amenities.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {listing.sellerListing.amenities.map((amenity) => (
                    <span 
                      key={amenity}
                      style={{ 
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #e0f2fe',
                        borderRadius: '9999px',
                        padding: '0.25rem 0.75rem',
                      }}
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : (
                <p>None specified</p>
              )}
            </div>
          </div>
          
          {listing.sellerListing.description && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                Description
              </h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ whiteSpace: 'pre-line' }}>{listing.sellerListing.description}</p>
              </div>
            </>
          )}
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Selling Details
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280' }}>Timeline:</p>
              <p>{listing.sellerListing.timeline}</p>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280' }}>Motivation:</p>
              <p>{listing.sellerListing.motivation}</p>
            </div>
          </div>
          
          {/* Requested Services section */}
          {listing.sellerListing.services && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                Requested Services
              </h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Must-Have Services:</h4>
                  {listing.sellerListing.services && listing.sellerListing.services.mustHave && listing.sellerListing.services.mustHave.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {listing.sellerListing.services.mustHave.map((serviceId) => (
                        <span 
                          key={serviceId}
                          style={{ 
                            backgroundColor: '#eff6ff',
                            border: '1px solid #dbeafe',
                            borderRadius: '9999px',
                            padding: '0.25rem 0.75rem',
                          }}
                        >
                          {serviceNames[serviceId] || serviceId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No must-have services specified</p>
                  )}
                </div>
                
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Nice-to-Have Services:</h4>
                  {listing.sellerListing.services && listing.sellerListing.services.niceToHave && listing.sellerListing.services.niceToHave.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {listing.sellerListing.services.niceToHave.map((serviceId) => (
                        <span 
                          key={serviceId}
                          style={{ 
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #e0f2fe',
                            borderRadius: '9999px',
                            padding: '0.25rem 0.75rem',
                          }}
                        >
                          {serviceNames[serviceId] || serviceId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No nice-to-have services specified</p>
                  )}
                </div>
              </div>
            </>
          )}
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Agent Bids ({bids.length})
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            {bids.length > 0 ? (
              <div className="space-y-4">
                {bids.map((bid) => (
                  <div key={bid.id} className="border border-gray-200 rounded-md p-4">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <h4 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{bid.agentName}</h4>
                      <span style={{ 
                        backgroundColor: bid.status === 'accepted' ? '#dcfce7' : '#f3f4f6',
                        color: bid.status === 'accepted' ? '#15803d' : '#4b5563',
                        fontWeight: '500',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        fontSize: '0.875rem'
                      }}>
                        {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '500', color: '#2563eb' }}>
                        {bid.commissionType === 'percentage' 
                          ? `${bid.commissionBaseValue}% commission` 
                          : formatCurrency(bid.commissionBaseValue) + ' flat fee'}
                      </span>
                      {bid.estimatedSavings > 0 && (
                        <span style={{ 
                          backgroundColor: '#dcfce7',
                          color: '#15803d',
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          marginLeft: '0.5rem'
                        }}>
                          Save ~{formatCurrency(bid.estimatedSavings)}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {bid.serviceLevel.charAt(0).toUpperCase() + bid.serviceLevel.slice(1)} Service | 
                        Expected timeline: {bid.expectedTimeline}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {bid.personalPitch}
                    </p>
                    
                    {/* Service-specific details section */}
                    {bid.servicePricingApproach === 'itemized' && (
                      <div style={{ marginTop: '1rem' }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Included Services:</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                          {bid.includedServices.map((serviceId) => (
                            <span 
                              key={serviceId}
                              style={{ 
                                backgroundColor: listing.sellerListing.services && listing.sellerListing.services.mustHave && 
                                  listing.sellerListing.services.mustHave.includes(serviceId) ? '#eff6ff' : '#f0f9ff',
                                border: '1px solid #dbeafe',
                                borderRadius: '9999px',
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.75rem'
                              }}
                            >
                              {serviceNames[serviceId] || serviceId}
                              {bid.services[serviceId] && (
                                <span style={{ marginLeft: '0.25rem', fontWeight: '600' }}>
                                  {formatCurrency(bid.services[serviceId])}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                          <span>Base {bid.commissionType === 'percentage' ? `Commission (${bid.commissionBaseValue}%)` : 'Fee'}:</span>
                          <span>{bid.commissionType === 'percentage' 
                            ? formatCurrency((bid.commissionBaseValue / 100) * listing.sellerListing.priceExpectation)
                            : formatCurrency(bid.commissionBaseValue)
                          }</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                          <span>Additional Services:</span>
                          <span>{formatCurrency(
                            Object.values(bid.services)
                              .filter(price => price !== '')
                              .reduce((sum, price) => sum + parseFloat(price || 0), 0)
                          )}</span>
                        </div>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontSize: '0.875rem', 
                          marginTop: '0.5rem',
                          fontWeight: '600',
                          paddingTop: '0.5rem',
                          borderTop: '1px solid #e5e7eb'
                        }}>
                          <span>Total Estimated Cost:</span>
                          <span>{bid.commissionType === 'percentage' 
                            ? formatCurrency(
                                (bid.commissionBaseValue / 100) * listing.sellerListing.priceExpectation +
                                Object.values(bid.services)
                                  .filter(price => price !== '')
                                  .reduce((sum, price) => sum + parseFloat(price || 0), 0)
                              )
                            : formatCurrency(
                                parseFloat(bid.commissionBaseValue) +
                                Object.values(bid.services)
                                  .filter(price => price !== '')
                                  .reduce((sum, price) => sum + parseFloat(price || 0), 0)
                              )
                          }</span>
                        </div>
                      </div>
                    )}
                    
                    {currentUser && listing.createdBy === currentUser.uid && bid.status !== 'accepted' && (
                      <button
                        onClick={async () => {
                          try {
                            // Accept this bid
                            await updateDoc(doc(db, 'bids', bid.id), {
                              status: 'accepted'
                            });
                            
                            // Update the listing status
                            await updateDoc(doc(db, 'listings', listingId), {
                              status: 'pending',
                              selectedBid: bid.id
                            });
                            
                            // Refresh the page
                            window.location.reload();
                          } catch (error) {
                            setError('Error accepting bid: ' + error.message);
                          }
                        }}
                        className="btn btn-primary"
                      >
                        Accept Bid
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No bids yet. Agents will submit their proposals here.</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div className="text-center">
        <p>Unsupported listing type</p>
        <Link to="/seller" className="btn btn-primary mt-4">Back to Listings</Link>
      </div>
    </div>
  );
};

export default SellerListingDetail;