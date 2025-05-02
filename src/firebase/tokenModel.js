// src/firebase/tokenModel.js
import { doc, setDoc, getDoc, updateDoc, increment, collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from './config';

// Initialize agent token account
export const initializeTokenAccount = async (userId) => {
  try {
    const tokenRef = doc(db, 'tokens', userId);
    const tokenSnap = await getDoc(tokenRef);
    
    if (!tokenSnap.exists()) {
      await setDoc(tokenRef, {
        balance: 0,
        totalPurchased: 0,
        totalUsed: 0,
        lastUpdated: new Date().toISOString()
      });
      return true;
    }
    return false; // Already exists
  } catch (error) {
    console.error('Error initializing token account:', error);
    throw error;
  }
};

// Get agent token balance
export const getTokenBalance = async (userId) => {
  try {
    const tokenRef = doc(db, 'tokens', userId);
    const tokenSnap = await getDoc(tokenRef);
    
    if (tokenSnap.exists()) {
      return tokenSnap.data().balance;
    }
    return 0; // No tokens
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
};

// Add tokens to an agent's account
export const addTokens = async (userId, amount) => {
  try {
    const tokenRef = doc(db, 'tokens', userId);
    
    await updateDoc(tokenRef, {
      balance: increment(amount),
      totalPurchased: increment(amount),
      lastUpdated: new Date().toISOString()
    });
    
    // Record the transaction
    const transactionId = `${userId}_${Date.now()}`;
    const transactionRef = doc(db, 'tokenTransactions', transactionId);
    
    await setDoc(transactionRef, {
      userId,
      amount,
      type: 'purchase',
      timestamp: new Date().toISOString()
    });
    
    return amount;
  } catch (error) {
    console.error('Error adding tokens:', error);
    throw error;
  }
};

// Use a token for a bid
export const useToken = async (userId, listingId) => {
  try {
    const tokenRef = doc(db, 'tokens', userId);
    const tokenSnap = await getDoc(tokenRef);
    
    if (!tokenSnap.exists() || tokenSnap.data().balance <= 0) {
      return false; // Not enough tokens
    }
    
    await updateDoc(tokenRef, {
      balance: increment(-1),
      totalUsed: increment(1),
      lastUpdated: new Date().toISOString()
    });
    
    // Record the transaction
    const transactionId = `${userId}_${listingId}_${Date.now()}`;
    const transactionRef = doc(db, 'tokenTransactions', transactionId);
    
    await setDoc(transactionRef, {
      userId,
      listingId,
      amount: 1,
      type: 'bid',
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Error using token:', error);
    throw error;
  }
};

// Get token stats for admin dashboard
export const getTokenStats = async () => {
  try {
    // Get total tokens purchased
    const purchaseQuery = query(
      collection(db, 'tokenTransactions'),
      where('type', '==', 'purchase')
    );
    
    const purchaseSnap = await getDocs(purchaseQuery);
    let totalPurchased = 0;
    purchaseSnap.forEach((doc) => {
      totalPurchased += doc.data().amount;
    });
    
    // Get total tokens used
    const usageQuery = query(
      collection(db, 'tokenTransactions'),
      where('type', '==', 'bid')
    );
    
    const usageSnap = await getDocs(usageQuery);
    let totalUsed = 0;
    usageSnap.forEach((doc) => {
      totalUsed += doc.data().amount;
    });
    
    return {
      totalPurchased,
      totalUsed,
      totalRevenue: totalPurchased * 10 // assuming $10 per token
    };
  } catch (error) {
    console.error('Error getting token stats:', error);
    throw error;
  }
};

// Get recent token transactions
export const getRecentTransactions = async (limitCount = 50) => {
  try {
    const transactionsQuery = query(
      collection(db, 'tokenTransactions'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const transactionsSnap = await getDocs(transactionsQuery);
    const transactions = [];
    
    transactionsSnap.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return transactions;
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    throw error;
  }
};