// Firebase Configuration for Frontend
// This is a client-side config and safe to expose (Firebase Security Rules protect the data)

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAV3GJCURU26ebXZZHuz0vIMfDs2fCa5_M",
    authDomain: "hula-erp.firebaseapp.com",
    databaseURL: "https://hula-erp-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hula-erp",
    storageBucket: "hula-erp.firebasestorage.app",
    messagingSenderId: "713218189002",
    appId: "1:713218189002:web:138a699456e34d2ef07633",
    measurementId: "G-NSR5XK3DE2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Realtime Database instance
export const database = getDatabase(app);

export default app;
