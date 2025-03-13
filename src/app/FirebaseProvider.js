
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA_D2UeJAAABA4TzKuWaq-GR9fMp2SCzFw",
  authDomain: "voluntrek-3049d.firebaseapp.com",
  projectId: "voluntrek-3049d",
  storageBucket: "voluntrek-3049d.firebasestorage.app",
  messagingSenderId: "12277585806",
  appId: "1:12277585806:web:84180a6473e2a4862a76df",
  measurementId: "G-KYJXTVVB1C"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

