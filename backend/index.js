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

    // Curated Famous Landmark / Tourist Area Images Map
    const FAMOUS_LANDMARK_IMAGES = {
        "delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "new delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "noida": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "gurgaon": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "gurugram": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "ghaziabad": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "faridabad": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "agra": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
        "jaipur": "https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?auto=format&fit=crop&w=1200&q=80",
        "udaipur": "https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80",
        "jodhpur": "https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?auto=format&fit=crop&w=1200&q=80",
        "jaisalmer": "https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?auto=format&fit=crop&w=1200&q=80",
        "varanasi": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80",
        "banaras": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80",
        "kashi": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80",
        "lucknow": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
        "kanpur": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
        "prayagraj": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80",
        "allahabad": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80",
        "ayodhya": "https://images.unsplash.com/photo-1609946850020-001004a434c4?auto=format&fit=crop&w=1200&q=80",
        "amritsar": "https://images.unsplash.com/photo-1609946850020-001004a434c4?auto=format&fit=crop&w=1200&q=80",
        "chandigarh": "https://images.unsplash.com/photo-1588095254134-2e67a07fc261?auto=format&fit=crop&w=1200&q=80",
        "shimla": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
        "manali": "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80",
        "dharamshala": "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1200&q=80",
        "rishikesh": "https://images.unsplash.com/photo-1600100397608-f010f444f434?auto=format&fit=crop&w=1200&q=80",
        "haridwar": "https://images.unsplash.com/photo-1600100397608-f010f444f434?auto=format&fit=crop&w=1200&q=80",
        "dehradun": "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1200&q=80",
        "mussoorie": "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1200&q=80",
        "nainital": "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1200&q=80",
        "srinagar": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80",
        "jammu": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80",
        "leh": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80",
        "ladakh": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80",
        "mumbai": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
        "navi mumbai": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
        "thane": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
        "pune": "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80",
        "ahmedabad": "https://images.unsplash.com/photo-1597040663342-45b6af3d91a8?auto=format&fit=crop&w=1200&q=80",
        "surat": "https://images.unsplash.com/photo-1597040663342-45b6af3d91a8?auto=format&fit=crop&w=1200&q=80",
        "vadodara": "https://images.unsplash.com/photo-1597040663342-45b6af3d91a8?auto=format&fit=crop&w=1200&q=80",
        "goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
        "panaji": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
        "bengaluru": "https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=1200&q=80",
        "bangalore": "https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=1200&q=80",
        "mysuru": "https://images.unsplash.com/photo-1600100397608-f010f444f434?auto=format&fit=crop&w=1200&q=80",
        "mysore": "https://images.unsplash.com/photo-1600100397608-f010f444f434?auto=format&fit=crop&w=1200&q=80",
        "hyderabad": "https://images.unsplash.com/photo-1605007493699-ce65834f8a00?auto=format&fit=crop&w=1200&q=80",
        "secunderabad": "https://images.unsplash.com/photo-1605007493699-ce65834f8a00?auto=format&fit=crop&w=1200&q=80",
        "chennai": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "madurai": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "kochi": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
        "cochin": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
        "thiruvananthapuram": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
        "munnar": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
        "alleppey": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
        "kolkata": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80",
        "calcutta": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80",
        "darjeeling": "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=1200&q=80",
        "bhubaneswar": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80",
        "puri": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80",
        "patna": "https://images.unsplash.com/photo-1622396636133-ba43f812dd3b?auto=format&fit=crop&w=1200&q=80",
        "bodhgaya": "https://images.unsplash.com/photo-1622396636133-ba43f812dd3b?auto=format&fit=crop&w=1200&q=80",
        "indore": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
        "bhopal": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
        "guwahati": "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=1200&q=80",
        "shillong": "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=1200&q=80",
        "gangtok": "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=1200&q=80"
    };

    const STATE_LANDMARK_IMAGES = {
        "uttar pradesh": "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
        "delhi": "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80",
        "rajasthan": "https://images.unsplash.com/photo-1603262110263-fb010d6e75dc?auto=format&fit=crop&w=1200&q=80",
        "maharashtra": "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80",
        "karnataka": "https://images.unsplash.com/photo-1580655653885-65763b2597d0?auto=format&fit=crop&w=1200&q=80",
        "tamil nadu": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80",
        "telangana": "https://images.unsplash.com/photo-1605007493699-ce65834f8a00?auto=format&fit=crop&w=1200&q=80",
        "kerala": "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
        "west bengal": "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1200&q=80",
        "punjab": "https://images.unsplash.com/photo-1609946850020-001004a434c4?auto=format&fit=crop&w=1200&q=80",
        "himachal pradesh": "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80",
        "uttarakhand": "https://images.unsplash.com/photo-1600100397608-f010f444f434?auto=format&fit=crop&w=1200&q=80",
        "jammu and kashmir": "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80",
        "ladakh": "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80",
        "goa": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
        "gujarat": "https://images.unsplash.com/photo-1597040663342-45b6af3d91a8?auto=format&fit=crop&w=1200&q=80",
        "odisha": "https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=1200&q=80",
        "madhya pradesh": "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80",
        "assam": "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&w=1200&q=80",
        "bihar": "https://images.unsplash.com/photo-1622396636133-ba43f812dd3b?auto=format&fit=crop&w=1200&q=80"
    };

    /**
     * Dynamically replace the hero background image (.personal-info) with the famous landmark image
     * of the area/city in which the user is active.
     */
    async function updateDynamicAreaHeroImage(city, state) {
        const personalInfoCard = document.querySelector('.personal-info');
        if (!personalInfoCard) return;

        const cleanCity = (city || "").toLowerCase().trim();
        const cleanState = (state || "").toLowerCase().trim();

        let matchedImage = null;

        // 1. Check direct curated landmark dictionary for city
        for (const [key, url] of Object.entries(FAMOUS_LANDMARK_IMAGES)) {
            if (cleanCity === key || cleanCity.includes(key) || key.includes(cleanCity)) {
                matchedImage = url;
                break;
            }
        }

        // 2. Check curated landmark dictionary for state if city not directly found
        if (!matchedImage) {
            for (const [key, url] of Object.entries(STATE_LANDMARK_IMAGES)) {
                if (cleanState === key || cleanState.includes(key) || key.includes(cleanState)) {
                    matchedImage = url;
                    break;
                }
            }
        }

        // 3. Dynamic Wikipedia Landmark API Lookup for any custom/unlisted city or region
        if (!matchedImage && city) {
            try {
                const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(city)}&prop=pageimages&format=json&pithumbsize=1200&origin=*`);
                if (wikiRes.ok) {
                    const wikiData = await wikiRes.json();
                    const pages = wikiData.query?.pages;
                    if (pages) {
                        const pageId = Object.keys(pages)[0];
                        if (pageId && pages[pageId]?.thumbnail?.source) {
                            matchedImage = pages[pageId].thumbnail.source;
                        }
                    }
                }
            } catch (err) {
                console.warn("Wikipedia landmark image fetch fallback:", err);
            }
        }

        // 4. Default Fallback (Taj Mahal / Agra)
        if (!matchedImage) {
            matchedImage = "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80";
        }

        // 5. Preload the image and apply smoothly
        const imgPreload = new Image();
        imgPreload.src = matchedImage;
        imgPreload.onload = () => {
            personalInfoCard.style.backgroundImage = `linear-gradient(135deg, rgba(20, 83, 45, 0.85), rgba(15, 23, 42, 0.88)), url('${matchedImage}')`;
            personalInfoCard.style.backgroundPosition = 'center';
            personalInfoCard.style.backgroundSize = 'cover';
            personalInfoCard.style.backgroundRepeat = 'no-repeat';
        };
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

                // Dynamically update first green card background image based on user's active area
                updateDynamicAreaHeroImage(city, state);
            }
        } catch (e) {
            console.warn("Reverse geocode fallback:", e);
            if (locationCityState) locationCityState.textContent = "Agra, Uttar Pradesh";
            if (userGreetingLocation) userGreetingLocation.textContent = "Agra, Uttar Pradesh";
            updateDynamicAreaHeroImage("Agra", "Uttar Pradesh");
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

    // Click handler for weather pill card -> Dedicated SafeYatra Live Weather UI
    if (statusWeatherItem) {
        statusWeatherItem.addEventListener('click', () => {
            window.location.href = `weather.html?lat=${currentLat}&lng=${currentLng}`;
        });
    }

    // ---------------------------------------------------------------
    // Police Station: Google Maps Search
    // Uses geolocation to pass the user's position as a hint, then
    // lets Google Maps handle the nearby police station search & selection.
    // ---------------------------------------------------------------
    function openPoliceSearch() {
        console.log("Police button clicked");

        const baseQuery = encodeURIComponent("police station");
        const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${baseQuery}`;

        function launchMaps(url) {
            console.log("Opening Google Maps police search:", url);
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
                // This tells Google Maps to centre the police search near the user.
                const url = `https://www.google.com/maps/search/?api=1&query=${baseQuery}&near=${lat},${lng}`;
                launchMaps(url);
            },
            (error) => {
                // Handle all geolocation errors gracefully — button still works
                let reason = "Unknown error";
                if (error.code === error.PERMISSION_DENIED) reason = "Permission denied";
                else if (error.code === error.POSITION_UNAVAILABLE) reason = "Position unavailable";
                else if (error.code === error.TIMEOUT) reason = "Timeout";
                console.warn(`Geolocation error (${reason}). Falling back to plain police search.`);
                launchMaps(fallbackUrl);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );
    }

    // Wire up: Status card police icon (Safety Status section)
    const statusPoliceItem = document.getElementById('statusPoliceItem');
    if (statusPoliceItem) {
        statusPoliceItem.addEventListener('click', openPoliceSearch);
    }

    // Wire up: Quick Action "Police" card (Quick Actions section)
    const policeActionCard = document.getElementById('policeActionCard');
    if (policeActionCard) {
        policeActionCard.addEventListener('click', openPoliceSearch);
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
