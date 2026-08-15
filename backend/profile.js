/**
 * SafeYatra AI - Profile Management Page Script
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Enforce Auth Guard
    if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.requireAuth) {
        SafeYatraDB.requireAuth();
    }

    // 2. Fetch User Profile from Database
    let profile = await SafeYatraDB.getUserProfile();
    renderProfileUI(profile);

    // DOM Elements
    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const profileForm = document.getElementById('profileForm');

    // Input Fields
    const inputName = document.getElementById('inputName');
    const inputMobile = document.getElementById('inputMobile');
    const inputAge = document.getElementById('inputAge');
    const inputBloodGroup = document.getElementById('inputBloodGroup');
    const inputEmergency = document.getElementById('inputEmergency');
    const inputEmail = document.getElementById('inputEmail');
    const inputAddress = document.getElementById('inputAddress');

    // Render Profile UI Card Data Live
    function renderProfileUI(data) {
        if (!data) return;

        const userNameEl = document.getElementById('displayUserName');
        const userMobileEl = document.getElementById('displayUserMobile');
        const userEmailEl = document.getElementById('displayUserEmail');
        
        const displayUserAge = document.getElementById('displayUserAge');
        const displayUserBlood = document.getElementById('displayUserBlood');
        const displayUserEmergency = document.getElementById('displayUserEmergency');
        const displayUserAddress = document.getElementById('displayUserAddress');

        const touristIdNameEl = document.getElementById('displayTouristName');
        const emergencyCountText = document.getElementById('emergencyCountText');

        if (userNameEl) userNameEl.textContent = data.name || "Tourist";
        if (userMobileEl) userMobileEl.textContent = data.mobile || "";
        if (userEmailEl) userEmailEl.textContent = data.email || "";

        if (displayUserAge) displayUserAge.textContent = data.age ? `${data.age} Years` : "Not set";
        if (displayUserBlood) displayUserBlood.textContent = data.bloodGroup || "O+";
        if (displayUserEmergency) displayUserEmergency.textContent = data.emergencyContact || "7376712538";
        if (displayUserAddress) displayUserAddress.textContent = data.address || "Location Not Set";

        if (touristIdNameEl) touristIdNameEl.textContent = data.name || "Tourist";

        if (emergencyCountText) {
            emergencyCountText.textContent = `Emergency: ${data.emergencyContact || "7376712538"}`;
        }
    }

    // 3. Open Edit Profile Modal
    if (editProfileBtn && editProfileModal) {
        editProfileBtn.addEventListener('click', async () => {
            const current = await SafeYatraDB.getUserProfile();
            if (inputName) inputName.value = current.name || "";
            if (inputMobile) inputMobile.value = current.mobile || "";
            if (inputAge) inputAge.value = current.age || "";
            if (inputBloodGroup) inputBloodGroup.value = current.bloodGroup || "O+";
            if (inputEmergency) inputEmergency.value = current.emergencyContact || "7376712538";
            if (inputEmail) inputEmail.value = current.email || "";
            if (inputAddress) inputAddress.value = current.address || "";

            editProfileModal.classList.add('active');
        });
    }

    // 4. Close Modal Handlers
    if (closeProfileModal && editProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            editProfileModal.classList.remove('active');
        });
    }

    if (editProfileModal) {
        editProfileModal.addEventListener('click', (e) => {
            if (e.target === editProfileModal) {
                editProfileModal.classList.remove('active');
            }
        });
    }

    // 5. Save Form Handler
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const updatedData = {
                name: inputName.value.trim(),
                mobile: inputMobile.value.trim(),
                age: inputAge.value.trim(),
                bloodGroup: inputBloodGroup.value.trim(),
                emergencyContact: inputEmergency.value.trim(),
                email: inputEmail.value.trim(),
                address: inputAddress.value.trim()
            };

            const saved = await SafeYatraDB.saveUserProfile(updatedData);
            renderProfileUI(saved);

            if (editProfileModal) editProfileModal.classList.remove('active');
            showToast("Profile Saved to Firebase & Local Storage!");
        });
    }

    // 6. Sign Out Handler
    const signOutBtn = document.querySelector('.sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            SafeYatraDB.logout();
        });
    }

    // Toast helper
    function showToast(msg) {
        const toastEl = document.getElementById('toast');
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3000);
    }
});
