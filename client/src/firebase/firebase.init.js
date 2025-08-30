// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_qR4TJChoRYNvuW7lzs0rDpehEPuExAg",
  authDomain: "next-fin-auth.firebaseapp.com",
  projectId: "next-fin-auth",
  storageBucket: "next-fin-auth.firebasestorage.app",
  messagingSenderId: "292702345538",
  appId: "1:292702345538:web:01e10b9585c7a618e7d0db"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);