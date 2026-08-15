/**
 * SafeYatra AI - Production Database & Authentication Service
 * Connected to Firebase Firestore Database (Collection: 'users/{phoneNumber}')
 */

const SafeYatraDB = {
    // 1. Get Firestore Database Instance
    getFirestore: function () {
        if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
            return firebase.firestore();
        }
        return null;
    },

    // 2. Active Session Mobile Number
    getLoggedInMobile: function () {
        return localStorage.getItem('safeyatra_logged_mobile') || "";
    },

    setLoggedInMobile: function (mobile) {
        if (!mobile) return;
        const cleanMobile = mobile.replace(/\s+/g, '');
        localStorage.setItem('safeyatra_logged_mobile', cleanMobile);
    },

    isLoggedIn: function () {
        const mobile = this.getLoggedInMobile();
        return mobile && mobile.trim() !== "";
    },

    // 3. Auth Guard: Enforce Login across pages
    requireAuth: function () {
        if (!this.isLoggedIn()) {
            window.location.href = "login.html";
        }
    },

    // Clean Default Profile Object (NO Hardcoded Arjun Sharma Fallback)
    getDefaultProfile: function (mobile) {
        const cleanMobile = (mobile || this.getLoggedInMobile() || "").replace(/\s+/g, '');
        return {
            name: "",
            mobile: cleanMobile,
            age: "",
            bloodGroup: "O+",
            emergencyContact: "7376712538",
            email: "",
            address: ""
        };
    },

    // 4. Check if User Document Exists in Firestore
    checkUserExistsInFirestore: async function (mobile) {
        const cleanMobile = mobile.replace(/\s+/g, '');
        const db = this.getFirestore();

        if (db) {
            try {
                const docRef = db.collection('users').doc(cleanMobile);
                const docSnap = await docRef.get();
                if (docSnap.exists && docSnap.data() && docSnap.data().name) {
                    const userData = docSnap.data();
                    localStorage.setItem(`safeyatra_user_${cleanMobile}`, JSON.stringify(userData));
                    return { exists: true, data: userData };
                }
            } catch (err) {
                console.warn("Firestore Check Error:", err.message);
            }
        }

        // Check local cache fallback
        const localCache = localStorage.getItem(`safeyatra_user_${cleanMobile}`);
        if (localCache) {
            try {
                const parsed = JSON.parse(localCache);
                if (parsed && parsed.name) return { exists: true, data: parsed };
            } catch (e) {}
        }

        return { exists: false, data: null };
    },

    // 5. Read Live User Profile from Firebase Firestore
    getUserProfile: async function () {
        const mobile = this.getLoggedInMobile();
        const defaultProf = this.getDefaultProfile(mobile);

        if (!mobile) return defaultProf;

        const cleanMobile = mobile.replace(/\s+/g, '');
        const db = this.getFirestore();

        if (db) {
            try {
                const docSnap = await db.collection('users').doc(cleanMobile).get();
                if (docSnap.exists && docSnap.data()) {
                    const profileData = { ...defaultProf, ...docSnap.data() };
                    localStorage.setItem(`safeyatra_user_${cleanMobile}`, JSON.stringify(profileData));
                    return profileData;
                }
            } catch (err) {
                console.warn("Firestore fetch error:", err.message);
            }
        }

        // Cache fallback
        const localCache = localStorage.getItem(`safeyatra_user_${cleanMobile}`) || localStorage.getItem('safeyatra_user_profile');
        if (localCache) {
            try {
                return { ...defaultProf, ...JSON.parse(localCache) };
            } catch (e) {}
        }

        return defaultProf;
    },

    // 6. Write Live User Profile to Firebase Firestore
    saveUserProfile: async function (profileData) {
        const mobile = (profileData.mobile || this.getLoggedInMobile()).replace(/\s+/g, '');
        if (!mobile) return null;

        const defaultProf = this.getDefaultProfile(mobile);

        const updatedProfile = {
            ...defaultProf,
            ...profileData,
            mobile: mobile,
            updatedAt: new Date().toISOString()
        };

        // Save to Firebase Firestore Database directly
        const db = this.getFirestore();
        if (db) {
            try {
                await db.collection('users').doc(mobile).set(updatedProfile, { merge: true });
                console.log(`Production Firestore Success: Saved document to collection 'users/${mobile}'`);
            } catch (err) {
                console.error("Firestore Write Error:", err);
            }
        }

        // Cache locally for instant loading
        this.setLoggedInMobile(mobile);
        localStorage.setItem(`safeyatra_user_${mobile}`, JSON.stringify(updatedProfile));
        localStorage.setItem('safeyatra_user_profile', JSON.stringify(updatedProfile));

        return updatedProfile;
    },

    // 7. Logout User
    logout: function () {
        localStorage.removeItem('safeyatra_logged_mobile');
        localStorage.removeItem('safeyatra_user_profile');
        if (window.firebase && window.firebase.auth) {
            try {
                firebase.auth().signOut();
            } catch (e) {}
        }
        window.location.href = "login.html";
    }
};

window.SafeYatraDB = SafeYatraDB;
