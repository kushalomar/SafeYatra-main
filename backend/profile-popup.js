/**
 * SafeYatra - Profile Popup Management Script
 * Handles opening/closing the profile popup drawer, rendering real-time profile data,
 * editing profile details, syncing changes with SafeYatraDB / Firebase, and logging out.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const topProfileBtn = document.getElementById('topProfileBtn');
    const profilePopupOverlay = document.getElementById('profilePopupOverlay');
    const closeProfilePopupBtn = document.getElementById('closeProfilePopupBtn');

    const editProfileBtn = document.getElementById('editProfileBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const profileForm = document.getElementById('profileForm');

    // Form input fields
    const inputName = document.getElementById('inputName');
    const inputMobile = document.getElementById('inputMobile');
    const inputAge = document.getElementById('inputAge');
    const inputBloodGroup = document.getElementById('inputBloodGroup');
    const inputEmergency = document.getElementById('inputEmergency');
    const inputEmail = document.getElementById('inputEmail');
    const inputAddress = document.getElementById('inputAddress');

    // Sign out button
    const signOutBtn = document.getElementById('signOutBtn');

    /**
     * Render profile data into UI elements
     */
    function renderProfilePopupUI(data) {
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

        // Also update greeting & names on the main index page
        const userNameTitle = document.querySelector('.user-name-title');
        const displayTouristNameIndex = document.getElementById('displayTouristNameIndex');

        const name = data.name || "Tourist";
        const rawMobile = data.mobile || (typeof SafeYatraDB !== 'undefined' ? SafeYatraDB.getLoggedInMobile() : "");
        const formattedMobile = rawMobile ? (rawMobile.startsWith('+') ? rawMobile : `+91 ${rawMobile.trim()}`) : "";

        if (userNameEl) userNameEl.textContent = name;
        if (userMobileEl) {
            userMobileEl.textContent = formattedMobile;
            userMobileEl.style.display = formattedMobile ? 'block' : 'none';
        }
        if (userEmailEl) {
            userEmailEl.textContent = data.email || "";
            userEmailEl.style.display = (data.email && data.email.trim()) ? 'block' : 'none';
        }

        if (displayUserAge) displayUserAge.textContent = data.age ? `${data.age} Years` : "Not set";
        if (displayUserBlood) displayUserBlood.textContent = data.bloodGroup || "O+";
        if (displayUserEmergency) displayUserEmergency.textContent = data.emergencyContact || "1234567890";
        if (displayUserAddress) displayUserAddress.textContent = data.address || "Location Not Set";

        if (touristIdNameEl) touristIdNameEl.textContent = name;

        if (emergencyCountText) {
            emergencyCountText.textContent = `Emergency: ${data.emergencyContact || "1234567890"}`;
        }

        if (userNameTitle && data.name) {
            userNameTitle.textContent = `Namaste, ${data.name}!`;
        }
        if (displayTouristNameIndex && data.name) {
            displayTouristNameIndex.textContent = data.name;
        }
    }

    // Load initial profile data
    if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.getUserProfile) {
        try {
            const initialProfile = await SafeYatraDB.getUserProfile();
            renderProfilePopupUI(initialProfile);
        } catch (err) {
            console.warn("Could not load initial user profile:", err);
        }
    }

    /**
     * 1. Open Profile Popup
     */
    function openProfilePopup() {
        if (!profilePopupOverlay) return;
        // Refresh profile data from DB
        if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.getUserProfile) {
            SafeYatraDB.getUserProfile().then(profile => {
                if (profile) renderProfilePopupUI(profile);
            }).catch(console.warn);
        }
        profilePopupOverlay.classList.add('active');
        profilePopupOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    /**
     * 2. Close Profile Popup
     */
    function closeProfilePopup() {
        if (!profilePopupOverlay) return;
        profilePopupOverlay.classList.remove('active');
        profilePopupOverlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (topProfileBtn) {
        topProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openProfilePopup();
        });
    }

    if (closeProfilePopupBtn) {
        closeProfilePopupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeProfilePopup();
        });
    }

    // Close on backdrop click
    if (profilePopupOverlay) {
        profilePopupOverlay.addEventListener('click', (e) => {
            if (e.target === profilePopupOverlay) {
                closeProfilePopup();
            }
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            if (editProfileModal && editProfileModal.classList.contains('active')) {
                editProfileModal.classList.remove('active');
            } else if (profilePopupOverlay && profilePopupOverlay.classList.contains('active')) {
                closeProfilePopup();
            }
        }
    });

    /**
     * 3. Edit Profile Modal Handling
     */
    if (editProfileBtn && editProfileModal) {
        editProfileBtn.addEventListener('click', async () => {
            if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.getUserProfile) {
                const current = await SafeYatraDB.getUserProfile();
                if (inputName) inputName.value = current.name || "";
                if (inputMobile) inputMobile.value = current.mobile || "";
                if (inputAge) inputAge.value = current.age || "";
                if (inputBloodGroup) inputBloodGroup.value = current.bloodGroup || "O+";
                if (inputEmergency) inputEmergency.value = current.emergencyContact || "1234567890";
                if (inputEmail) inputEmail.value = current.email || "";
                if (inputAddress) inputAddress.value = current.address || "";
            }
            editProfileModal.classList.add('active');
        });
    }

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

    /**
     * 4. Save Profile Form Handler
     */
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const updatedData = {
                name: inputName ? inputName.value.trim() : "",
                mobile: inputMobile ? inputMobile.value.trim() : "",
                age: inputAge ? inputAge.value.trim() : "",
                bloodGroup: inputBloodGroup ? inputBloodGroup.value.trim() : "O+",
                emergencyContact: inputEmergency ? inputEmergency.value.trim() : "",
                email: inputEmail ? inputEmail.value.trim() : "",
                address: inputAddress ? inputAddress.value.trim() : ""
            };

            if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.saveUserProfile) {
                const saved = await SafeYatraDB.saveUserProfile(updatedData);
                renderProfilePopupUI(saved);
            }

            if (editProfileModal) editProfileModal.classList.remove('active');
            showToast("Profile Saved to Database!");
        });
    }

    /**
     * 5. Sign Out Handler
     */
    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.logout) {
                SafeYatraDB.logout();
            }
        });
    }

    /**
     * 6. Toast Notification Helper
     */
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
