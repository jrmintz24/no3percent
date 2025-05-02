// src/components/listings/ListingDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

const ListingDetail = () => {
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
    initialConsultation: 'Initial Consultation',
    lenderReferral: 'Lender Referral',
    preApprovalSupport: 'Pre-Approval Support',
    customPropertySearch: 'Custom Property Search',
    propertyPreScreening: 'Property Pre-Screening',
    schedulingShowings: 'Scheduling Showings',
    accompaniedShowings: 'Accompanied Showings',
    neighborhoodInsights: 'Neighborhood Insights',
    comparativeMarketAnalysis: 'Comparative Market Analysis (CMA)',
    offerStrategy: 'Offer Strategy & Advice',
    draftingOffer: 'Drafting and Submitting Offer',
    offerNegotiation: 'Offer Negotiation',
    contractReview: 'Contract Review',
    inspectionSupport: 'Inspection Support',
    repairRequestGuidance: 'Repair Request Guidance',
    transactionCoordination: 'Transaction Coordination',
    closingPreparation: 'Closing Preparation',
    finalWalkthroughSupport: 'Final Walkthrough Support',
    postCloseVendorReferrals: 'Post-Close Vendor Referrals'
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
      navigate('/buyer');
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
        <Link to="/buyer" className="btn btn-primary">Back to Listings</Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <div className="text-center">
          <p>Listing not found</p>
          <Link to="/buyer" className="btn btn-primary mt-4">Back to Listings</Link>
        </div>
      </div>
    );
  }

  // Handle buyer listing display
  if (listing.listingType === 'buyer') {
    return (
      <div className="container" style={{ maxWidth: '800px', padding: '2rem 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Buyer Listing Details
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/buyer" className="btn">Back to Listings</Link>
            {currentUser && listing.createdBy === currentUser.uid && (
              <>
                <Link to={`/buyer/listings/${listingId}/edit`} className="btn">Edit</Link>
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
            <p>
              <span style={{ color: '#6b7280' }}>Created by:</span> {listing.creatorName || 'Anonymous'}
            </p>
            <p>
              <span style={{ color: '#6b7280' }}>Date:</span> {listing.createdAt?.toDate().toLocaleDateString() || 'Unknown'}
            </p>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Budget
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <p>{formatCurrency(listing.buyerListing.budget.min)} - {formatCurrency(listing.buyerListing.budget.max)}</p>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Location
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <p>{listing.buyerListing.location.city}, {listing.buyerListing.location.state}</p>
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Zip Codes:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {listing.buyerListing.location.zipCodes.map((zip) => (
                  <span 
                    key={zip}
                    style={{ 
                      backgroundColor: '#eff6ff',
                      border: '1px solid #dbeafe',
                      borderRadius: '9999px',
                      padding: '0.25rem 0.75rem',
                    }}
                  >
                    {zip}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Property Details
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Property Types:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {listing.buyerListing.propertyTypes.map((type) => (
                  <span 
                    key={type}
                    style={{ 
                      backgroundColor: '#eff6ff',
                      border: '1px solid #dbeafe',
                      borderRadius: '9999px',
                      padding: '0.25rem 0.75rem',
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <p style={{ color: '#6b7280' }}>Bedrooms (minimum):</p>
                <p>{listing.buyerListing.bedrooms}+</p>
              </div>
              <div>
                <p style={{ color: '#6b7280' }}>Bathrooms (minimum):</p>
                <p>{listing.buyerListing.bathrooms}+</p>
              </div>
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Features
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Must-Have Features:</p>
              {listing.buyerListing.mustHaveFeatures.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {listing.buyerListing.mustHaveFeatures.map((feature) => (
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
              <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Nice-to-Have Features:</p>
              {listing.buyerListing.niceToHaveFeatures.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {listing.buyerListing.niceToHaveFeatures.map((feature) => (
                    <span 
                      key={feature}
                      style={{ 
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #e0f2fe',
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
          </div>
          
          {/* Add Requested Services section */}
          {listing.buyerListing.services && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                Requested Services
              </h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Must-Have Services:</h4>
                  {listing.buyerListing.services && listing.buyerListing.services.mustHave && listing.buyerListing.services.mustHave.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {listing.buyerListing.services.mustHave.map((serviceId) => (
                        <span 
                          key={serviceId}
                          style={{ 
                            backgroundColor: '#eff6ff',
                            border: '1px solid #dbeafe',
                            borderRadius: '9999px',
                            padding: '0.25rem 0.75rem',
                          }}
                        >
                          {serviceNames[serviceId]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No must-have services specified</p>
                  )}
                </div>
                
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Nice-to-Have Services:</h4>
                  {listing.buyerListing.services && listing.buyerListing.services.niceToHave && listing.buyerListing.services.niceToHave.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {listing.buyerListing.services.niceToHave.map((serviceId) => (
                        <span 
                          key={serviceId}
                          style={{ 
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #e0f2fe',
                            borderRadius: '9999px',
                            padding: '0.25rem 0.75rem',
                          }}
                        >
                          {serviceNames[serviceId]}
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
            Timeline and Notes
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280' }}>Timeline:</p>
              <p>{listing.buyerListing.timeline}</p>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280' }}>Pre-Approved:</p>
              <p>{listing.buyerListing.preApproved ? 'Yes' : 'No'}</p>
            </div>
            
            {listing.buyerListing.additionalNotes && (
              <div>
                <p style={{ color: '#6b7280' }}>Additional Notes:</p>
                <p style={{ whiteSpace: 'pre-line' }}>{listing.buyerListing.additionalNotes}</p>
              </div>
            )}
          </div>
          
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
                        Expected timeline: {bid.expectedTimeline} | 
                        Showings: {bid.buyerAgentBid.showingAvailability}
                        {bid.buyerAgentBid.preApprovalAssistance && ' | Can help with pre-approval'}
                      </span>
                    </div>
                    
                    <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {bid.personalPitch}
                    </p>
                    
                    {/* Add service-specific details section */}
                    {bid.servicePricingApproach === 'itemized' && (
                      <div style={{ marginTop: '1rem' }}>
                        <h5 style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Included Services:</h5>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                          {bid.includedServices.map((serviceId) => (
                            <span 
                              key={serviceId}
                              style={{ 
                                backgroundColor: listing.buyerListing.services && listing.buyerListing.services.mustHave && 
                                  listing.buyerListing.services.mustHave.includes(serviceId) ? '#eff6ff' : '#f0f9ff',
                                border: '1px solid #dbeafe',
                                borderRadius: '9999px',
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.75rem'
                              }}
                            >
                              {serviceNames[serviceId]}
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
                            ? formatCurrency((bid.commissionBaseValue / 100) * listing.buyerListing.budget.max)
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
                                (bid.commissionBaseValue / 100) * listing.buyerListing.budget.max +
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
  
  // Handle other listing types (e.g., seller) in the future
  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div className="text-center">
        <p>Unsupported listing type</p>
        <Link to="/buyer" className="btn btn-primary mt-4">Back to Listings</Link>
      </div>
    </div>
  );
};

export default ListingDetail;