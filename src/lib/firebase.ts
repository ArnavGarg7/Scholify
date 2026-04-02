import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyD-v_5Kjde_n_MiJVXVXwc9TlqHYzH-TpQ",
  authDomain: "scholify-b4d9f.firebaseapp.com",
  projectId: "scholify-b4d9f",
  storageBucket: "scholify-b4d9f.firebasestorage.app",
  messagingSenderId: "188639924159",
  appId: "1:188639924159:web:bb257e525d7ddafa52db0a",
  measurementId: "G-E1294DQYSC"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

// Set browser session persistence so closing the tab automatically signs the user out
setPersistence(auth, browserSessionPersistence).catch(console.error);

export { auth, googleProvider, analytics, functions };
