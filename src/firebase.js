// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBfUfXqogdH1D3MB9CoHqeV-tSG50dWB44",
  authDomain: "daniel-wedding-30eae.firebaseapp.com",
  projectId: "daniel-wedding-30eae",
  storageBucket: "daniel-wedding-30eae.firebasestorage.app",
  messagingSenderId: "977039523805",
  appId: "1:977039523805:web:e0ddf1bc8c984471808034"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);