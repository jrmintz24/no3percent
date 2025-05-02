// src/components/agent/AgentListingDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { getTokenBalance, useToken } from '../../firebase/tokenModel';

const AgentListingDetail = () => {
  const { listingId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBidForm, setShowBidForm] = useState(false);
  const [existingBid, setExistingBid] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  
  const [bidData, setBidData] = useState({
    commissionType: 'percentage',
    commissionBaseValue: '',
    serviceLevel: 'custom', // Default to custom for service-based pricing
    personalPitch: '',
    expectedTimeline: '',
    services: {}, // Will hold service ID to price mapping
    includedServices: [], // Will track which services are included in the bid
    servicePricingApproach: 'itemized', // Default to itemized pricing
    buyerAgentBid: {
      preApprovalAssistance: false,
      showingAvailability: '',
      negotiationStrategy: ''
    },
    sellerAgentBid: {
      marketingPlan: '',
      openHouseStrategy: '',
      pricingStrategy: ''
    }
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState('');

  // Define the service options
  const serviceOptions = {
    buyer: [
      { id: 'initialConsultation', name: 'Initial Consultation', description: 'One-on-one meeting to understand buyer goals, timeline, and financial readiness' },
      { id: 'lenderReferral', name: 'Lender Referral', description: 'Connecting buyer with mortgage professionals for pre-approval' },
      { id: 'preApprovalSupport', name: 'Pre-Approval Support', description: 'Reviewing pre-approval letters and explaining implications' },
      { id: 'customPropertySearch', name: 'Custom Property Search', description: 'Tailoring home searches beyond what\'s publicly available (MLS filters, agent networks)' },
      { id: 'propertyPreScreening', name: 'Property Pre-Screening', description: 'Reviewing and vetting listings based on buyer criteria' },
      { id: 'schedulingShowings', name: 'Scheduling Showings', description: 'Coordinating property tours' },
      { id: 'accompaniedShowings', name: 'Accompanied Showings', description: 'Physically attending showings with the buyer and offering commentary' },
      { id: 'neighborhoodInsights', name: 'Neighborhood Insights', description: 'Providing market stats, school info, and community guidance' },
      { id: 'comparativeMarketAnalysis', name: 'Comparative Market Analysis (CMA)', description: 'Creating a pricing analysis to help buyers determine fair market value before making an offer' },
      { id: 'offerStrategy', name: 'Offer Strategy & Advice', description: 'Consulting on offer structure, price, terms, and contingencies' },
      { id: 'draftingOffer', name: 'Drafting and Submitting Offer', description: 'Writing and submitting the official purchase offer contract' },
      { id: 'offerNegotiation', name: 'Offer Negotiation', description: 'Negotiating on behalf of buyer for better price/terms' },
      { id: 'contractReview', name: 'Contract Review', description: 'Reviewing and explaining terms of all documents' },
      { id: 'inspectionSupport', name: 'Inspection Support', description: 'Referring inspectors, attending inspection, reviewing reports' },
      { id: 'repairRequestGuidance', name: 'Repair Request Guidance', description: 'Advising on what to request and how to negotiate repairs' },
      { id: 'transactionCoordination', name: 'Transaction Coordination', description: 'Keeping track of key dates and paperwork' },
      { id: 'closingPreparation', name: 'Closing Preparation', description: 'Reviewing final documents and disclosures' },
      { id: 'finalWalkthroughSupport', name: 'Final Walkthrough Support', description: 'Joining buyer to ensure property is in agreed-upon condition' },
      { id: 'postCloseVendorReferrals', name: 'Post-Close Vendor Referrals', description: 'Referring movers, contractors, cleaners, etc.' }
    ],
    seller: [
      { id: 'pricingStrategy', name: 'Pricing Strategy / CMA', description: 'Creating a detailed market analysis to help set list price' },
      { id: 'homePreparationAdvice', name: 'Home Preparation Advice', description: 'Recommending improvements, staging, and prep for sale' },
      { id: 'professionalPhotography', name: 'Professional Photography', description: 'Arranging for high-quality photos and visual assets' },
      { id: 'virtualTour', name: 'Virtual Tour / 3D Walkthrough', description: 'Providing immersive online viewing experiences' },
      { id: 'mlsListing', name: 'MLS Listing + Syndication', description: 'Creating and managing a professional listing on MLS + platforms like Zillow, Redfin, Realtor.com' },
      { id: 'openHouseHosting', name: 'Open House Hosting', description: 'Planning and managing open houses' },
      { id: 'showingCoordination', name: 'Showing Coordination', description: 'Scheduling and tracking buyer visits' },
      { id: 'lockboxInstallation', name: 'Lockbox Installation & Access Control', description: 'Managing secure access to property' },
      { id: 'buyerScreening', name: 'Buyer Screening', description: 'Verifying buyer financing, motivation, and seriousness' },
      { id: 'offerReview', name: 'Offer Review & Strategy', description: 'Reviewing incoming offers and discussing best responses' },
      { id: 'counterofferDrafting', name: 'Counteroffer Drafting', description: 'Writing and submitting counteroffers' },
      { id: 'negotiationOfTerms', name: 'Negotiation of Terms', description: 'Securing favorable pricing, timing, and contingencies' },
      { id: 'inspectionNegotiation', name: 'Inspection Negotiation', description: 'Handling repair/credit requests after buyer inspections' },
      { id: 'contractCoordination', name: 'Contract Coordination', description: 'Tracking all documents and legal obligations' },
      { id: 'closingPrep', name: 'Closing Prep & Walkthrough Coordination', description: 'Ensuring smooth transition, timing, and keys transfer' },
      { id: 'postSaleSupport', name: 'Post-Sale Support', description: 'Transition to move-out, referrals to professionals' }
    ]
  };

  // Map to store display names of services
  const serviceNames = {
    // Buyer service names
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
    postCloseVendorReferrals: 'Post-Close Vendor Referrals',
    
    // Seller service names
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
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    
    // Make sure user is an agent
    if (userProfile && userProfile.userType !== 'agent') {
      navigate('/');
      return;
    }
    
    const fetchListing = async () => {
      try {
        // Get the listing
        const listingRef = doc(db, 'listings', listingId);
        const listingSnap = await getDoc(listingRef);
        
        if (listingSnap.exists()) {
          setListing({
            id: listingSnap.id,
            ...listingSnap.data()
          });
        } else {
          setError('Listing not found');
        }
        
        // Check if the agent already has a bid on this listing
        const bidsQuery = query(
          collection(db, 'bids'),
          where('listingId', '==', listingId),
          where('agentId', '==', currentUser.uid)
        );
        
        const bidsSnap = await getDocs(bidsQuery);
        if (!bidsSnap.empty) {
          setExistingBid({
            id: bidsSnap.docs[0].id,
            ...bidsSnap.docs[0].data()
          });
        }
        
        // Get token balance
        const balance = await getTokenBalance(currentUser.uid);
        setTokenBalance(balance);
      } catch (error) {
        setError('Error fetching listing: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListing();
  }, [listingId, currentUser, userProfile, navigate]);

  const handleBidChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('buyerAgentBid.')) {
      const field = name.split('.')[1];
      setBidData({
        ...bidData,
        buyerAgentBid: {
          ...bidData.buyerAgentBid,
          [field]: type === 'checkbox' ? checked : value
        }
      });
    } else if (name.includes('sellerAgentBid.')) {
      const field = name.split('.')[1];
      setBidData({
        ...bidData,
        sellerAgentBid: {
          ...bidData.sellerAgentBid,
          [field]: value
        }
      });
    } else {
      setBidData({
        ...bidData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  // Add service pricing handling
  const handleServicePriceChange = (serviceId, price) => {
    setBidData({
      ...bidData,
      services: {
        ...bidData.services,
        [serviceId]: price
      }
    });
  };

  const handleServiceInclusion = (serviceId, included) => {
    if (included) {
      setBidData({
        ...bidData,
        includedServices: [...bidData.includedServices, serviceId]
      });
    } else {
      setBidData({
        ...bidData,
        includedServices: bidData.includedServices.filter(id => id !== serviceId),
        services: {
          ...bidData.services,
          [serviceId]: '' // Clear price when service is removed
        }
      });
    }
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser || !userProfile) {
      setBidError('You must be signed in as an agent to submit a bid');
      return;
    }
    
    // Basic validation
    if (bidData.commissionBaseValue === '') {
      setBidError('Please enter a commission value');
      return;
    }
    
    if (bidData.personalPitch.trim() === '') {
      setBidError('Please provide a personal pitch');
      return;
    }
    
    try {
      setSubmitting(true);
      setBidError('');
      
      // Check if the agent has enough tokens
      const tokenBalance = await getTokenBalance(currentUser.uid);
      
      if (tokenBalance <= 0 && !existingBid) {
        setBidError('You don\'t have enough bid tokens. Please purchase more tokens to submit bids.');
        setSubmitting(false);
        return;
      }
      
      // Get the price expectation based on listing type
      const priceExpectation = listing.listingType === 'buyer' 
        ? listing.buyerListing.budget.max 
        : listing.sellerListing.priceExpectation;
      
      // Calculate estimated savings compared to traditional model
      const traditionalRate = listing.listingType === 'buyer' ? 2.5 : 5.0; // 5% for seller, 2.5% for buyer
      const estSavings = bidData.commissionType === 'percentage' 
        ? ((traditionalRate - parseFloat(bidData.commissionBaseValue)) / 100) * priceExpectation 
        : (traditionalRate / 100) * priceExpectation - parseFloat(bidData.commissionBaseValue);
      
      // Prepare the bid data
      const newBid = {
        listingId,
        agentId: currentUser.uid,
        agentName: userProfile.displayName,
        agentEmail: currentUser.email,
        createdAt: serverTimestamp(),
        status: 'pending',
        commissionType: bidData.commissionType,
        commissionBaseValue: parseFloat(bidData.commissionBaseValue),
        serviceLevel: bidData.serviceLevel,
        servicePricingApproach: bidData.servicePricingApproach,
        services: bidData.services,
        includedServices: bidData.includedServices,
        personalPitch: bidData.personalPitch,
        expectedTimeline: bidData.expectedTimeline,
        estimatedSavings: Math.max(0, estSavings)
      };
      
      // Add listing type specific data
      if (listing.listingType === 'buyer') {
        newBid.buyerAgentBid = {
          preApprovalAssistance: bidData.buyerAgentBid.preApprovalAssistance,
          showingAvailability: bidData.buyerAgentBid.showingAvailability,
          negotiationStrategy: bidData.buyerAgentBid.negotiationStrategy
        };
      } else if (listing.listingType === 'seller') {
        newBid.sellerAgentBid = {
          marketingPlan: bidData.sellerAgentBid.marketingPlan,
          openHouseStrategy: bidData.sellerAgentBid.openHouseStrategy,
          pricingStrategy: bidData.sellerAgentBid.pricingStrategy
        };
      }
      
      let bidDocRef;
      
      if (existingBid) {
        // Update existing bid
        bidDocRef = doc(db, 'bids', existingBid.id);
        await updateDoc(bidDocRef, newBid);
      } else {
        // Create new bid
        bidDocRef = await addDoc(collection(db, 'bids'), newBid);
        
        // Increment bid count on the listing
        await updateDoc(doc(db, 'listings', listingId), {
          bidCount: increment(1)
        });
        
        // Use a token for the bid
        const tokenUsed = await useToken(currentUser.uid, listingId);
        
        if (!tokenUsed) {
          // Token usage failed, but the bid was already created
          // In a real app, you'd want to rollback the bid creation
          setBidError('Error using token: You don\'t have enough tokens. Your bid was created, but please purchase more tokens for future bids.');
        }
      }
      
      // Hide bid form and refresh data
      setShowBidForm(false);
      window.location.reload();
    } catch (error) {
      setBidError('Error submitting bid: ' + error.message);
    } finally {
      setSubmitting(false);
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
        <Link to="/agent" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <div className="text-center">
          <p>Listing not found</p>
          <Link to="/agent" className="btn btn-primary mt-4">Back to Dashboard</Link>
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
          <div>
            <Link to="/agent" className="btn">Back to Dashboard</Link>
          </div>
        </div>
        
        <div className="card" style={{ marginBottom: '2rem' }}>
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
            <p style={{ marginBottom: '0.25rem' }}>
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
          
          {/* Display the requested services section if available */}
          {listing.buyerListing.services && (
            <>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                Requested Services
              </h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Must-Have Services:</p>
                  {listing.buyerListing.services.mustHave && listing.buyerListing.services.mustHave.length > 0 ? (
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
                          {serviceNames[serviceId] || serviceId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>None specified</p>
                  )}
                </div>
                
                <div>
                  <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Nice-to-Have Services:</p>
                  {listing.buyerListing.services.niceToHave && listing.buyerListing.services.niceToHave.length > 0 ? (
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
                          {serviceNames[serviceId] || serviceId}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>None specified</p>
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
        </div>
        
        {/* Token Balance Notice */}
        {!existingBid && (
          <div 
            style={{ 
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: tokenBalance > 0 ? '#f0fdf4' : '#fee2e2',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 'bold', color: tokenBalance > 0 ? '#15803d' : '#b91c1c' }}>
                  {tokenBalance > 0 
                    ? `You have ${tokenBalance} bid token${tokenBalance !== 1 ? 's' : ''} available.` 
                    : 'You have no bid tokens available.'}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Each bid requires 1 token.
                </p>
              </div>
              {tokenBalance <= 0 && (
                <Link to="/agent/buy-tokens" className="btn btn-primary">
                  Buy Tokens
                </Link>
              )}
            </div>
          </div>
        )}
        
        {/* Buyer Bid section */}
        <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Submit Your Bid
          </h3>
          
          {existingBid && !showBidForm ? (
            <div>
              <div style={{ 
                backgroundColor: '#f0f9ff',
                border: '1px solid #e0f2fe',
                borderRadius: '0.375rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Your Current Bid
                </h4>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>Commission: </span>
                  {existingBid.commissionType === 'percentage' 
                    ? `${existingBid.commissionBaseValue}%` 
                    : formatCurrency(existingBid.commissionBaseValue) + ' flat fee'}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>Service Level: </span>
                  {existingBid.serviceLevel.charAt(0).toUpperCase() + existingBid.serviceLevel.slice(1)}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '500' }}>Status: </span>
                  <span style={{ 
                    backgroundColor: existingBid.status === 'accepted' ? '#dcfce7' : '#f3f4f6',
                    color: existingBid.status === 'accepted' ? '#15803d' : '#4b5563',
                    fontWeight: '500',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    {existingBid.status.charAt(0).toUpperCase() + existingBid.status.slice(1)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowBidForm(true)}
                className="btn btn-primary"
              >
                Update Your Bid
              </button>
            </div>
          ) : showBidForm || !existingBid ? (
            <form onSubmit={handleBidSubmit}>
              {bidError && (
                <div style={{ 
                  backgroundColor: '#fee2e2', 
                  color: '#b91c1c', 
                  padding: '1rem', 
                  borderRadius: '0.375rem', 
                  marginBottom: '1rem' 
                }}>
                  {bidError}
                </div>
              )}
              
              {/* Token warning */}
              {!existingBid && tokenBalance <= 0 && (
                <div style={{ 
                  backgroundColor: '#fee2e2', 
                  color: '#b91c1c', 
                  padding: '1rem', 
                  borderRadius: '0.375rem', 
                  marginBottom: '1rem' 
                }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>No Bid Tokens Available</p>
                  <p>You need at least 1 token to submit a bid. Please purchase tokens to continue.</p>
                  <Link 
                    to="/agent/buy-tokens" 
                    className="btn"
                    style={{ 
                      backgroundColor: '#b91c1c',
                      color: 'white',
                      marginTop: '0.5rem',
                      display: 'inline-block',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      textDecoration: 'none'
                    }}
                  >
                    Buy Tokens
                  </Link>
                </div>
              )}
              
              {/* Service-based pricing section */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                  Service-Based Pricing
                </h4>
                <p style={{ marginBottom: '1rem' }}>
                  The buyer has indicated their service preferences below. 
                  Set your pricing for each service to create a customized proposal.
                </p>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Base Commission Approach
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ 
                      flex: 1, 
                      padding: '1rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.375rem',
                      backgroundColor: bidData.commissionType === 'percentage' ? '#eff6ff' : 'white',
                      borderColor: bidData.commissionType === 'percentage' ? '#2563eb' : '#e5e7eb',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        name="commissionType" 
                        value="percentage" 
                        checked={bidData.commissionType === 'percentage'}
                        onChange={handleBidChange}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Percentage of Purchase Price
                    </label>
                    <label style={{ 
                      flex: 1, 
                      padding: '1rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.375rem',
                      backgroundColor: bidData.commissionType === 'flatFee' ? '#eff6ff' : 'white',
                      borderColor: bidData.commissionType === 'flatFee' ? '#2563eb' : '#e5e7eb',
                      cursor: 'pointer'
                    }}>
                      <input 
                        type="radio" 
                        name="commissionType" 
                        value="flatFee" 
                        checked={bidData.commissionType === 'flatFee'}
                        onChange={handleBidChange}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Flat Fee
                    </label>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    {bidData.commissionType === 'percentage' ? 'Base Commission Rate (%)' : 'Base Fee Amount ($)'}
                  </label>
                  <input 
                    type="number"
                    name="commissionBaseValue"
                    value={bidData.commissionBaseValue}
                    onChange={handleBidChange}
                    min={bidData.commissionType === 'percentage' ? "0.1" : "1"}
                    step={bidData.commissionType === 'percentage' ? "0.1" : "100"}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.375rem'
                    }}
                  />
                  {bidData.commissionType === 'percentage' && bidData.commissionBaseValue && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      Estimated base commission: {formatCurrency((parseFloat(bidData.commissionBaseValue) / 100) * listing.buyerListing.budget.max)}
                      {' '}(based on maximum budget)
                    </p>
                  )}
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <h5 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
                    Service-Specific Pricing
                  </h5>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '500', marginRight: '1rem' }}>Services Pricing Approach:</span>
                    <label style={{ marginRight: '1rem' }}>
                      <input
                        type="radio"
                        name="servicePricingApproach"
                        value="included"
                        checked={bidData.servicePricingApproach === 'included'}
                        onChange={(e) => setBidData({...bidData, servicePricingApproach: e.target.value})}
                        style={{ marginRight: '0.5rem' }}
                      />
                      All Included in Base Fee
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="servicePricingApproach"
                        value="itemized"
                        checked={bidData.servicePricingApproach === 'itemized'}
                        onChange={(e) => setBidData({...bidData, servicePricingApproach: e.target.value})}
                        style={{ marginRight: '0.5rem' }}
                      />
                      Itemized Per Service
                    </label>
                  </div>
                  
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500' }}>Service</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '500' }}>Buyer's Preference</th>
                          <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '500' }}>Include?</th>
                          {bidData.servicePricingApproach === 'itemized' && (
                            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>Your Price ($)</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {serviceOptions.buyer.map((service) => {
                          const isMustHave = listing.buyerListing.services && listing.buyerListing.services.mustHave 
                            ? listing.buyerListing.services.mustHave.includes(service.id) : false;
                          const isNiceToHave = listing.buyerListing.services && listing.buyerListing.services.niceToHave 
                            ? listing.buyerListing.services.niceToHave.includes(service.id) : false;
                          const isRequested = isMustHave || isNiceToHave;
                          
                          return (
                            <tr key={service.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '0.75rem' }}>
                                <div style={{ fontWeight: '500' }}>{service.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{service.description}</div>
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                {isMustHave ? (
                                  <span style={{ 
                                    backgroundColor: '#eff6ff',
                                    color: '#2563eb',
                                    fontWeight: '500',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem'
                                  }}>
                                    Must Have
                                  </span>
                                ) : isNiceToHave ? (
                                  <span style={{ 
                                    backgroundColor: '#f0f9ff',
                                    color: '#0891b2',
                                    fontWeight: '500',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem'
                                  }}>
                                    Nice to Have
                                  </span>
                                ) : (
                                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Not Requested</span>
                                )}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={bidData.includedServices.includes(service.id)}
                                  onChange={(e) => handleServiceInclusion(service.id, e.target.checked)}
                                  disabled={isMustHave && bidData.servicePricingApproach === 'itemized'} // Must-haves can't be excluded
                                />
                              </td>
                              {bidData.servicePricingApproach === 'itemized' && (
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={bidData.services[service.id] || ''}
                                    onChange={(e) => handleServicePriceChange(service.id, e.target.value)}
                                    disabled={!bidData.includedServices.includes(service.id)}
                                    style={{ 
                                      width: '100px', 
                                      padding: '0.5rem', 
                                      border: '1px solid #e5e7eb', 
                                      borderRadius: '0.25rem',
                                      textAlign: 'right'
                                    }}
                                  />
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                      {bidData.servicePricingApproach === 'itemized' && (
                        <tfoot>
                          <tr style={{ backgroundColor: '#f9fafb', fontWeight: '500' }}>
                            <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right' }}>
                              Total for Itemized Services:
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              {formatCurrency(
                                Object.values(bidData.services)
                                  .filter(price => price !== '')
                                  .reduce((sum, price) => sum + parseFloat(price || 0), 0)
                              )}
                            </td>
                          </tr>
                          <tr style={{ backgroundColor: '#eff6ff', fontWeight: '700' }}>
                            <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right' }}>
                              Estimated Total (Base {bidData.commissionType === 'percentage' ? 'Commission' : 'Fee'} + Itemized Services):
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#2563eb' }}>
                              {bidData.commissionType === 'percentage' 
                                ? formatCurrency(
                                    (parseFloat(bidData.commissionBaseValue || 0) / 100) * listing.buyerListing.budget.max +
                                    Object.values(bidData.services)
                                      .filter(price => price !== '')
                                      .reduce((sum, price) => sum + parseFloat(price || 0), 0)
                                  )
                                : formatCurrency(
                                    parseFloat(bidData.commissionBaseValue || 0) +
                                    Object.values(bidData.services)
                                      .filter(price => price !== '')
                                      .reduce((sum, price) => sum + parseFloat(price || 0), 0)
                                  )
                              }
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Personal Pitch
                </label>
                <textarea
                  name="personalPitch"
                  value={bidData.personalPitch}
                  onChange={handleBidChange}
                  required
                  rows={4}
                  placeholder="Explain why you're the right agent for this buyer..."
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem'
                  }}
                ></textarea>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Expected Timeline
                </label>
                <select
                  name="expectedTimeline"
                  value={bidData.expectedTimeline}
                  onChange={handleBidChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="1-2 months">1-2 months</option>
                  <option value="3-4 months">3-4 months</option>
                  <option value="4-6 months">4-6 months</option>
                  <option value="6+ months">6+ months</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Showing Availability
                </label>
                <select
                  name="buyerAgentBid.showingAvailability"
                  value={bidData.buyerAgentBid.showingAvailability}
                  onChange={handleBidChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem'
                  }}
                >
                  <option value="">Select</option>
                  <option value="Weekdays">Weekdays only</option>
                  <option value="Evenings">Evenings only</option>
                  <option value="Weekends">Weekends only</option>
                  <option value="Weekdays and Evenings">Weekdays and Evenings</option>
                  <option value="Weekdays and Weekends">Weekdays and Weekends</option>
                  <option value="Flexible - 7 days a week">Flexible - 7 days a week</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Negotiation Strategy
                </label>
                <textarea
                  name="buyerAgentBid.negotiationStrategy"
                  value={bidData.buyerAgentBid.negotiationStrategy}
                  onChange={handleBidChange}
                  required
                  rows={3}
                  placeholder="Describe your approach to negotiations..."
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem'
                  }}
                ></textarea>
              </div>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input 
                    type="checkbox"
                    name="buyerAgentBid.preApprovalAssistance"
                    checked={bidData.buyerAgentBid.preApprovalAssistance}
                    onChange={handleBidChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  I can help with mortgage pre-approval
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  disabled={submitting || (!existingBid && tokenBalance <= 0)}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {submitting ? 'Submitting...' : existingBid ? 'Update Bid' : 'Submit Bid'}
                </button>
                {showBidForm && (
                  <button
                    type="button"
                    onClick={() => setShowBidForm(false)}
                    className="btn"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p>Ready to submit a bid for this listing?</p>
              {tokenBalance > 0 ? (
                <button
                  onClick={() => setShowBidForm(true)}
                  className="btn btn-primary mt-4"
                >
                  Submit a Bid (1 Token)
                </button>
              ) : (
                <div>
                  <p style={{ color: '#b91c1c', marginBottom: '1rem' }}>
                    You need at least 1 token to submit a bid.
                  </p>
                  <Link to="/agent/buy-tokens" className="btn btn-primary">
                    Buy Tokens
                  </Link>
                </div>
              )}
            </div>
          )}
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
          <div>
            <Link to="/agent" className="btn">Back to Dashboard</Link>
          </div>
        </div>
        
        <div className="card" style={{ marginBottom: '2rem' }}>
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
            <p style={{ marginBottom: '0.25rem' }}>
              <span style={{ color: '#6b7280' }}>Created by:</span> {listing.creatorName || 'Anonymous'}
            </p>
            <p>
              <span style={{ color: '#6b7280' }}>Date:</span> {listing.createdAt?.toDate().toLocaleDateString() || 'Unknown'}
            </p>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
            Property Details
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280' }}>Expected Price:</p>
              <p>{formatCurrency(listing.sellerListing.priceExpectation)}</p>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280' }}>Location:</p>
              <p>{listing.sellerListing.location.address}</p>
              <p>{listing.sellerListing.location.city}, {listing.sellerListing.location.state} {listing.sellerListing.location.zipCode}</p>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ color: '#6b7280' }}>Property Type:</p>
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
          
          {/* Display the requested services section if available */}
{listing.sellerListing.services && (
  <>
    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
      Requested Services
    </h3>
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Must-Have Services:</p>
        {listing.sellerListing.services.mustHave && listing.sellerListing.services.mustHave.length > 0 ? (
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
          <p>None specified</p>
        )}
      </div>
      
      <div>
        <p style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Nice-to-Have Services:</p>
        {listing.sellerListing.services.niceToHave && listing.sellerListing.services.niceToHave.length > 0 ? (
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
          <p>None specified</p>
        )}
      </div>
    </div>
  </>
          )}
          </div>
          
          {/* Token Balance Notice */}
          {!existingBid && (
            <div 
              style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: tokenBalance > 0 ? '#f0fdf4' : '#fee2e2',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 'bold', color: tokenBalance > 0 ? '#15803d' : '#b91c1c' }}>
                    {tokenBalance > 0 
                      ? `You have ${tokenBalance} bid token${tokenBalance !== 1 ? 's' : ''} available.` 
                      : 'You have no bid tokens available.'}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Each bid requires 1 token.
                  </p>
                </div>
                {tokenBalance <= 0 && (
                  <Link to="/agent/buy-tokens" className="btn btn-primary">
                    Buy Tokens
                  </Link>
                )}
              </div>
            </div>
          )}
          
          {/* Seller Bid section */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
              Submit Your Bid
            </h3>
            
            {existingBid && !showBidForm ? (
              <div>
                <div style={{ 
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #e0f2fe',
                  borderRadius: '0.375rem',
                  padding: '1rem',
                  marginBottom: '1.5rem'
                }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    Your Current Bid
                  </h4>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '500' }}>Commission: </span>
                    {existingBid.commissionType === 'percentage' 
                      ? `${existingBid.commissionBaseValue}%` 
                      : formatCurrency(existingBid.commissionBaseValue) + ' flat fee'}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '500' }}>Service Level: </span>
                    {existingBid.serviceLevel.charAt(0).toUpperCase() + existingBid.serviceLevel.slice(1)}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '500' }}>Status: </span>
                    <span style={{ 
                      backgroundColor: existingBid.status === 'accepted' ? '#dcfce7' : '#f3f4f6',
                      color: existingBid.status === 'accepted' ? '#15803d' : '#4b5563',
                      fontWeight: '500',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      {existingBid.status.charAt(0).toUpperCase() + existingBid.status.slice(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowBidForm(true)}
                  className="btn btn-primary"
                >
                  Update Your Bid
                </button>
              </div>
            ) : showBidForm || !existingBid ? (
              <form onSubmit={handleBidSubmit}>
                {bidError && (
                  <div style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#b91c1c', 
                    padding: '1rem', 
                    borderRadius: '0.375rem', 
                    marginBottom: '1rem' 
                  }}>
                    {bidError}
                  </div>
                )}
                
                {/* Token warning */}
                {!existingBid && tokenBalance <= 0 && (
                  <div style={{ 
                    backgroundColor: '#fee2e2', 
                    color: '#b91c1c', 
                    padding: '1rem', 
                    borderRadius: '0.375rem', 
                    marginBottom: '1rem' 
                  }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>No Bid Tokens Available</p>
                    <p>You need at least 1 token to submit a bid. Please purchase tokens to continue.</p>
                    <Link 
                      to="/agent/buy-tokens" 
                      className="btn"
                      style={{ 
                        backgroundColor: '#b91c1c',
                        color: 'white',
                        marginTop: '0.5rem',
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.25rem',
                        textDecoration: 'none'
                      }}
                    >
                      Buy Tokens
                    </Link>
                  </div>
                )}
                
                {/* Service-based pricing section */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                    Service-Based Pricing
                  </h4>
                  <p style={{ marginBottom: '1rem' }}>
                    The seller has indicated their service preferences below. 
                    Set your pricing for each service to create a customized proposal.
                  </p>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      Base Commission Approach
                    </label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label style={{ 
                        flex: 1, 
                        padding: '1rem', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '0.375rem',
                        backgroundColor: bidData.commissionType === 'percentage' ? '#eff6ff' : 'white',
                        borderColor: bidData.commissionType === 'percentage' ? '#2563eb' : '#e5e7eb',
                        cursor: 'pointer'
                      }}>
                        <input 
                          type="radio" 
                          name="commissionType" 
                          value="percentage" 
                          checked={bidData.commissionType === 'percentage'}
                          onChange={handleBidChange}
                          style={{ marginRight: '0.5rem' }}
                        />
                        Percentage of Sale Price
                      </label>
                      <label style={{ 
                        flex: 1, 
                        padding: '1rem', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '0.375rem',
                        backgroundColor: bidData.commissionType === 'flatFee' ? '#eff6ff' : 'white',
                        borderColor: bidData.commissionType === 'flatFee' ? '#2563eb' : '#e5e7eb',
                        cursor: 'pointer'
                      }}>
                        <input 
                          type="radio" 
                          name="commissionType" 
                          value="flatFee" 
                          checked={bidData.commissionType === 'flatFee'}
                          onChange={handleBidChange}
                          style={{ marginRight: '0.5rem' }}
                        />
                        Flat Fee
                      </label>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                      {bidData.commissionType === 'percentage' ? 'Base Commission Rate (%)' : 'Base Fee Amount ($)'}
                    </label>
                    <input 
                      type="number"
                      name="commissionBaseValue"
                      value={bidData.commissionBaseValue}
                      onChange={handleBidChange}
                      min={bidData.commissionType === 'percentage' ? "0.1" : "1"}
                      step={bidData.commissionType === 'percentage' ? "0.1" : "100"}
                      required
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '0.375rem'
                      }}
                    />
                    {bidData.commissionType === 'percentage' && bidData.commissionBaseValue && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        Estimated base commission: {formatCurrency((parseFloat(bidData.commissionBaseValue) / 100) * listing.sellerListing.priceExpectation)}
                        {' '}(based on expected price)
                      </p>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <h5 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>
                      Service-Specific Pricing
                    </h5>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '500', marginRight: '1rem' }}>Services Pricing Approach:</span>
                      <label style={{ marginRight: '1rem' }}>
                        <input
                          type="radio"
                          name="servicePricingApproach"
                          value="included"
                          checked={bidData.servicePricingApproach === 'included'}
                          onChange={(e) => setBidData({...bidData, servicePricingApproach: e.target.value})}
                          style={{ marginRight: '0.5rem' }}
                        />
                        All Included in Base Fee
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="servicePricingApproach"
                          value="itemized"
                          checked={bidData.servicePricingApproach === 'itemized'}
                          onChange={(e) => setBidData({...bidData, servicePricingApproach: e.target.value})}
                          style={{ marginRight: '0.5rem' }}
                        />
                        Itemized Per Service
                      </label>
                    </div>
                    
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.375rem', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500' }}>Service</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '500' }}>Seller's Preference</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '500' }}>Include?</th>
                            {bidData.servicePricingApproach === 'itemized' && (
                              <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>Your Price ($)</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {serviceOptions.seller.map((service) => {
                            const isMustHave = listing.sellerListing.services && listing.sellerListing.services.mustHave 
                              ? listing.sellerListing.services.mustHave.includes(service.id) : false;
                            const isNiceToHave = listing.sellerListing.services && listing.sellerListing.services.niceToHave 
                              ? listing.sellerListing.services.niceToHave.includes(service.id) : false;
                            const isRequested = isMustHave || isNiceToHave;
                            
                            return (
                              <tr key={service.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem' }}>
                                  <div style={{ fontWeight: '500' }}>{service.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{service.description}</div>
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {isMustHave ? (
                                    <span style={{ 
                                      backgroundColor: '#eff6ff',
                                      color: '#2563eb',
                                      fontWeight: '500',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem'
                                    }}>
                                      Must Have
                                    </span>
                                  ) : isNiceToHave ? (
                                    <span style={{ 
                                      backgroundColor: '#f0f9ff',
                                      color: '#0891b2',
                                      fontWeight: '500',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem'
                                    }}>
                                      Nice to Have
                                    </span>
                                  ) : (
                                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Not Requested</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  <input
                                    type="checkbox"
                                    checked={bidData.includedServices.includes(service.id)}
                                    onChange={(e) => handleServiceInclusion(service.id, e.target.checked)}
                                    disabled={isMustHave && bidData.servicePricingApproach === 'itemized'} // Must-haves can't be excluded
                                  />
                                </td>
                                {bidData.servicePricingApproach === 'itemized' && (
                                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                    <input
                                      type="number"
                                      min="0"
                                      step="10"
                                      value={bidData.services[service.id] || ''}
                                      onChange={(e) => handleServicePriceChange(service.id, e.target.value)}
                                      disabled={!bidData.includedServices.includes(service.id)}
                                      style={{ 
                                        width: '100px', 
                                        padding: '0.5rem', 
                                        border: '1px solid #e5e7eb', 
                                        borderRadius: '0.25rem',
                                        textAlign: 'right'
                                      }}
                                    />
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                        {bidData.servicePricingApproach === 'itemized' && (
                          <tfoot>
                            <tr style={{ backgroundColor: '#f9fafb', fontWeight: '500' }}>
                              <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right' }}>
                                Total for Itemized Services:
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                {formatCurrency(
                                  Object.values(bidData.services)
                                    .filter(price => price !== '')
                                    .reduce((sum, price) => sum + parseFloat(price || 0), 0)
                                )}
                              </td>
                            </tr>
                            <tr style={{ backgroundColor: '#eff6ff', fontWeight: '700' }}>
                              <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right' }}>
                                Estimated Total (Base {bidData.commissionType === 'percentage' ? 'Commission' : 'Fee'} + Itemized Services):
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#2563eb' }}>
                                {bidData.commissionType === 'percentage' 
                                  ? formatCurrency(
                                      (parseFloat(bidData.commissionBaseValue || 0) / 100) * listing.sellerListing.priceExpectation +
                                      Object.values(bidData.services)
                                        .filter(price => price !== '')
                                        .reduce((sum, price) => sum + parseFloat(price || 0), 0)
                                    )
                                  : formatCurrency(
                                      parseFloat(bidData.commissionBaseValue || 0) +
                                      Object.values(bidData.services)
                                        .filter(price => price !== '')
                                        .reduce((sum, price) => sum + parseFloat(price || 0), 0)
                                    )
                                }
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Personal Pitch
                  </label>
                  <textarea
                    name="personalPitch"
                    value={bidData.personalPitch}
                    onChange={handleBidChange}
                    required
                    rows={4}
                    placeholder="Explain why you're the right agent for this seller..."
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.375rem'
                    }}
                  ></textarea>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Expected Timeline
                  </label>
                  <select
                    name="expectedTimeline"
                    value={bidData.expectedTimeline}
                    onChange={handleBidChange}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.375rem'
                    }}
                  >
                    <option value="">Select</option>
                    <option value="1-2 months">1-2 months</option>
                    <option value="3-4 months">3-4 months</option>
                    <option value="4-6 months">4-6 months</option>
                    <option value="6+ months">6+ months</option>
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Marketing Plan
                  </label>
                  <textarea
                    name="sellerAgentBid.marketingPlan"
                    value={bidData.sellerAgentBid.marketingPlan}
                    onChange={handleBidChange}
                    required
                    rows={3}
                    placeholder="Describe your marketing strategy for this property..."
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.375rem'
                    }}
                  ></textarea>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Open House Strategy
                  </label>
                  <textarea
                    name="sellerAgentBid.openHouseStrategy"
                    value={bidData.sellerAgentBid.openHouseStrategy}
                    onChange={handleBidChange}
                    required
                    rows={3}
                    placeholder="Describe your approach to open houses..."
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.375rem'
                    }}
                  ></textarea>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Pricing Strategy
                  </label>
                  <textarea
                    name="sellerAgentBid.pricingStrategy"
                    value={bidData.sellerAgentBid.pricingStrategy}
                    onChange={handleBidChange}
                    required
                    rows={3}
                    placeholder="Explain your pricing strategy and recommendations..."
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.375rem'
                    }}
                  ></textarea>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={submitting || (!existingBid && tokenBalance <= 0)}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {submitting ? 'Submitting...' : existingBid ? 'Update Bid' : 'Submit Bid'}
                  </button>
                  {showBidForm && (
                    <button
                      type="button"
                      onClick={() => setShowBidForm(false)}
                      className="btn"
                      style={{ flex: 1 }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="text-center">
                <p>Ready to submit a bid for this listing?</p>
                {tokenBalance > 0 ? (
                  <button
                    onClick={() => setShowBidForm(true)}
                    className="btn btn-primary mt-4"
                  >
                    Submit a Bid (1 Token)
                  </button>
                ) : (
                  <div>
                    <p style={{ color: '#b91c1c', marginBottom: '1rem' }}>
                      You need at least 1 token to submit a bid.
                    </p>
                    <Link to="/agent/buy-tokens" className="btn btn-primary">
                      Buy Tokens
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Handle other listing types in the future
    return (
      <div className="container" style={{ padding: '3rem 0' }}>
        <div className="text-center">
          <p>Unsupported listing type</p>
          <Link to="/agent" className="btn btn-primary mt-4">Back to Dashboard</Link>
        </div>
      </div>
    );
  };
  
  export default AgentListingDetail;