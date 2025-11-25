import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyABRt42eL497uZcASCB8_7QhTSKWf7yREA",
  authDomain: "myteam-stats.firebaseapp.com",
  projectId: "myteam-stats",
  storageBucket: "myteam-stats.firebasestorage.app",
  messagingSenderId: "105002400016",
  appId: "1:105002400016:web:596430714d71db8ce48d95",
  measurementId: "G-PWDRR76MG7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;