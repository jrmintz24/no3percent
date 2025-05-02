// src/components/buyer/BuyerListingForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const BuyerListingForm = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    budgetMin: '',
    budgetMax: '',
    location: {
      city: '',
      state: '',
      zipCodes: []
    },
    propertyTypes: [],
    bedrooms: '',
    bathrooms: '',
    mustHaveFeatures: [],
    niceToHaveFeatures: [],
    timeline: '',
    additionalNotes: '',
    preApproved: false,
    // New fields for services
    services: {
      mustHave: [],
      niceToHave: []
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zipInput, setZipInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [niceFeatureInput, setNiceFeatureInput] = useState('');
  
  const propertyTypeOptions = [
    'Single Family Home',
    'Townhouse',
    'Condo',
    'Multi-Family',
    'Land',
    'Other'
  ];
  
  const timelineOptions = [
    'ASAP (1-2 months)',
    'Soon (3-4 months)',
    'Flexible (4-6 months)',
    'Planning Ahead (6+ months)'
  ];
  
  // Define the service options
  const buyerServiceOptions = [
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
  ];
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handlePropertyTypeChange = (type) => {
    const currentTypes = [...formData.propertyTypes];
    
    if (currentTypes.includes(type)) {
      // Remove if already selected
      setFormData({
        ...formData,
        propertyTypes: currentTypes.filter(t => t !== type)
      });
    } else {
      // Add if not selected
      setFormData({
        ...formData,
        propertyTypes: [...currentTypes, type]
      });
    }
  };
  
  const addZipCode = () => {
    if (zipInput && !formData.location.zipCodes.includes(zipInput)) {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          zipCodes: [...formData.location.zipCodes, zipInput]
        }
      });
      setZipInput('');
    }
  };
  
  const removeZipCode = (zip) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        zipCodes: formData.location.zipCodes.filter(z => z !== zip)
      }
    });
  };
  
  const addFeature = () => {
    if (featureInput && !formData.mustHaveFeatures.includes(featureInput)) {
      setFormData({
        ...formData,
        mustHaveFeatures: [...formData.mustHaveFeatures, featureInput]
      });
      setFeatureInput('');
    }
  };
  
  const removeFeature = (feature) => {
    setFormData({
      ...formData,
      mustHaveFeatures: formData.mustHaveFeatures.filter(f => f !== feature)
    });
  };
  
  const addNiceFeature = () => {
    if (niceFeatureInput && !formData.niceToHaveFeatures.includes(niceFeatureInput)) {
      setFormData({
        ...formData,
        niceToHaveFeatures: [...formData.niceToHaveFeatures, niceFeatureInput]
      });
      setNiceFeatureInput('');
    }
  };
  
  const removeNiceFeature = (feature) => {
    setFormData({
      ...formData,
      niceToHaveFeatures: formData.niceToHaveFeatures.filter(f => f !== feature)
    });
  };
  
  // Add service selection handling
  const handleServiceSelection = (serviceId, type) => {
    const currentMustHave = [...formData.services.mustHave];
    const currentNiceToHave = [...formData.services.niceToHave];
    
    // If already in must-have and switching to nice-to-have
    if (type === 'niceToHave' && currentMustHave.includes(serviceId)) {
      setFormData({
        ...formData,
        services: {
          mustHave: currentMustHave.filter(id => id !== serviceId),
          niceToHave: [...currentNiceToHave, serviceId]
        }
      });
    } 
    // If already in nice-to-have and switching to must-have
    else if (type === 'mustHave' && currentNiceToHave.includes(serviceId)) {
      setFormData({
        ...formData,
        services: {
          mustHave: [...currentMustHave, serviceId],
          niceToHave: currentNiceToHave.filter(id => id !== serviceId)
        }
      });
    }
    // If not in either list and adding
    else if (!currentMustHave.includes(serviceId) && !currentNiceToHave.includes(serviceId)) {
      setFormData({
        ...formData,
        services: {
          ...formData.services,
          [type]: [...formData.services[type], serviceId]
        }
      });
    }
    // If in one of the lists and removing
    else {
      const listToUpdate = type === 'mustHave' ? currentMustHave : currentNiceToHave;
      setFormData({
        ...formData,
        services: {
          ...formData.services,
          [type]: listToUpdate.filter(id => id !== serviceId)
        }
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be signed in to create a listing');
      return;
    }
    
    // Add this check
    if (!userProfile) {
      setError('User profile is not fully loaded yet. Please try again in a moment.');
      return;
    }
    
    if (formData.propertyTypes.length === 0) {
      setError('Please select at least one property type');
      return;
    }
    
    if (formData.location.zipCodes.length === 0) {
      setError('Please add at least one zip code');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Prepare the listing data
      const listingData = {
        createdBy: currentUser.uid,
        creatorName: userProfile?.displayName || currentUser.email, // Use email as fallback
        listingType: 'buyer',
        status: 'active',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        visibility: 'public',
        buyerListing: {
          budget: {
            min: parseInt(formData.budgetMin),
            max: parseInt(formData.budgetMax)
          },
          location: formData.location,
          propertyTypes: formData.propertyTypes,
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
          mustHaveFeatures: formData.mustHaveFeatures,
          niceToHaveFeatures: formData.niceToHaveFeatures,
          timeline: formData.timeline,
          additionalNotes: formData.additionalNotes,
          preApproved: formData.preApproved,
          services: {
            mustHave: formData.services.mustHave,
            niceToHave: formData.services.niceToHave
          }
        },
        viewCount: 0,
        bidCount: 0
      };
      
      // Add the listing to Firestore
      const docRef = await addDoc(collection(db, 'listings'), listingData);
      
      // Redirect to the listing detail page
      navigate(`/buyer/listings/${docRef.id}`);
    } catch (error) {
      setError('Error creating listing: ' + error.message);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="container" style={{ maxWidth: '800px', padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Create Your Buyer Listing
      </h2>
      
      <p style={{ marginBottom: '2rem' }}>
        Tell agents what you're looking for and they will submit proposals to work with you.
      </p>
      
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
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Budget
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Minimum ($)
              </label>
              <input 
                type="number" 
                name="budgetMin"
                value={formData.budgetMin}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Maximum ($)
              </label>
              <input 
                type="number" 
                name="budgetMax"
                value={formData.budgetMax}
                onChange={handleChange}
                required
                min="0"
                step="1000"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem'
                }}
              />
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Location
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                City
              </label>
              <input 
                type="text" 
                name="location.city"
                value={formData.location.city}
                onChange={(e) => setFormData({
                  ...formData,
                  location: {
                    ...formData.location,
                    city: e.target.value
                  }
                })}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                State
              </label>
              <input 
                type="text" 
                name="location.state"
                value={formData.location.state}
                onChange={(e) => setFormData({
                  ...formData,
                  location: {
                    ...formData.location,
                    state: e.target.value
                  }
                })}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Zip Codes
            </label>
            
            <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                value={zipInput}
                onChange={(e) => setZipInput(e.target.value)}
                placeholder="Add zip code"
                style={{ 
                  flex: 1,
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem 0 0 0.375rem'
                }}
              />
              <button
                type="button"
                onClick={addZipCode}
                style={{ 
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0 1rem',
                  borderRadius: '0 0.375rem 0.375rem 0',
                  border: 'none'
                }}
              >
                Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {formData.location.zipCodes.map((zip) => (
                <div 
                  key={zip}
                  style={{ 
                    backgroundColor: '#eff6ff',
                    border: '1px solid #dbeafe',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {zip}
                  <button
                    type="button"
                    onClick={() => removeZipCode(zip)}
                    style={{ 
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#4b5563',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Property Details
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Property Type
            </label>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {propertyTypeOptions.map((type) => (
                <label 
                  key={type}
                  style={{ 
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    backgroundColor: formData.propertyTypes.includes(type) ? '#eff6ff' : 'white',
                    borderColor: formData.propertyTypes.includes(type) ? '#2563eb' : '#e5e7eb',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <input 
                    type="checkbox"
                    checked={formData.propertyTypes.includes(type)}
                    onChange={() => handlePropertyTypeChange(type)}
                    style={{ marginRight: '0.5rem' }}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Bedrooms (minimum)
              </label>
              <select
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem'
                }}
              >
                <option value="">Select</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Bathrooms (minimum)
              </label>
              <select
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleChange}
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem'
                }}
              >
                <option value="">Select</option>
                <option value="1">1+</option>
                <option value="1.5">1.5+</option>
                <option value="2">2+</option>
                <option value="2.5">2.5+</option>
                <option value="3">3+</option>
                <option value="3.5">3.5+</option>
                <option value="4">4+</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Must-Have Features
            </label>
            
            <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="E.g., Garage, Backyard, etc."
                style={{ 
                  flex: 1,
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem 0 0 0.375rem'
                }}
              />
              <button
                type="button"
                onClick={addFeature}
                style={{ 
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0 1rem',
                  borderRadius: '0 0.375rem 0.375rem 0',
                  border: 'none'
                }}
              >
                Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {formData.mustHaveFeatures.map((feature) => (
                <div 
                  key={feature}
                  style={{ 
                    backgroundColor: '#eff6ff',
                    border: '1px solid #dbeafe',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(feature)}
                    style={{ 
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#4b5563',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Nice-to-Have Features
            </label>
            
            <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                value={niceFeatureInput}
                onChange={(e) => setNiceFeatureInput(e.target.value)}
                placeholder="E.g., Pool, Finished basement, etc."
                style={{ 
                  flex: 1,
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem 0 0 0.375rem'
                }}
              />
              <button
                type="button"
                onClick={addNiceFeature}
                style={{ 
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0 1rem',
                  borderRadius: '0 0.375rem 0.375rem 0',
                  border: 'none'
                }}
              >
                Add
              </button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {formData.niceToHaveFeatures.map((feature) => (
                <div 
                  key={feature}
                  style={{ 
                    backgroundColor: '#eff6ff',
                    border: '1px solid #dbeafe',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeNiceFeature(feature)}
                    style={{ 
                      marginLeft: '0.5rem',
                      fontSize: '0.75rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#4b5563',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Timeline
            </label>
            
            <select
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem'
              }}
            >
              <option value="">Select</option>
              {timelineOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Additional Notes
            </label>
            
            <textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              placeholder="Any additional details about what you're looking for..."
              rows={4}
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem'
              }}
            ></textarea>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                name="preApproved"
                checked={formData.preApproved}
                onChange={handleChange}
                style={{ marginRight: '0.5rem' }}
              />
              I am pre-approved for a mortgage loan
            </label>
          </div>
          
          {/* Agent Services Section */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Agent Services
          </h3>
          <p style={{ marginBottom: '1rem' }}>
            Select which services you need from your agent. This helps agents customize their proposals and pricing for your specific needs.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {buyerServiceOptions.map((service) => (
                <div 
                  key={service.id}
                  style={{ 
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    padding: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: '500' }}>{service.name}</p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{service.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: formData.services.mustHave.includes(service.id) ? '#eff6ff' : 'transparent',
                        border: formData.services.mustHave.includes(service.id) ? '1px solid #2563eb' : '1px solid #e5e7eb',
                        cursor: 'pointer'
                      }}>
                        <input 
                          type="checkbox"
                          checked={formData.services.mustHave.includes(service.id)}
                          onChange={() => handleServiceSelection(service.id, 'mustHave')}
                          style={{ marginRight: '0.5rem' }}
                        />
                        Must Have
                      </label>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        padding: '0.5rem',
                        borderRadius: '0.25rem',
                        backgroundColor: formData.services.niceToHave.includes(service.id) ? '#f0f9ff' : 'transparent',
                        border: formData.services.niceToHave.includes(service.id) ? '1px solid #0891b2' : '1px solid #e5e7eb',
                        cursor: 'pointer'
                      }}>
                        <input 
                          type="checkbox"
                          checked={formData.services.niceToHave.includes(service.id)}
                          onChange={() => handleServiceSelection(service.id, 'niceToHave')}
                          style={{ marginRight: '0.5rem' }}
                        />
                        Nice to Have
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Creating Listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BuyerListingForm;