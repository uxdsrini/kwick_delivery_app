import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTUWIfifPEx0Jf2wp0XfSRs8Ijxrwj9K4",
  authDomain: "kwick-b08fb.firebaseapp.com",
  projectId: "kwick-b08fb",
  storageBucket: "kwick-b08fb.firebasestorage.app",
  messagingSenderId: "648614356508",
  appId: "1:648614356508:web:6c2d7e20adf49f60a021d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
