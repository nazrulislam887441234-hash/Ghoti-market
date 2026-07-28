// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Configuration for GHOTI MARKET
const firebaseConfig = {
  apiKey: "AIzaSyBUhNhYvuo_FTvZ5RZR6Gn-4hsUY21S0XE",
  authDomain: "ghotimarket.firebaseapp.com",
  databaseURL: "https://ghotimarket-default-rtdb.firebaseio.com",
  projectId: "ghotimarket",
  storageBucket: "ghotimarket.firebasestorage.app",
  messagingSenderId: "481257644093",
  appId: "1:481257644093:web:0dfc3699d6b3c86afeca54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export it
export const db = getFirestore(app);
