// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  setPersistence, 
  browserLocalPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// ⚙️ Replace with your Firebase credentials
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable persistent login
setPersistence(auth, browserLocalPersistence);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Helper for logout
export const logoutUser = () => signOut(auth);
