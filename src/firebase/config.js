// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with YOUR Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCIHRy4RbIhwhN7CKv8jziXo5VSUfg4iFY",
    authDomain: "no3p-5-1-25.firebaseapp.com",
    projectId: "no3p-5-1-25",
    storageBucket: "no3p-5-1-25.firebasestorage.app",
    messagingSenderId: "185707107851",
    appId: "1:185707107851:web:85bd50360af2d152a3590e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;