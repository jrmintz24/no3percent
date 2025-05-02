// src/components/seller/SellerListingForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SellerListingForm = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    priceExpectation: '',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: ''
    },
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    lotSize: '',
    yearBuilt: '',
    features: [],
    amenities: [],
    description: '',
    timeline: '',
    motivation: '',
    services: {
      mustHave: [],
      niceToHave: []
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [amenityInput, setAmenityInput] = useState('');
  
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
  
  const motivationOptions = [
    'Upgrading to a larger home',
    'Downsizing',
    'Relocating for work',
    'Retirement',
    'Investment property sale',
    'Financial reasons',
    'Family changes',
    'Other'
  ];
  
  // Define the seller service options with a la carte menu
  const sellerServiceOptions = [
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
  ];
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('location.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [field]: value
        }
      });
    } else if (type === 'checkbox') {
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
  
  const addFeature = () => {
    if (featureInput && !formData.features.includes(featureInput)) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput]
      });
      setFeatureInput('');
    }
  };
  
  const removeFeature = (feature) => {
    setFormData({
      ...formData,
      features: formData.features.filter(f => f !== feature)
    });
  };
  
  const addAmenity = () => {
    if (amenityInput && !formData.amenities.includes(amenityInput)) {
      setFormData({
        ...formData,
        amenities: [...formData.amenities, amenityInput]
      });
      setAmenityInput('');
    }
  };
  
  const removeAmenity = (amenity) => {
    setFormData({
      ...formData,
      amenities: formData.amenities.filter(a => a !== amenity)
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
    
    if (!userProfile) {
      setError('User profile is not fully loaded yet. Please try again in a moment.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Prepare the listing data
      const listingData = {
        createdBy: currentUser.uid,
        creatorName: userProfile?.displayName || currentUser.email,
        listingType: 'seller',
        status: 'active',
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        visibility: 'public',
        sellerListing: {
          priceExpectation: parseInt(formData.priceExpectation),
          location: formData.location,
          propertyType: formData.propertyType,
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseFloat(formData.bathrooms),
          squareFeet: parseInt(formData.squareFeet),
          lotSize: formData.lotSize,
          yearBuilt: parseInt(formData.yearBuilt),
          features: formData.features,
          amenities: formData.amenities,
          description: formData.description,
          timeline: formData.timeline,
          motivation: formData.motivation,
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
      navigate(`/seller/listings/${docRef.id}`);
    } catch (error) {
      setError('Error creating listing: ' + error.message);
    }
    
    setLoading(false);
  };
  
  return (
    <div className="container" style={{ maxWidth: '800px', padding: '2rem 0' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        Create Your Seller Listing
      </h2>
      
      <p style={{ marginBottom: '2rem' }}>
        Tell us about your property and agents will submit proposals to help you sell it.
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
            Property Details
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Expected Listing Price ($)
            </label>
            <input 
              type="number" 
              name="priceExpectation"
              value={formData.priceExpectation}
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
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Property Address
            </label>
            <input 
              type="text" 
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              required
              placeholder="Street address"
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem',
                marginBottom: '0.5rem'
              }}
            />
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '1rem'
            }}>
              <div>
                <input 
                  type="text" 
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  required
                  placeholder="City"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              <div>
                <input 
                  type="text" 
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  required
                  placeholder="State"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
              <div>
                <input 
                  type="text" 
                  name="location.zipCode"
                  value={formData.location.zipCode}
                  onChange={handleChange}
                  required
                  placeholder="Zip Code"
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.375rem'
                  }}
                />
              </div>
            </div>
          </div>
          
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
                    backgroundColor: formData.propertyType === type ? '#eff6ff' : 'white',
                    borderColor: formData.propertyType === type ? '#2563eb' : '#e5e7eb',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <input 
                    type="radio"
                    name="propertyType"
                    value={type}
                    checked={formData.propertyType === type}
                    onChange={handleChange}
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
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Bedrooms
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
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6+</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Bathrooms
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
                <option value="1">1</option>
                <option value="1.5">1.5</option>
                <option value="2">2</option>
                <option value="2.5">2.5</option>
                <option value="3">3</option>
                <option value="3.5">3.5</option>
                <option value="4">4</option>
                <option value="4.5">4.5</option>
                <option value="5">5+</option>
              </select>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Square Feet
              </label>
              <input 
                type="number" 
                name="squareFeet"
                value={formData.squareFeet}
                onChange={handleChange}
                required
                min="0"
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
                Lot Size
              </label>
              <input 
                type="text" 
                name="lotSize"
                value={formData.lotSize}
                onChange={handleChange}
                placeholder="e.g., 0.25 acres"
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
                Year Built
              </label>
              <input 
                type="number" 
                name="yearBuilt"
                value={formData.yearBuilt}
                onChange={handleChange}
                min="1800"
                max={new Date().getFullYear()}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Property Features
            </label>
            
            <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                placeholder="E.g., Fireplace, Hardwood floors, etc."
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
              {formData.features.map((feature) => (
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
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Neighborhood Amenities
            </label>
            
            <div style={{ display: 'flex', marginBottom: '0.5rem' }}>
              <input 
                type="text" 
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                placeholder="E.g., Parks, Shopping, Schools, etc."
                style={{ 
                  flex: 1,
                  padding: '0.75rem', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem 0 0 0.375rem'
                }}
              />
              <button
                type="button"
                onClick={addAmenity}
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
              {formData.amenities.map((amenity) => (
                <div 
                  key={amenity}
                  style={{ 
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #e0f2fe',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity)}
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
              Property Description
            </label>
            
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Provide additional details about your property..."
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                border: '1px solid #e5e7eb', 
                borderRadius: '0.375rem'
              }}
            ></textarea>
          </div>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            Selling Details
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Timeline to Sell
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
              Motivation for Selling
            </label>
            
            <select
              name="motivation"
              value={formData.motivation}
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
              {motivationOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          
          {/* Agent Services Section */}
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            A La Carte Listing Agent Services
          </h3>
          <p style={{ marginBottom: '1rem' }}>
            Select which services you need from your agent. This helps agents customize their proposals and pricing for your specific needs.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {sellerServiceOptions.map((service) => (
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

export default SellerListingForm;