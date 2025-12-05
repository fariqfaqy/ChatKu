import {initializeApp} from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  CollectionReference,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArWT4NaMht29P4V3xnHWYDr_o9Um7n8gk",
  authDomain: "chatku-20f6f.firebaseapp.com",
  projectId: "chatku-20f6f",
  storageBucket: "chatku-20f6f.firebasestorage.app",
  messagingSenderId: "192903861884",
  appId: "1:192903861884:web:ca04e21dc1ca7edf345bf9",
  measurementId: "G-R18GEFV248"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Messages collection reference
export const messagesCollection = collection(
  db,
  'messages',
) as CollectionReference<DocumentData>;

export {
  // Core
  auth,
  db,
  storage,
  // Firestore
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
  // Auth
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  // Storage
  ref,
  uploadBytes,
  getDownloadURL,
};

export type {User};

export default app;
