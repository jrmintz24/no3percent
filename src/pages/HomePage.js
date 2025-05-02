import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      {/* Hero Section */}
      <section style={{ 
        background: 'linear-gradient(to right, #eff6ff, #e5e7eb)',
        padding: '4rem 0'
      }}>
        <div className="container flex flex-col md:flex-row items-center">
          <div style={{ flex: 1, marginRight: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Find agents who <span style={{ color: '#2563eb' }}>compete for you</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: '2rem' }}>
              No3Percent flips the traditional real estate model, putting buyers and sellers in control. 
              Post your needs and agents bid with creative offers and competitive commissions.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/buyer" className="btn btn-primary">I'm a Buyer</Link>
              <Link to="/seller" className="btn btn-success">I'm a Seller</Link>
              <Link to="/agent" className="btn btn-purple">I'm an Agent</Link>
            </div>
          </div>
          
          <div style={{ flex: 1, marginTop: '2rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ height: '40px', width: '40px', borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>
                    🏠
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '500' }}>3BR Home in Seattle</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Posted by Sarah, Buyer</p>
                  </div>
                </div>
                <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px' }}>Active</span>
              </div>
              
              <div style={{ padding: '1rem 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Budget</p>
                    <p style={{ fontWeight: '500' }}>$600k - $750k</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Location</p>
                    <p style={{ fontWeight: '500' }}>North Seattle</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Bedrooms</p>
                    <p style={{ fontWeight: '500' }}>3+</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Timeline</p>
                    <p style={{ fontWeight: '500' }}>3-4 months</p>
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <h4 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Agent Bids (3)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #dbeafe' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: '500' }}>Jane Smith</div>
                      <div style={{ color: '#2563eb', fontWeight: 'bold' }}>1.5% commission</div>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>5 years experience, 42 homes in this area</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section style={{ padding: '4rem 0', backgroundColor: 'white' }}>
        <div className="container text-center">
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>How No3Percent Works</h2>
          <p style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '3rem', maxWidth: '800px', margin: '0 auto 3rem' }}>
            We flip the traditional real estate process, putting you in control.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
            <div className="text-center">
              <div style={{ height: '4rem', width: '4rem', borderRadius: '9999px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <span style={{ color: '#2563eb', fontSize: '1.5rem', fontWeight: 'bold' }}>1</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem' }}>Post Your Needs</h3>
              <p style={{ color: '#6b7280' }}>
                Tell us what you're looking for as a buyer or seller. No commitment, no pressure.
              </p>
            </div>
            
            <div className="text-center">
              <div style={{ height: '4rem', width: '4rem', borderRadius: '9999px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <span style={{ color: '#2563eb', fontSize: '1.5rem', fontWeight: 'bold' }}>2</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem' }}>Agents Compete for You</h3>
              <p style={{ color: '#6b7280' }}>
                Qualified agents submit offers with competitive rates and valuable services.
              </p>
            </div>
            
            <div className="text-center">
              <div style={{ height: '4rem', width: '4rem', borderRadius: '9999px', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <span style={{ color: '#2563eb', fontSize: '1.5rem', fontWeight: 'bold' }}>3</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem' }}>Choose Your Agent</h3>
              <p style={{ color: '#6b7280' }}>
                Review offers, communicate with agents, and select the best fit for your needs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;