// Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBfL-m6-9ZrC8iHrkvkhg0J84gvKq48Wb0",
  authDomain: "cloudsia-b4a48.firebaseapp.com",
  projectId: "cloudsia-b4a48",
  storageBucket: "cloudsia-b4a48.appspot.com",
  messagingSenderId: "170022287003",
  appId: "1:170022287003:web:d0d1396043b4dc6e26383e",
  measurementId: "G-QBTG9REFVT"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = "en";

// Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Export only these
export { auth, googleProvider, githubProvider };
