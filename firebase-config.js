// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ✅ Your Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfL-m6-9ZrC8iHrkvkhg0J84gvKq48Wb0",
  authDomain: "cloudsia-b4a48.firebaseapp.com",
  projectId: "cloudsia-b4a48",
  storageBucket: "cloudsia-b4a48.appspot.com",
  messagingSenderId: "170022287003",
  appId: "1:170022287003:web:d0d1396043b4dc6e26383e",
  measurementId: "G-QBTG9REFVT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'en';

// Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// Elements
const loginBtn = document.getElementById("loginBtn");
const googleBtn = document.getElementById("googleBtn");
const githubBtn = document.getElementById("githubBtn");
const showSignup = document.getElementById("showSignup");
const signupModal = document.getElementById("signupModal");
const closeSignup = document.getElementById("closeSignup");
const signupBtn = document.getElementById("signupBtn");
const errorMsg = document.getElementById("errorMsg");

// 🔐 Email/Password Sign-in
loginBtn?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "/index.html";
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});

// 🧑‍💻 Google Sign-in
googleBtn?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    window.location.href = "/index.html";
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});

// 🐙 GitHub Sign-in
githubBtn?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, githubProvider);
    window.location.href = "/index.html";
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});

// 📝 Signup
showSignup?.addEventListener("click", () => signupModal.classList.remove("hidden"));
closeSignup?.addEventListener("click", () => signupModal.classList.add("hidden"));

signupBtn?.addEventListener("click", async () => {
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = "/index.html";
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});

// ✅ Persistent session and redirect
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in as:", user.email);
  }
});;
