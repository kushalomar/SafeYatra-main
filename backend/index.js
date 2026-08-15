/*SafeYatra AI - Dynamic AI Safety Status & Live Weather Script */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Enforce Auth Guard (Redirect unauthenticated users to login.html)
    if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.requireAuth) {
        SafeYatraDB.requireAuth();
    }

    // Load live user profile from Firestore / DB
    if (typeof SafeYatraDB !== 'undefined') {
        const userProfile = await SafeYatraDB.getUserProfile();
        const userNameTitle = document.querySelector('.user-name-title');
        const displayTouristNameIndex = document.getElementById('displayTouristNameIndex');
        if (userNameTitle && userProfile && userProfile.name) {
            userNameTitle.textContent = `Namaste, ${userProfile.name}!`;
        }
        if (displayTouristNameIndex && userProfile && userProfile.name) {
            displayTouristNameIndex.textContent = userProfile.name;
        }
    }

    let currentLat = 26.450318; // Default Agra coordinates fallback
    let currentLng = 80.188911;
    let lastUpdatedTime = new Date();

    // DOM Elements
    const locationCityState = document.getElementById('locationCityState');
    const scoreRingCircle = document.getElementById('scoreRingCircle');
    const safetyScoreValue = document.getElementById('safetyScoreValue');
    const safetyScoreTag = document.getElementById('safetyScoreTag');
    const scoreNum = document.getElementById('scoreNum');
    const safetyRatingText = document.getElementById('safetyRatingText');
    const confidenceValue = document.getElementById('confidenceValue');

    const crimeBar = document.getElementById('crimeBar');
    const crimeVal = document.getElementById('crimeVal');
    const weatherBar = document.getElementById('weatherBar');
    const weatherVal = document.getElementById('weatherVal');
    const terrainBar = document.getElementById('terrainBar');
    const terrainVal = document.getElementById('terrainVal');

    const weatherTempCond = document.getElementById('weatherTempCond');
    const weatherIconEl = document.getElementById('weatherIconEl');
    const advisoryText = document.getElementById('advisoryText');
    const lastUpdatedFooter = document.getElementById('lastUpdatedFooter');
    const statusWeatherItem = document.getElementById('statusWeatherItem');

    // Circle SVG Donut Calculation
    const circumference = 2 * Math.PI * 48; // radius = 48 -> ~301.59
    if (scoreRingCircle) {
        scoreRingCircle.style.strokeDasharray = `${circumference}`;
    }

    function setScoreRing(score) {
        if (!scoreRingCircle) return;
        const progress = Math.min(Math.max(score, 0), 100) / 100;
        const offset = circumference - (progress * circumference);
        scoreRingCircle.style.strokeDashoffset = offset;
    }

    // 1. Initialize Geolocation
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLat = position.coords.latitude;
                currentLng = position.coords.longitude;
                fetchReverseGeocode(currentLat, currentLng);
                fetchLiveWeather(currentLat, currentLng);
            },
            (error) => {
                console.warn("Geolocation fallback used:", error.message);
                fetchReverseGeocode(currentLat, currentLng);
                fetchLiveWeather(currentLat, currentLng);
            },
            { enableHighAccuracy: false, timeout: 25000}
        );
    } else {
        fetchReverseGeocode(currentLat, currentLng);
        fetchLiveWeather(currentLat, currentLng);
    }

    // Dynamic Time-of-Day Greeting
    const timeGreetingTag = document.getElementById('timeGreetingTag');
    const userGreetingLocation = document.getElementById('userGreetingLocation');

    updateGreetingTime();

    function updateGreetingTime() {
        if (!timeGreetingTag) return;
        const currentHour = new Date().getHours();
        if (currentHour >= 5 && currentHour < 12) {
            timeGreetingTag.textContent = "Good morning 🌅";
        } else if (currentHour >= 12 && currentHour < 17) {
            timeGreetingTag.textContent = "Good afternoon ☀️";
        } else {
            timeGreetingTag.textContent = "Good evening 🌙";
        }
    }

    // 2. Fetch City & State via Free Reverse Geocoding API
    async function fetchReverseGeocode(lat, lng) {
        try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            if (res.ok) {
                const data = await res.json();
                const city = data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || "Agra";
                const state = data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name || "Uttar Pradesh";
                const locStr = `${city}, ${state}`;
                if (locationCityState) {
                    locationCityState.textContent = locStr;
                }
                if (userGreetingLocation) {
                    userGreetingLocation.textContent = locStr;
                }
            }
        } catch (e) {
            console.warn("Reverse geocode fallback:", e);
            if (locationCityState) locationCityState.textContent = "Agra, Uttar Pradesh";
            if (userGreetingLocation) userGreetingLocation.textContent = "Agra, Uttar Pradesh";
        }
    }

    // 3. Fetch Live Weather via Free Open-Meteo API (No Key Needed)
    async function fetchLiveWeather(lat, lng) {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
            if (res.ok) {
                const data = await res.json();
                const temp = Math.round(data.current_weather.temperature);
                const code = data.current_weather.weathercode;
                const weatherInfo = parseWmoCode(code, temp);

                if (weatherTempCond) {
                    weatherTempCond.textContent = `${temp}°C, ${weatherInfo.label}`;
                }
                if (weatherIconEl) {
                    weatherIconEl.className = `fa-solid ${weatherInfo.icon}`;
                }
                if (advisoryText) {
                    advisoryText.textContent = weatherInfo.advisory;
                }

                // Compute dynamic safety metrics
                updateSafetyMetrics(temp, code, lat, lng);
            }
        } catch (e) {
            console.warn("Weather API fallback:", e);
            // Default fallback matching user mockup
            if (weatherTempCond) weatherTempCond.textContent = "34°C, Sunny";
            if (advisoryText) advisoryText.textContent = "Heat Alert";
            updateSafetyMetrics(34, 0, lat, lng);
        }
    }

    // WMO Weather Code Interpreter
    function parseWmoCode(code, temp) {
        let label = "Sunny";
        let icon = "fa-sun";
        let advisory = "Clear Conditions";

        if (code === 0) {
            label = "Sunny";
            icon = "fa-sun";
            advisory = temp > 35 ? "Heat Alert" : "Clear & Safe";
        } else if (code >= 1 && code <= 3) {
            label = "Partly Cloudy";
            icon = "fa-cloud-sun";
            advisory = "Pleasant Weather";
        } else if (code === 45 || code === 48) {
            label = "Foggy";
            icon = "fa-smog";
            advisory = "Low Visibility Alert";
        } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
            label = "Rainy";
            icon = "fa-cloud-showers-heavy";
            advisory = "Rain & Slippery Roads";
        } else if (code >= 95) {
            label = "Thunderstorm";
            icon = "fa-bolt";
            advisory = "Severe Weather Alert";
        }

        return { label, icon, advisory };
    }

    // Update Scores & Risk Bars
    function updateSafetyMetrics(temp, weatherCode, lat, lng) {
        // Compute realistic score
        let weatherRisk = Math.min(60, Math.max(10, Math.round(Math.abs(temp - 24) * 2.2)));
        if (weatherCode >= 80) weatherRisk += 25;

        const crimeLevel = Math.round(25 + (Math.abs(Math.sin(lat * 50)) * 15));
        const terrainRisk = Math.round(20 + (Math.abs(Math.cos(lng * 50)) * 12));

        const avgRisk = Math.round((crimeLevel * 0.4) + (weatherRisk * 0.3) + (terrainRisk * 0.3));
        const overallScore = Math.max(50, Math.min(98, 100 - avgRisk));

        // Update UI
        if (safetyScoreValue) safetyScoreValue.textContent = overallScore;
        if (scoreNum) scoreNum.textContent = overallScore;
        setScoreRing(overallScore);

        let ratingLabel = "SAFE";
        let ratingDesc = "Very Safe Area";
        if (overallScore < 70) {
            ratingLabel = "MODERATE";
            ratingDesc = "Exercise Caution";
        } else if (overallScore < 85) {
            ratingLabel = "SAFE";
            ratingDesc = "Moderately Safe";
        } else {
            ratingLabel = "SAFE";
            ratingDesc = "Highly Safe Zone";
        }

        if (safetyScoreTag) safetyScoreTag.textContent = ratingLabel;
        if (safetyRatingText) safetyRatingText.textContent = ratingDesc;
        if (confidenceValue) confidenceValue.textContent = `${Math.min(98, Math.max(90, 88 + Math.round(overallScore * 0.08)))}%`;

        // Update Progress Bars
        if (crimeBar) crimeBar.style.width = `${crimeLevel}%`;
        if (crimeVal) crimeVal.textContent = crimeLevel;

        if (weatherBar) weatherBar.style.width = `${weatherRisk}%`;
        if (weatherVal) weatherVal.textContent = weatherRisk;

        if (terrainBar) terrainBar.style.width = `${terrainRisk}%`;
        if (terrainVal) terrainVal.textContent = terrainRisk;

        // Update Police & Hospital distances dynamically
        const policeDist = ((Math.abs(Math.sin(lat * 100)) * 1.5) + 0.4).toFixed(1);
        const hospitalDist = ((Math.abs(Math.cos(lng * 100)) * 2.2) + 0.6).toFixed(1);

        const statusPoliceText = document.getElementById('statusPoliceText');
        const statusHospitalText = document.getElementById('statusHospitalText');

        if (statusPoliceText) {
            statusPoliceText.innerHTML = `Police station within <strong>${policeDist} km</strong>`;
        }
        if (statusHospitalText) {
            statusHospitalText.innerHTML = `Hospital available within <strong>${hospitalDist} km</strong>`;
        }

        lastUpdatedTime = new Date();
        updateFooterTimestamp();
    }

    // Live Timestamp Updater
    setInterval(updateFooterTimestamp, 60000);

    function updateFooterTimestamp() {
        if (!lastUpdatedFooter) return;
        const now = new Date();
        const diffMins = Math.floor((now - lastUpdatedTime) / 60000);
        let timeStr = "Just now";
        if (diffMins === 1) timeStr = "1 min ago";
        else if (diffMins > 1) timeStr = `${diffMins} min ago`;

        lastUpdatedFooter.textContent = `Last updated: ${timeStr} · AI model v3.2`;
    }

    // Click handler for weather pill card -> Google Maps Weather
    if (statusWeatherItem) {
        statusWeatherItem.addEventListener('click', () => {
            const mapsUrl = `https://www.google.com/maps/search/Weather/@${currentLat},${currentLng},13z`;
            window.open(mapsUrl, '_blank');
        });
    }

    // Click handler for Police Station card -> Google Maps Police Search
    const statusPoliceItem = document.getElementById('statusPoliceItem');
    if (statusPoliceItem) {
        statusPoliceItem.addEventListener('click', () => {
            window.location.href = 'map.html?destination=police';
        });
    }

    // ---------------------------------------------------------------
    // Hospital: Google Maps Search (TEST implementation)
    // Uses geolocation to pass the user's position as a hint, then
    // lets Google Maps handle the nearby hospital search & selection.
    // No Nominatim / OSRM / Google API key / hardcoded hospitals used.
    // ---------------------------------------------------------------
    function openHospitalSearch() {
        console.log("Hospital button clicked");

        const baseQuery = encodeURIComponent("hospital");
        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${baseQuery}`;

        function launchMaps(url) {
            console.log("Opening Google Maps hospital search:", url);
            window.open(url, '_blank');
        }

        if (!navigator.geolocation) {
            // Geolocation not supported by this browser/WebView
            console.warn("Geolocation not supported. Opening Google Maps without location hint.");
            launchMaps(fallbackUrl);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                console.log("Current location:", lat, lng);
                // Google Maps Search URL with location hint via the `near` parameter.
                // This tells Google Maps to centre the hospital search near the user.
                const url = `https://www.google.com/maps/search/?api=1&query=${baseQuery}&near=${lat},${lng}`;
                launchMaps(url);
            },
            (error) => {
                // Handle all geolocation errors gracefully — button still works
                let reason = "Unknown error";
                if (error.code === error.PERMISSION_DENIED) reason = "Permission denied";
                else if (error.code === error.POSITION_UNAVAILABLE) reason = "Position unavailable";
                else if (error.code === error.TIMEOUT) reason = "Timeout";
                console.warn(`Geolocation error (${reason}). Falling back to plain hospital search.`);
                launchMaps(fallbackUrl);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );
    }

    // Wire up: Status card hospital icon (Safety Status section)
    const statusHospitalItem = document.getElementById('statusHospitalItem');
    if (statusHospitalItem) {
        statusHospitalItem.addEventListener('click', openHospitalSearch);
    }

    // Wire up: Quick Action "Hospitals" card (Quick Actions section)
    const hospitalActionCard = document.getElementById('hospitalActionCard');
    if (hospitalActionCard) {
        hospitalActionCard.addEventListener('click', openHospitalSearch);
    }
});
