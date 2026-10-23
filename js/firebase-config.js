/**
 * SereneBloom - Firebase Configuration & Initialization
 * Uses Firebase Modular SDK v10 via ES Modules (CDN)
 */

// Real Firebase configuration from user's project
export const firebaseConfig = {
  apiKey: "AIzaSyCtaugm8LUcxejjSZD6i6SKq6AcHqSjL_0",
  authDomain: "serenebloom-2b565.firebaseapp.com",
  projectId: "serenebloom-2b565",
  storageBucket: "serenebloom-2b565.firebasestorage.app",
  messagingSenderId: "405303147581",
  appId: "1:405303147581:web:b71d72da34808b7f027e54"
};

// Check if credentials have been filled in
export function isFirebaseConfigured() {
  return firebaseConfig && 
    firebaseConfig.apiKey && 
    !firebaseConfig.apiKey.includes("YOUR_API_KEY") &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId === "serenebloom-2b565";
}

let app = null;
let auth = null;
let db = null;

// Dynamically initialize Firebase if configured
export async function getFirebaseInstances() {
  if (!isFirebaseConfigured()) {
    return { app: null, auth: null, db: null, configured: false };
  }

  if (app && auth && db) {
    return { app, auth, db, configured: true };
  }

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js");

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    console.log(" SereneBloom: Firebase successfully initialized!");
    return { app, auth, db, configured: true };
  } catch (error) {
    console.warn("SereneBloom: Firebase initialization warning, falling back to local mode:", error);
    return { app: null, auth: null, db: null, configured: false };
  }
}
