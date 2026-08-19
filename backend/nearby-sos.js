/**
 * TravelSathi - Live 1km Radius Nearby Tourist SOS Mesh & Alert Network
 * When any user triggers SOS, broadcasts real-time GPS coordinates via Firestore & BroadcastChannel.
 * All active TravelSathi users within 1 km receive an instant audio-visual emergency alert modal
 * with direct 1-tap Google Maps directions to the distressed person.
 */

const NearbySOS = (function () {
    const RADIUS_LIMIT_KM = 1.0; // 1.0 km radius threshold
    
    // Unique session ID for this specific browser tab/window (enables multi-tab & multi-device isolation)
    let tabSessionId = sessionStorage.getItem('travelsathi_tab_session_id');
    if (!tabSessionId) {
        tabSessionId = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
        sessionStorage.setItem('travelsathi_tab_session_id', tabSessionId);
    }

    // Set of dismissed/rejected broadcast IDs so a dismissed alert NEVER re-triggers
    let dismissedAlertIds = new Set();
    try {
        const storedDismissed = sessionStorage.getItem('travelsathi_dismissed_sos_ids');
        if (storedDismissed) {
            JSON.parse(storedDismissed).forEach(id => dismissedAlertIds.add(id));
        }
    } catch (e) { }

    let alertAudioCtx = null;
    let alertToneInterval = null;
    let isAlertRinging = false;
    let activeAlertData = null;
    let sosBroadcastChannel = null;
    let cachedUserLocation = null;
    let pollingInterval = null;

    // 1. Keep track of user's current GPS position
    initLocationTracker();

    function initLocationTracker() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                cachedUserLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                try {
                    sessionStorage.setItem('travelsathi_last_lat', pos.coords.latitude);
                    sessionStorage.setItem('travelsathi_last_lng', pos.coords.longitude);
                } catch (e) { }
            }, () => { }, { enableHighAccuracy: true, timeout: 5000 });

            navigator.geolocation.watchPosition((pos) => {
                cachedUserLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            }, () => { }, { enableHighAccuracy: true, maximumAge: 10000 });
        }
    }

    // 2. Initialize BroadcastChannel for instant local & multi-tab mesh
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            sosBroadcastChannel = new BroadcastChannel('travelsathi_sos_channel');
            sosBroadcastChannel.onmessage = function (event) {
                if (event && event.data) {
                    if (event.data.type === 'SOS_BROADCAST') {
                        handleIncomingBroadcast(event.data.payload, event.data.senderTabId);
                    } else if (event.data.type === 'SOS_RESOLVE') {
                        handleResolveBroadcast(event.data.payload);
                    }
                }
            };
        }
    } catch (e) {
        console.warn("BroadcastChannel note:", e);
    }

    // 3. Storage event fallback for cross-tab communication
    window.addEventListener('storage', function (e) {
        if (e.key === 'travelsathi_live_sos_alert' && e.newValue) {
            try {
                const item = JSON.parse(e.newValue);
                if (item && item.payload) {
                    if (item.type === 'SOS_BROADCAST' && item.payload.status === 'active') {
                        handleIncomingBroadcast(item.payload, item.senderTabId);
                    } else if (item.type === 'SOS_RESOLVE') {
                        handleResolveBroadcast(item.payload);
                    }
                }
            } catch (err) { }
        }
    });

    /**
     * Broadcast an active SOS with current GPS coordinates to Firestore & Local Mesh
     */
    async function broadcastSOS(customCoords) {
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

        let lat = customCoords && customCoords.lat ? parseFloat(customCoords.lat) : (cachedUserLocation ? cachedUserLocation.lat : null);
        let lng = customCoords && customCoords.lng ? parseFloat(customCoords.lng) : (cachedUserLocation ? cachedUserLocation.lng : null);

        if (!lat || !lng) {
            lat = parseFloat(sessionStorage.getItem('travelsathi_last_lat')) || 27.1767;
            lng = parseFloat(sessionStorage.getItem('travelsathi_last_lng')) || 78.0081;
        }

        const broadcastId = `sos_${loggedMobile}_${Date.now()}`;
        const payload = {
            id: broadcastId,
            senderMobile: loggedMobile,
            senderName: userName,
            senderTabId: tabSessionId,
            latitude: lat,
            longitude: lng,
            emergencyContact: userEmergency,
            bloodGroup: bloodGroup,
            message: "Emergency SOS! Immediate assistance required.",
            status: "active",
            createdAt: Date.now()
        };

        // 1. Publish to Firestore Database
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                await db.collection('sos_broadcasts').doc(broadcastId).set({
                    ...payload,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log("[TravelSathi 1km SOS] Broadcast published to Firestore:", broadcastId);
            } catch (err) {
                console.warn("Firestore SOS write notice:", err.message);
            }
        }

        // 2. Broadcast across local mesh & storage
        const broadcastMsg = { type: 'SOS_BROADCAST', senderTabId: tabSessionId, payload: payload };
        if (sosBroadcastChannel) {
            sosBroadcastChannel.postMessage(broadcastMsg);
        }
        localStorage.setItem('travelsathi_live_sos_alert', JSON.stringify(broadcastMsg));
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
        const resolveMsg = { type: 'SOS_RESOLVE', senderTabId: tabSessionId, payload: payload };

        if (sosBroadcastChannel) {
            sosBroadcastChannel.postMessage(resolveMsg);
        }
        localStorage.setItem('travelsathi_live_sos_alert', JSON.stringify(resolveMsg));
        localStorage.removeItem('travelsathi_my_active_sos_id');
    }

    /**
     * Start Real-Time Firestore & Mesh Listeners for 1km SOS Broadcasts
     */
    function startListening() {
        injectAlertModalDOM();

        // 1. Live Firestore Listener
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            try {
                const db = firebase.firestore();
                const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;

                db.collection('sos_broadcasts')
                    .where('status', '==', 'active')
                    .onSnapshot((snapshot) => {
                        snapshot.docChanges().forEach((change) => {
                            if (change.type === 'added' || change.type === 'modified') {
                                const data = change.doc.data();
                                if (data && data.status === 'active' && (!data.createdAt || data.createdAt > fifteenMinsAgo)) {
                                    handleIncomingBroadcast(data, data.senderTabId);
                                }
                            }
                        });
                    }, (err) => {
                        console.warn("Firestore listener notice:", err.message);
                    });
            } catch (err) {
                console.warn("Firestore setup notice:", err);
            }
        }

        // 2. Periodic Polling fallback (every 5 seconds)
        if (!pollingInterval) {
            pollingInterval = setInterval(pollActiveAlerts, 5000);
        }
    }

    async function pollActiveAlerts() {
        if (typeof firebase === 'undefined' || !firebase.firestore) return;
        try {
            const db = firebase.firestore();
            const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
            const snap = await db.collection('sos_broadcasts').where('status', '==', 'active').get();
            snap.forEach(doc => {
                const data = doc.data();
                const alertId = data.id || doc.id;
                // Skip if already dismissed
                if (alertId && dismissedAlertIds.has(alertId)) {
                    return;
                }
                if (data && data.status === 'active' && (!data.createdAt || data.createdAt > fifteenMinsAgo)) {
                    handleIncomingBroadcast(data, data.senderTabId);
                }
            });
        } catch (e) { }
    }

    /**
     * Process Incoming SOS Broadcast & check 1km radius
     */
    function handleIncomingBroadcast(broadcast, senderTab) {
        if (!broadcast || !broadcast.latitude || !broadcast.longitude) return;

        const alertId = broadcast.id;

        // CRITICAL FIX: If user has dismissed/rejected this alert ID, NEVER show it again
        if (alertId && dismissedAlertIds.has(alertId)) {
            return;
        }

        // If this alert is already currently being shown on screen, don't duplicate
        if (activeAlertData && activeAlertData.id === alertId) {
            return;
        }

        // Prevent self-alerting in the exact same tab that pressed SOS
        if (senderTab && senderTab === tabSessionId) {
            return;
        }

        // Fast-path: Check against cached location
        if (cachedUserLocation) {
            checkProximityAndAlert(cachedUserLocation.lat, cachedUserLocation.lng, broadcast);
            return;
        }

        // Fresh GPS check
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                cachedUserLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                checkProximityAndAlert(pos.coords.latitude, pos.coords.longitude, broadcast);
            }, () => {
                // If GPS is disabled, use last known or default proximity
                const fallbackLat = parseFloat(sessionStorage.getItem('travelsathi_last_lat')) || 27.1767;
                const fallbackLng = parseFloat(sessionStorage.getItem('travelsathi_last_lng')) || 78.0081;
                checkProximityAndAlert(fallbackLat, fallbackLng, broadcast);
            }, {
                enableHighAccuracy: true,
                timeout: 3500,
                maximumAge: 15000
            });
        } else {
            checkProximityAndAlert(27.1767, 78.0081, broadcast);
        }
    }

    function checkProximityAndAlert(myLat, myLng, broadcast) {
        const alertId = broadcast.id;
        if (alertId && dismissedAlertIds.has(alertId)) {
            return;
        }

        const distanceKm = calculateDistance(myLat, myLng, broadcast.latitude, broadcast.longitude);
        console.log(`[TravelSathi Nearby SOS Proximity] Distance: ${(distanceKm * 1000).toFixed(0)}m (Radius threshold: 1000m)`);

        // Check if within 1km radius (1.0 km)
        if (distanceKm <= RADIUS_LIMIT_KM) {
            showNearbySOSAlert(broadcast, distanceKm);
        }
    }

    function handleResolveBroadcast(payload) {
        if (activeAlertData && payload && (activeAlertData.id === payload.id || activeAlertData.senderMobile === payload.senderMobile)) {
            closeNearbySOSAlert();
        }
    }

    /**
     * Render & Display the Urgent Nearby SOS Modal
     */
    function showNearbySOSAlert(broadcast, distanceKm) {
        const alertId = broadcast.id;
        if (alertId && dismissedAlertIds.has(alertId)) {
            return;
        }

        activeAlertData = broadcast;
        const modal = document.getElementById('travelSathiNearbySOSModal');
        if (!modal) return;

        const nameEl = document.getElementById('nearbySOSUserName');
        const distEl = document.getElementById('nearbySOSDistanceBadge');
        const timeEl = document.getElementById('nearbySOSTime');
        const phoneEl = document.getElementById('nearbySOSPhone');
        const navBtn = document.getElementById('nearbySOSNavigateBtn');
        const callBtn = document.getElementById('nearbySOSCallBtn');

        const distMeters = Math.round(distanceKm * 1000);
        const distText = distMeters < 1000 
            ? `${distMeters} meters away from you` 
            : `${distanceKm.toFixed(2)} km away from you`;

        if (nameEl) nameEl.textContent = broadcast.senderName || "Fellow Tourist";
        if (distEl) distEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> <strong>${distText}</strong> (Within 1 km safety radius)`;
        if (timeEl) timeEl.textContent = "Just now • LIVE ALERT";
        if (phoneEl) phoneEl.textContent = broadcast.senderMobile ? `+91 ${broadcast.senderMobile}` : "Emergency Contact Available";

        if (callBtn && broadcast.senderMobile) {
            callBtn.href = `tel:${broadcast.senderMobile}`;
        }

        // Open live directions in Google Maps
        if (navBtn) {
            navBtn.onclick = function () {
                // Dismiss alert permanently on navigation
                dismissNearbySOSAlert();
                const url = `https://www.google.com/maps/dir/?api=1&destination=${broadcast.latitude},${broadcast.longitude}`;
                window.open(url, '_blank');
            };
        }

        modal.classList.add('active');

        // Play Attention Alarm
        playAlertTone();

        if (navigator.vibrate) {
            navigator.vibrate([400, 200, 400, 200, 600]);
        }
    }

    /**
     * Dismiss / Reject the alert permanently for this session so it NEVER re-opens
     */
    function dismissNearbySOSAlert() {
        if (activeAlertData && activeAlertData.id) {
            dismissedAlertIds.add(activeAlertData.id);
            try {
                sessionStorage.setItem('travelsathi_dismissed_sos_ids', JSON.stringify(Array.from(dismissedAlertIds)));
            } catch (e) { }
            console.log("[TravelSathi Nearby SOS] Alert permanently dismissed:", activeAlertData.id);
        }
        closeNearbySOSAlert();
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
            console.warn("Audio tone note:", e);
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
     * Haversine distance formula in kilometers
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
     * Inject Emergency Modal HTML & CSS into DOM
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
                        <span class="nearby-sos-urgent-badge">🚨 LIVE 1KM PROXIMITY ALERT</span>
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
                            <span class="time-tag" id="nearbySOSTime">Just now • LIVE</span>
                        </div>
                    </div>

                    <p class="nearby-sos-instruction">
                        A TravelSathi user within 1 km has triggered an emergency SOS. Please open Google Maps directions to render assistance or alert authorities immediately.
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
            dismissBtn.addEventListener('click', dismissNearbySOSAlert);
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
     * Test / Simulation Helper: Simulates a real nearby tourist SOS alert 350m away
     */
    function simulateNearbySOS() {
        const curLat = cachedUserLocation ? cachedUserLocation.lat : 27.1767;
        const curLng = cachedUserLocation ? cachedUserLocation.lng : 78.0081;

        // Offset coordinates by ~350 meters
        const simulatedLat = curLat + 0.0031;
        const simulatedLng = curLng + 0.0031;

        const simPayload = {
            id: `sim_sos_${Date.now()}`,
            senderMobile: "9876543210",
            senderName: "Priya Sharma (Tourist)",
            latitude: simulatedLat,
            longitude: simulatedLng,
            emergencyContact: "9876543210",
            bloodGroup: "B+",
            message: "Emergency SOS triggered! Immediate assistance requested.",
            status: "active",
            createdAt: Date.now()
        };

        console.log("[TravelSathi] Simulating 1km Nearby SOS Alert:", simPayload);
        showNearbySOSAlert(simPayload, 0.35);
    }

    // Auto-start listening on script load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startListening);
    } else {
        startListening();
    }

    return {
        broadcastSOS: broadcastSOS,
        resolveActiveSOS: resolveActiveSOS,
        startListening: startListening,
        simulateNearbySOS: simulateNearbySOS,
        calculateDistance: calculateDistance,
        dismissNearbySOSAlert: dismissNearbySOSAlert
    };
})();

// Attach to window
window.NearbySOS = NearbySOS;
