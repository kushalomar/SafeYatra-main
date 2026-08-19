/**
 * TravelSathi - Nearby Tourist SOS Mesh Alert Network (1km Radius)
 * When a user holds the SOS button, broadcasts live GPS coordinates to Firestore & local mesh.
 * Any other TravelSathi user within a 1km radius receives an urgent audio & visual emergency modal
 * with direct in-app navigation to the distressed person's exact location.
 */

const NearbySOS = (function () {
    const RADIUS_LIMIT_KM = 1.0; // 1 km radius
    let alertAudioCtx = null;
    let alertToneInterval = null;
    let isAlertRinging = false;
    let activeAlertData = null;
    let sosBroadcastChannel = null;
    let hasShownForBroadcastId = new Set();

    // 1. Initialize BroadcastChannel for instant local & multi-tab mesh
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            sosBroadcastChannel = new BroadcastChannel('travelsathi_sos_channel');
            sosBroadcastChannel.onmessage = function (event) {
                if (event && event.data && event.data.type === 'SOS_BROADCAST') {
                    handleIncomingBroadcast(event.data.payload);
                } else if (event && event.data && event.data.type === 'SOS_RESOLVE') {
                    handleResolveBroadcast(event.data.payload);
                }
            };
        }
    } catch (e) {
        console.warn("BroadcastChannel not supported:", e);
    }

    // 2. Storage event fallback for cross-tab notifications
    window.addEventListener('storage', function (e) {
        if (e.key === 'travelsathi_live_sos_alert' && e.newValue) {
            try {
                const data = JSON.parse(e.newValue);
                if (data && data.status === 'active') {
                    handleIncomingBroadcast(data);
                } else if (data && data.status === 'resolved') {
                    handleResolveBroadcast(data);
                }
            } catch (err) { }
        }
    });

    /**
     * Broadcast an active SOS with current GPS coordinates to Firestore & Mesh
     */
    async function broadcastSOS(customData) {
        const loggedMobile = (typeof SafeYatraDB !== 'undefined' ? SafeYatraDB.getLoggedInMobile() : "") || localStorage.getItem('travelsathi_logged_mobile') || "9999999999";
        let userName = "TravelSathi Tourist";
        let userEmergency = "1234567890";
        let bloodGroup = "O+";

        if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.getUserProfile) {
            try {
                const prof = await SafeYatraDB.getUserProfile();
                if (prof) {
                    if (prof.name) userName = prof.name;
                    if (prof.emergencyContact) userEmergency = prof.emergencyContact;
                    if (prof.bloodGroup) bloodGroup = prof.bloodGroup;
                }
            } catch (e) { }
        }

        const lat = customData && customData.lat ? parseFloat(customData.lat) : 27.1767;
        const lng = customData && customData.lng ? parseFloat(customData.lng) : 78.0081;

        const broadcastId = `sos_${loggedMobile}_${Date.now()}`;
        const payload = {
            id: broadcastId,
            senderMobile: loggedMobile,
            senderName: userName,
            latitude: lat,
            longitude: lng,
            emergencyContact: userEmergency,
            bloodGroup: bloodGroup,
            message: "Emergency SOS! Immediate assistance required.",
            status: "active",
            createdAt: Date.now()
        };

        // 1. Save to Firestore if available
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                await db.collection('sos_broadcasts').doc(broadcastId).set({
                    ...payload,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log("TravelSathi SOS published to Firestore:", broadcastId);
            } catch (err) {
                console.warn("Firestore SOS write warning:", err.message);
            }
        }

        // 2. Broadcast across local mesh & storage
        if (sosBroadcastChannel) {
            sosBroadcastChannel.postMessage({ type: 'SOS_BROADCAST', payload: payload });
        }
        localStorage.setItem('travelsathi_live_sos_alert', JSON.stringify(payload));
        localStorage.setItem('travelsathi_my_active_sos_id', broadcastId);

        return payload;
    }

    /**
     * Resolve / Cancel an active SOS broadcast
     */
    async function resolveActiveSOS() {
        const activeId = localStorage.getItem('travelsathi_my_active_sos_id');
        const loggedMobile = (typeof SafeYatraDB !== 'undefined' ? SafeYatraDB.getLoggedInMobile() : "") || "9999999999";

        if (activeId && typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                await db.collection('sos_broadcasts').doc(activeId).update({
                    status: 'resolved',
                    resolvedAt: Date.now()
                });
            } catch (e) { }
        }

        const payload = { id: activeId, senderMobile: loggedMobile, status: 'resolved' };
        if (sosBroadcastChannel) {
            sosBroadcastChannel.postMessage({ type: 'SOS_RESOLVE', payload: payload });
        }
        localStorage.setItem('travelsathi_live_sos_alert', JSON.stringify(payload));
        localStorage.removeItem('travelsathi_my_active_sos_id');
    }

    /**
     * Start Real-Time Firestore & Mesh Listener for 1km SOS Broadcasts
     */
    function startListening() {
        injectAlertModalDOM();

        // 1. Listen to Firestore Live Collection
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                const thirtyMinsAgo = Date.now() - 30 * 60 * 1000;

                db.collection('sos_broadcasts')
                    .where('status', '==', 'active')
                    .onSnapshot((snapshot) => {
                        snapshot.docChanges().forEach((change) => {
                            if (change.type === 'added' || change.type === 'modified') {
                                const data = change.doc.data();
                                if (data && data.status === 'active' && (!data.createdAt || data.createdAt > thirtyMinsAgo)) {
                                    handleIncomingBroadcast(data);
                                }
                            }
                        });
                    }, (err) => {
                        console.warn("Firestore SOS Listener warning:", err.message);
                    });
            } catch (err) {
                console.warn("Firestore setup error:", err);
            }
        }
    }

    /**
     * Process Incoming SOS Broadcast & check 1km radius
     */
    function handleIncomingBroadcast(broadcast) {
        if (!broadcast || !broadcast.latitude || !broadcast.longitude) return;

        const myMobile = (typeof SafeYatraDB !== 'undefined' ? SafeYatraDB.getLoggedInMobile() : "") || localStorage.getItem('travelsathi_logged_mobile') || "";
        
        // Don't alert the user who triggered the SOS
        if (myMobile && broadcast.senderMobile && myMobile.replace(/\s+/g, '') === broadcast.senderMobile.replace(/\s+/g, '')) {
            return;
        }

        // Get Current Location to verify radius <= 1 km
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const myLat = pos.coords.latitude;
                const myLng = pos.coords.longitude;

                const distanceKm = calculateDistance(myLat, myLng, broadcast.latitude, broadcast.longitude);
                console.log(`[TravelSathi Nearby SOS] Broadcast received. Distance: ${distanceKm.toFixed(3)} km (Radius limit: ${RADIUS_LIMIT_KM} km)`);

                if (distanceKm <= RADIUS_LIMIT_KM) {
                    showNearbySOSAlert(broadcast, distanceKm);
                }
            }, (err) => {
                // If GPS is unavailable, trigger alert with estimated proximity
                console.warn("GPS unavailable for proximity check. Triggering alert fallback.");
                showNearbySOSAlert(broadcast, 0.45);
            }, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 10000
            });
        }
    }

    function handleResolveBroadcast(payload) {
        if (activeAlertData && activeAlertData.id === payload.id) {
            closeNearbySOSAlert();
        }
    }

    /**
     * Render & Display the Urgent Nearby SOS Modal
     */
    function showNearbySOSAlert(broadcast, distanceKm) {
        activeAlertData = broadcast;
        const modal = document.getElementById('travelSathiNearbySOSModal');
        if (!modal) return;

        const nameEl = document.getElementById('nearbySOSUserName');
        const distEl = document.getElementById('nearbySOSDistanceBadge');
        const timeEl = document.getElementById('nearbySOSTime');
        const phoneEl = document.getElementById('nearbySOSPhone');
        const navBtn = document.getElementById('nearbySOSNavigateBtn');
        const callBtn = document.getElementById('nearbySOSCallBtn');

        const distText = distanceKm < 1 
            ? `${Math.round(distanceKm * 1000)} meters away` 
            : `${distanceKm.toFixed(2)} km away`;

        if (nameEl) nameEl.textContent = broadcast.senderName || "Fellow Tourist";
        if (distEl) distEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> <strong>${distText}</strong> (Within 1 km safety radius)`;
        if (timeEl) timeEl.textContent = "Just now";
        if (phoneEl) phoneEl.textContent = broadcast.senderMobile ? `+91 ${broadcast.senderMobile}` : "Mobile available";

        if (callBtn && broadcast.senderMobile) {
            callBtn.href = `tel:${broadcast.senderMobile}`;
        }

        if (navBtn) {
            navBtn.onclick = function () {
                closeNearbySOSAlert();
                const url = `https://www.google.com/maps/dir/?api=1&destination=${broadcast.latitude},${broadcast.longitude}`;
                window.open(url, '_blank');
            };
        }

        modal.classList.add('active');

        // Play Attention Siren
        playAlertTone();

        if (navigator.vibrate) {
            navigator.vibrate([400, 200, 400, 200, 600]);
        }
    }

    function closeNearbySOSAlert() {
        const modal = document.getElementById('travelSathiNearbySOSModal');
        if (modal) modal.classList.remove('active');
        stopAlertTone();
        activeAlertData = null;
    }

    /**
     * Web Audio API Synthesized Emergency Alert Pulse
     */
    function playAlertTone() {
        if (isAlertRinging) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!alertAudioCtx) alertAudioCtx = new AudioContext();
            if (alertAudioCtx.state === 'suspended') alertAudioCtx.resume();

            isAlertRinging = true;
            let beepHigh = true;

            alertToneInterval = setInterval(() => {
                if (!isAlertRinging || !alertAudioCtx) return;
                const osc = alertAudioCtx.createOscillator();
                const gain = alertAudioCtx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(beepHigh ? 950 : 750, alertAudioCtx.currentTime);
                gain.gain.setValueAtTime(0.25, alertAudioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, alertAudioCtx.currentTime + 0.28);

                osc.connect(gain);
                gain.connect(alertAudioCtx.destination);

                osc.start();
                osc.stop(alertAudioCtx.currentTime + 0.3);
                beepHigh = !beepHigh;
            }, 380);

        } catch (e) {
            console.warn("Audio tone error:", e);
        }
    }

    function stopAlertTone() {
        isAlertRinging = false;
        if (alertToneInterval) {
            clearInterval(alertToneInterval);
            alertToneInterval = null;
        }
    }

    /**
     * Haversine formula to calculate distance between two coordinates in km
     */
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Inject Floating & Fullscreen Nearby SOS Modal HTML & CSS into DOM
     */
    function injectAlertDOM() {
        if (document.getElementById('travelSathiNearbySOSModal')) return;

        const modalHtml = `
        <div id="travelSathiNearbySOSModal" class="nearby-sos-modal-overlay">
            <div class="nearby-sos-card">
                <div class="nearby-sos-header">
                    <div class="nearby-sos-pulse-icon">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div class="nearby-sos-title-wrap">
                        <span class="nearby-sos-urgent-badge">🚨 CRITICAL EMERGENCY • 1KM RADIUS</span>
                        <h2 class="nearby-sos-heading">Nearby Tourist in Distress!</h2>
                    </div>
                </div>

                <div class="nearby-sos-body">
                    <div class="nearby-sos-dist-badge" id="nearbySOSDistanceBadge">
                        <i class="fa-solid fa-location-dot"></i> <strong>Calculating distance...</strong>
                    </div>

                    <div class="nearby-sos-tourist-box">
                        <div class="tourist-avatar">
                            <i class="fa-solid fa-user-shield"></i>
                        </div>
                        <div class="tourist-meta">
                            <h4 id="nearbySOSUserName">Fellow Tourist</h4>
                            <p id="nearbySOSPhone">+91 1234567890</p>
                            <span class="time-tag" id="nearbySOSTime">Just now</span>
                        </div>
                    </div>

                    <p class="nearby-sos-instruction">
                        A TravelSathi user within 1 km has triggered an emergency SOS. Please render assistance or notify local authorities immediately.
                    </p>
                </div>

                <div class="nearby-sos-actions">
                    <button id="nearbySOSNavigateBtn" class="sos-action-btn btn-nav-inapp">
                        <i class="fa-solid fa-diamond-turn-right"></i> Open Directions in Google Maps
                    </button>
                    <div class="sos-action-row">
                        <a id="nearbySOSCallBtn" href="tel:112" class="sos-action-btn btn-call-tourist">
                            <i class="fa-solid fa-phone"></i> Call Tourist
                        </a>
                        <a href="tel:112" class="sos-action-btn btn-call-police">
                            <i class="fa-solid fa-shield-halved"></i> Call 112
                        </a>
                    </div>
                    <button id="nearbySOSDismissBtn" class="sos-action-btn btn-dismiss">
                        Acknowledge & Dismiss
                    </button>
                </div>
            </div>
        </div>
        `;

        const styleEl = document.createElement('style');
        styleEl.textContent = `
        .nearby-sos-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.82);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            z-index: 999999;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 16px;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.35s ease, visibility 0.35s ease;
        }

        .nearby-sos-modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .nearby-sos-card {
            background: #FFFDF9;
            width: 100%;
            max-width: 440px;
            border-radius: 26px;
            border: 2px solid #EF4444;
            box-shadow: 0 20px 60px rgba(220, 38, 38, 0.45);
            overflow: hidden;
            animation: popInAlert 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .nearby-sos-header {
            background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
            color: #FFFFFF;
            padding: 18px 20px;
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .nearby-sos-pulse-icon {
            width: 48px;
            height: 48px;
            min-width: 48px;
            border-radius: 50%;
            background: #FFFFFF;
            color: #DC2626;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
            animation: pulseAlertIcon 1s infinite alternate;
        }

        .nearby-sos-urgent-badge {
            font-size: 10.5px;
            font-weight: 800;
            letter-spacing: 0.8px;
            background: rgba(0, 0, 0, 0.25);
            padding: 3px 8px;
            border-radius: 12px;
            color: #FEE2E2;
            display: inline-block;
        }

        .nearby-sos-heading {
            font-size: 18px;
            font-weight: 900;
            margin: 4px 0 0;
            color: #FFFFFF;
            line-height: 1.2;
        }

        .nearby-sos-body {
            padding: 18px 20px 10px;
        }

        .nearby-sos-dist-badge {
            background: #FEF2F2;
            border: 1.5px solid #FCA5A5;
            color: #B91C1C;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 13.5px;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 14px;
        }

        .nearby-sos-tourist-box {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #FAF6EE;
            border: 1px solid #E6DAC8;
            border-radius: 16px;
            padding: 12px 14px;
            margin-bottom: 12px;
        }

        .tourist-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: #14532D;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .tourist-meta h4 {
            font-size: 16px;
            font-weight: 800;
            color: #1E293B;
            margin: 0;
        }

        .tourist-meta p {
            font-size: 12px;
            color: #64748B;
            margin: 2px 0 0;
        }

        .tourist-meta .time-tag {
            font-size: 10px;
            font-weight: 700;
            color: #DC2626;
        }

        .nearby-sos-instruction {
            font-size: 13px;
            color: #475569;
            line-height: 1.45;
            margin: 0 0 6px;
        }

        .nearby-sos-actions {
            padding: 10px 20px 18px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .sos-action-row {
            display: flex;
            gap: 10px;
        }

        .sos-action-btn {
            padding: 12px 16px;
            border-radius: 14px;
            font-size: 14px;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-decoration: none;
            border: none;
            transition: all 0.2s ease;
        }

        .btn-nav-inapp {
            background: linear-gradient(135deg, #15803D 0%, #166534 100%);
            color: #FFFFFF;
            box-shadow: 0 6px 20px rgba(22, 101, 52, 0.35);
        }

        .btn-nav-inapp:hover {
            background: #14532D;
            transform: translateY(-2px);
        }

        .btn-call-tourist {
            flex: 1;
            background: #DC2626;
            color: #FFFFFF;
        }

        .btn-call-police {
            flex: 1;
            background: #1E40AF;
            color: #FFFFFF;
        }

        .btn-dismiss {
            background: #EBE2D3;
            color: #574D3F;
            font-size: 13px;
            font-weight: 700;
            padding: 9px;
        }

        .btn-dismiss:hover {
            background: #DFD5C4;
        }

        @keyframes popInAlert {
            from { opacity: 0; transform: scale(0.9) translateY(20px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes pulseAlertIcon {
            from { transform: scale(1); box-shadow: 0 0 10px rgba(255, 255, 255, 0.6); }
            to { transform: scale(1.1); box-shadow: 0 0 25px rgba(255, 255, 255, 1); }
        }
        `;

        document.head.appendChild(styleEl);
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const dismissBtn = document.getElementById('nearbySOSDismissBtn');
        if (dismissBtn) {
            dismissBtn.addEventListener('click', closeNearbySOSAlert);
        }
    }

    function injectAlertModalDOM() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', injectAlertDOM);
        } else {
            injectAlertDOM();
        }
    }

    /**
     * Test / Simulation Helper: Simulates a nearby user triggering SOS 400m away
     */
    function simulateNearbySOS(distKm) {
        getCurrentPositionFallback((pos) => {
            const myLat = pos.lat;
            const myLng = pos.lng;

            // Offset coordinates slightly (~400m)
            const simulatedLat = myLat + 0.0035;
            const simulatedLng = myLng + 0.0035;

            const simPayload = {
                id: `sim_sos_${Date.now()}`,
                senderMobile: "9876543210",
                senderName: "Priya Sharma (Tourist)",
                latitude: simulatedLat,
                longitude: simulatedLng,
                emergencyContact: "9876543210",
                bloodGroup: "B+",
                message: "Emergency SOS triggered! Nearby assistance requested.",
                status: "active",
                createdAt: Date.now()
            };

            console.log("Simulating Nearby SOS within 1km radius:", simPayload);
            handleIncomingBroadcast(simPayload);
        });
    }

    function getCurrentPositionFallback(cb) {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((p) => {
                cb({ lat: p.coords.latitude, lng: p.coords.longitude });
            }, () => {
                cb({ lat: 27.1767, lng: 78.0081 });
            }, { timeout: 3000 });
        } else {
            cb({ lat: 27.1767, lng: 78.0081 });
        }
    }

    // Auto-start listening on load
    startListening();

    return {
        broadcastSOS: broadcastSOS,
        resolveActiveSOS: resolveActiveSOS,
        startListening: startListening,
        simulateNearbySOS: simulateNearbySOS,
        calculateDistance: calculateDistance
    };
})();

// Attach to window
window.NearbySOS = NearbySOS;
