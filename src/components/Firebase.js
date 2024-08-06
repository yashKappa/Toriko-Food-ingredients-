// src/component/Firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-IkFTAR_-gy16V6w8sGQCfr13ByGTANY",
  authDomain: "toriko-food.firebaseapp.com",
  projectId: "toriko-food",
  storageBucket: "toriko-food.appspot.com",
  messagingSenderId: "179383735861",
  appId: "1:179383735861:web:ae21d1b98079b26679c37c",
  measurementId: "G-BQQXPSB6VG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { auth, GoogleAuthProvider, signInWithPopup, signOut, firestore, storage };
