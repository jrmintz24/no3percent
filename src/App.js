import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import BuyerPage from './pages/BuyerPage';
import SellerPage from './pages/SellerPage';
import AgentPage from './pages/AgentPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import BuyerListingForm from './components/buyer/BuyerListingForm';
import BuyerListingsPage from './pages/BuyerListingsPage';
import ListingDetail from './components/listings/ListingDetail';
import AgentDashboardPage from './pages/AgentDashboardPage';
import AgentListingDetail from './components/agent/AgentListingDetail';
import SellerListingForm from './components/seller/SellerListingForm';
import SellerListingsPage from './pages/SellerListingsPage';
import SellerListingDetail from './components/listings/SellerListingDetail';
import TokenPurchasePage from './pages/TokenPurchasePage';
import AdminTokenDashboard from './pages/AdminTokenDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/buyer" element={<BuyerPage />} />
              <Route path="/seller" element={<SellerPage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/buyer/create-listing" element={<BuyerListingForm />} />
              <Route path="/buyer/listings" element={<BuyerListingsPage />} />
              <Route path="/buyer/listings/:listingId" element={<ListingDetail />} />
              <Route path="/seller/create-listing" element={<SellerListingForm />} />
              <Route path="/seller/listings" element={<SellerListingsPage />} />
              <Route path="/seller/listings/:listingId" element={<SellerListingDetail />} />
              <Route path="/agent/dashboard" element={<AgentDashboardPage />} />
              <Route path="/agent/listings/:listingId" element={<AgentListingDetail />} />
              <Route path="/agent/buy-tokens" element={<TokenPurchasePage />} />
              <Route path="/admin/tokens" element={<AdminTokenDashboard />} />
            </Routes>
          </main>
          <footer className="bg-gray-800 text-white p-4 text-center">
            <div className="container">
              <p>&copy; {new Date().getFullYear()} No3Percent. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;