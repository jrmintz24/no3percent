// src/pages/AdminTokenDashboard.js
import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { getTokenStats, getRecentTransactions } from '../firebase/tokenModel';

const AdminTokenDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalTokensSold: 0,
    totalTokensUsed: 0,
    revenue: 0
  });
  const [userFilter, setUserFilter] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  
  useEffect(() => {
    // Check if user is admin
    if (!userProfile || userProfile.userType !== 'admin') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        // Get token stats
        const statsData = await getTokenStats();
        setStats({
          totalTokensSold: statsData.totalPurchased,
          totalTokensUsed: statsData.totalUsed,
          revenue: statsData.totalRevenue
        });
        
        // Get recent transactions
        const transactionsData = await getRecentTransactions(50);
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
      } catch (error) {
        setError('Error fetching data: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, userProfile]);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Handle filtering transactions by user ID
  useEffect(() => {
    if (!userFilter.trim()) {
      setFilteredTransactions(transactions);
      return;
    }
    
    const filtered = transactions.filter(t => 
      t.userId.toLowerCase().includes(userFilter.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [userFilter, transactions]);
  
  // Calculate monthly trends
  const getMonthlyData = () => {
    const monthlyData = {};
    
    transactions.forEach(t => {
      const date = new Date(t.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          purchased: 0,
          used: 0,
          revenue: 0
        };
      }
      
      if (t.type === 'purchase') {
        monthlyData[monthKey].purchased += t.amount;
        monthlyData[monthKey].revenue += t.amount * 10; // assuming $10 per token
      } else if (t.type === 'bid') {
        monthlyData[monthKey].used += t.amount;
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => {
      return new Date(b.month) - new Date(a.month);
    }).slice(0, 6); // Get last 6 months
  };
  
  const monthlyData = getMonthlyData();
  
  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="container py-8">
        <div style={{ 
          backgroundColor: '#fee2e2', 
          color: '#b91c1c', 
          padding: '1rem', 
          borderRadius: '0.375rem'
        }}>
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Token Management Dashboard
      </h1>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ 
          backgroundColor: '#eff6ff',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Total Tokens Sold</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
            {stats.totalTokensSold}
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#f0fdf4',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Total Tokens Used</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>
            {stats.totalTokensUsed}
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#fef3c7',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Total Revenue</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
            {formatCurrency(stats.revenue)}
          </div>
        </div>
      </div>
      
      {/* Monthly Trends */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Monthly Trends
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Month</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Tokens Sold</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Tokens Used</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((month, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{month.month}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{month.purchased}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{month.used}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{formatCurrency(month.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Transaction List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            Recent Transactions
          </h2>
          
          <div>
            <input
              type="text"
              placeholder="Filter by user ID"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              style={{ 
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.25rem'
              }}
            />
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Transaction ID</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>User ID</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>Amount</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ 
                      display: 'block',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {transaction.id}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ 
                      display: 'block',
                      maxWidth: '150px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {transaction.userId}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ 
                      backgroundColor: transaction.type === 'purchase' ? '#eff6ff' : '#f0fdf4',
                      color: transaction.type === 'purchase' ? '#2563eb' : '#16a34a',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'center' }}>{transaction.amount}</td>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                    {new Date(transaction.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
              
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '0.75rem', textAlign: 'center' }}>
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTokenDashboard;