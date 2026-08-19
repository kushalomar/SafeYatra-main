/**
 * SafeYatra AI - Production Firebase Configuration & Initialization
 * 
 * Replace the values below with your live Firebase Project credentials:
 * Console: https://console.firebase.google.com/
 */

const firebaseConfig = {
    apiKey: "AIzaSyCvIcSUF_1Dn79SW2eDX10rFwHxrwsoxV4",
    authDomain: "safeyatra-ai.firebaseapp.com",
    projectId: "safeyatra-ai",
    storageBucket: "safeyatra-ai.firebasestorage.app",
    messagingSenderId: "220678730693",
    appId: "1:220678730693:web:5c4de66fbbde90a41851ac",
    measurementId: "G-T6YY2X9CTZ"
};

// Initialize Firebase App
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log("TravelSathi: Production Firebase initialized.");
        
        // Auto Anonymous Auth for real-time Firestore synchronization
        if (firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                if (!user) {
                    firebase.auth().signInAnonymously().catch((err) => {
                        console.log("Firebase Auth notice:", err.message);
                    });
                }
            });
        }
    } catch (e) {
        console.error("Firebase Initialization Error:", e.message);
    }
}
