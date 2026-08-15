/**
 * SafeYatra AI - Firebase OTP Mobile Login & Registration Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect straight to index.html
    if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.isLoggedIn()) {
        window.location.href = "index.html";
        return;
    }

    let confirmationResult = null;
    let recaptchaVerifier = null;
    let targetPhoneNumber = "";

    // DOM Step Panels
    const stepMobile = document.getElementById('stepMobile');
    const stepOtp = document.getElementById('stepOtp');
    const stepRegister = document.getElementById('stepRegister');

    // Forms & Inputs
    const mobileForm = document.getElementById('mobileForm');
    const inputMobileNumber = document.getElementById('inputMobileNumber');
    const sendOtpBtn = document.getElementById('sendOtpBtn');

    const otpForm = document.getElementById('otpForm');
    const otpBoxes = [
        document.getElementById('otp1'),
        document.getElementById('otp2'),
        document.getElementById('otp3'),
        document.getElementById('otp4'),
        document.getElementById('otp5'),
        document.getElementById('otp6')
    ];
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const targetPhoneText = document.getElementById('targetPhoneText');
    const changePhoneBtn = document.getElementById('changePhoneBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    const resendTimer = document.getElementById('resendTimer');

    const regForm = document.getElementById('regForm');
    const regName = document.getElementById('regName');
    const regMobile = document.getElementById('regMobile');
    const regAge = document.getElementById('regAge');
    const regBloodGroup = document.getElementById('regBloodGroup');
    const regEmergency = document.getElementById('regEmergency');
    const regEmail = document.getElementById('regEmail');
    const regAddress = document.getElementById('regAddress');

    // 1. Initialize Firebase Recaptcha
    initRecaptcha();

    function initRecaptcha() {
        if (window.firebase && window.firebase.auth) {
            try {
                let container = document.getElementById('recaptcha-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'recaptcha-container';
                    document.body.appendChild(container);
                }
                if (recaptchaVerifier) {
                    try { recaptchaVerifier.clear(); } catch(e) {}
                }
                recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                    'size': 'invisible',
                    'callback': (response) => {
                        console.log("Recaptcha verified");
                    }
                });
            } catch (e) {
                console.error("Recaptcha init error:", e);
            }
        }
    }

    // 2. STEP 1: Mobile Form Submit -> Send OTP via Firebase
    if (mobileForm) {
        mobileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rawMobile = inputMobileNumber.value.trim();

            if (rawMobile.length < 10) {
                showToast("Please enter a valid 10-digit mobile number");
                return;
            }

            targetPhoneNumber = "+91" + rawMobile;
            if (targetPhoneText) targetPhoneText.textContent = targetPhoneNumber;

            if (sendOtpBtn) {
                sendOtpBtn.disabled = true;
                sendOtpBtn.innerHTML = '<span>Sending OTP...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
            }

            if (!window.firebase || !window.firebase.auth) {
                showToast("Firebase SDK not loaded");
                if (sendOtpBtn) {
                    sendOtpBtn.disabled = false;
                    sendOtpBtn.innerHTML = '<span>Send OTP Code</span> <i class="fa-solid fa-paper-plane"></i>';
                }
                return;
            }

            if (!recaptchaVerifier) {
                initRecaptcha();
            }

            try {
                confirmationResult = await firebase.auth().signInWithPhoneNumber(targetPhoneNumber, recaptchaVerifier);
                showToast("OTP sent to " + targetPhoneNumber);
                goToStep(stepOtp);
                startResendTimer();
            } catch (err) {
                console.error("Firebase Phone Auth Error:", err);
                showToast("Firebase Error: " + (err.message || err.code));
                // Reset recaptcha on error so user can re-try
                initRecaptcha();
            } finally {
                if (sendOtpBtn) {
                    sendOtpBtn.disabled = false;
                    sendOtpBtn.innerHTML = '<span>Send OTP Code</span> <i class="fa-solid fa-paper-plane"></i>';
                }
            }
        });
    }

    // 3. OTP Pin Navigation Logic
    otpBoxes.forEach((box, index) => {
        if (!box) return;

        box.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val.length === 1 && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !box.value && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });
    });

    // 4. STEP 2: Verify OTP via Firebase Confirmation
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const enteredOtp = otpBoxes.map(b => b ? b.value : '').join('');

            if (enteredOtp.length < 6) {
                showToast("Please enter complete 6-digit OTP");
                return;
            }

            if (!confirmationResult) {
                showToast("No active OTP session. Please request OTP again.");
                return;
            }

            if (verifyOtpBtn) {
                verifyOtpBtn.disabled = true;
                verifyOtpBtn.innerHTML = '<span>Verifying...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
            }

            try {
                await confirmationResult.confirm(enteredOtp);
            } catch (err) {
                console.error("Firebase OTP Verification Error:", err);
                showToast("Verification Failed: " + (err.message || "Invalid OTP code"));
                if (verifyOtpBtn) {
                    verifyOtpBtn.disabled = false;
                    verifyOtpBtn.innerHTML = '<span>Verify & Continue</span> <i class="fa-solid fa-circle-check"></i>';
                }
                return;
            }

            if (verifyOtpBtn) {
                verifyOtpBtn.disabled = false;
                verifyOtpBtn.innerHTML = '<span>Verify & Continue</span> <i class="fa-solid fa-circle-check"></i>';
            }

            // Set logged-in session mobile number
            SafeYatraDB.setLoggedInMobile(targetPhoneNumber);

            // Check if user exists in Firebase Firestore database
            const userCheck = await SafeYatraDB.checkUserExistsInFirestore(targetPhoneNumber);

            if (userCheck.exists && userCheck.data && userCheck.data.name) {
                // USER EXISTS -> Log in directly
                showToast("Welcome back, " + userCheck.data.name + "!");
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1000);
            } else {
                // USER DOES NOT EXIST -> Go to Step 3 Registration Form
                showToast("Phone verified! Complete registration.");
                if (regMobile) regMobile.value = targetPhoneNumber;
                goToStep(stepRegister);
            }
        });
    }

    // 5. STEP 3: Register New User & Save to Firebase
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newUserData = {
                name: regName.value.trim(),
                mobile: targetPhoneNumber,
                age: regAge.value.trim(),
                bloodGroup: regBloodGroup.value.trim(),
                emergencyContact: regEmergency.value.trim() || "7376712538",
                email: regEmail.value.trim(),
                address: regAddress.value.trim()
            };

            const saveBtn = document.getElementById('saveRegBtn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span>Saving to Firebase...</span> <i class="fa-solid fa-spinner fa-spin"></i>';
            }

            // Save user to Firebase Firestore and LocalStorage
            await SafeYatraDB.saveUserProfile(newUserData);

            showToast("Account Created in Firebase! Redirecting...");

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1200);
        });
    }

    // Helper: Step Panel Navigation
    function goToStep(targetPanel) {
        [stepMobile, stepOtp, stepRegister].forEach(panel => {
            if (panel) panel.classList.remove('active');
        });
        if (targetPanel) targetPanel.classList.add('active');
    }

    if (changePhoneBtn) {
        changePhoneBtn.addEventListener('click', () => {
            goToStep(stepMobile);
        });
    }

    // Resend Timer
    function startResendTimer() {
        let count = 30;
        if (resendTimer) resendTimer.textContent = count;
        if (resendOtpBtn) resendOtpBtn.disabled = true;

        const timer = setInterval(() => {
            count--;
            if (resendTimer) resendTimer.textContent = count;
            if (count <= 0) {
                clearInterval(timer);
                if (resendOtpBtn) resendOtpBtn.disabled = false;
            }
        }, 1000);
    }

    // Toast helper
    function showToast(msg) {
        const toastEl = document.getElementById('toast');
        if (!toastEl) return;
        toastEl.textContent = msg;
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3200);
    }
});
