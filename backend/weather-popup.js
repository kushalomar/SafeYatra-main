/* SafeYatra - Dedicated Live Weather Popup Controller & Engine */

(() => {
    let currentLat = 27.1751;
    let currentLng = 78.0421;
    let currentCityName = "Agra, Uttar Pradesh";
    let isCurrentLocation = true;
    let currentUnit = 'c'; // 'c' for Celsius, 'f' for Fahrenheit
    let cachedWeatherData = null;
    let isInitialized = false;

    // DOM Elements
    let weatherPopupOverlay = null;
    let closeWeatherPopupBtn = null;
    let popupHeroWeatherCard = null;
    let popupHeroLocationTag = null;
    let popupHeroCityName = null;
    let popupHeroDateTime = null;
    let popupHeroSafetyBadge = null;
    let popupHeroSafetyBadgeText = null;
    let popupHeroTempValue = null;
    let popupHeroTempUnit = null;
    let popupHeroConditionText = null;
    let popupHeroHighTemp = null;
    let popupHeroLowTemp = null;
    let popupHeroFeelsLike = null;
    let popupHeroWeatherIcon = null;

    let popupAiWeatherAdvisoryBox = null;
    let popupAdvisoryMessageText = null;
    let popupAdvisoryTimeTag = null;

    let popupHourlyForecastTrack = null;
    let popupExtendedForecastList = null;

    // Metrics DOM Elements
    let popupMetricFeelsLike = null;
    let popupMetricFeelsDesc = null;
    let popupMetricUvBadge = null;
    let popupMetricUvVal = null;
    let popupMetricUvBar = null;
    let popupMetricUvDesc = null;
    let popupMetricWindDir = null;
    let popupMetricWindVal = null;
    let popupMetricWindDesc = null;
    let popupMetricHumidityTag = null;
    let popupMetricHumidityVal = null;
    let popupMetricHumidityDesc = null;
    let popupMetricPrecipProbTag = null;
    let popupMetricPrecipVal = null;
    let popupMetricPrecipDesc = null;
    let popupMetricVisibilityTag = null;
    let popupMetricVisibilityVal = null;
    let popupMetricVisibilityDesc = null;
    let popupMetricSunriseVal = null;
    let popupMetricSunsetVal = null;
    let popupMetricDaylightHours = null;
    let popupMetricCloudCover = null;
    let popupMetricPressureDesc = null;
    let popupMetricTouristScore = null;
    let popupMetricTouristDesc = null;

    // Packing tips elements
    let popupTipsCitySpan = null;
    let popupTipHydrationText = null;
    let popupTipClothingText = null;
    let popupTipGearText = null;
    let popupTipPhotoText = null;

    // Search and Action Elements
    let popupWeatherSearchForm = null;
    let popupWeatherSearchInput = null;
    let popupUseCurrentLocationBtn = null;
    let popupSearchResultsList = null;
    let popupRefreshWeatherBtn = null;
    let popupRefreshIcon = null;
    let popupBtnCelsius = null;
    let popupBtnFahrenheit = null;
    let popupSyncStatusText = null;

    function initPopupElements() {
        weatherPopupOverlay = document.getElementById('weatherPopupOverlay');
        closeWeatherPopupBtn = document.getElementById('closeWeatherPopupBtn');

        popupHeroWeatherCard = document.getElementById('popupHeroWeatherCard');
        popupHeroLocationTag = document.getElementById('popupHeroLocationTag');
        popupHeroCityName = document.getElementById('popupHeroCityName');
        popupHeroDateTime = document.getElementById('popupHeroDateTime');
        popupHeroSafetyBadge = document.getElementById('popupHeroSafetyBadge');
        popupHeroSafetyBadgeText = document.getElementById('popupHeroSafetyBadgeText');
        popupHeroTempValue = document.getElementById('popupHeroTempValue');
        popupHeroTempUnit = document.getElementById('popupHeroTempUnit');
        popupHeroConditionText = document.getElementById('popupHeroConditionText');
        popupHeroHighTemp = document.getElementById('popupHeroHighTemp');
        popupHeroLowTemp = document.getElementById('popupHeroLowTemp');
        popupHeroFeelsLike = document.getElementById('popupHeroFeelsLike');
        popupHeroWeatherIcon = document.getElementById('popupHeroWeatherIcon');

        popupAiWeatherAdvisoryBox = document.getElementById('popupAiWeatherAdvisoryBox');
        popupAdvisoryMessageText = document.getElementById('popupAdvisoryMessageText');
        popupAdvisoryTimeTag = document.getElementById('popupAdvisoryTimeTag');

        popupHourlyForecastTrack = document.getElementById('popupHourlyForecastTrack');
        popupExtendedForecastList = document.getElementById('popupExtendedForecastList');

        popupMetricFeelsLike = document.getElementById('popupMetricFeelsLike');
        popupMetricFeelsDesc = document.getElementById('popupMetricFeelsDesc');
        popupMetricUvBadge = document.getElementById('popupMetricUvBadge');
        popupMetricUvVal = document.getElementById('popupMetricUvVal');
        popupMetricUvBar = document.getElementById('popupMetricUvBar');
        popupMetricUvDesc = document.getElementById('popupMetricUvDesc');
        popupMetricWindDir = document.getElementById('popupMetricWindDir');
        popupMetricWindVal = document.getElementById('popupMetricWindVal');
        popupMetricWindDesc = document.getElementById('popupMetricWindDesc');
        popupMetricHumidityTag = document.getElementById('popupMetricHumidityTag');
        popupMetricHumidityVal = document.getElementById('popupMetricHumidityVal');
        popupMetricHumidityDesc = document.getElementById('popupMetricHumidityDesc');
        popupMetricPrecipProbTag = document.getElementById('popupMetricPrecipProbTag');
        popupMetricPrecipVal = document.getElementById('popupMetricPrecipVal');
        popupMetricPrecipDesc = document.getElementById('popupMetricPrecipDesc');
        popupMetricVisibilityTag = document.getElementById('popupMetricVisibilityTag');
        popupMetricVisibilityVal = document.getElementById('popupMetricVisibilityVal');
        popupMetricVisibilityDesc = document.getElementById('popupMetricVisibilityDesc');
        popupMetricSunriseVal = document.getElementById('popupMetricSunriseVal');
        popupMetricSunsetVal = document.getElementById('popupMetricSunsetVal');
        popupMetricDaylightHours = document.getElementById('popupMetricDaylightHours');
        popupMetricCloudCover = document.getElementById('popupMetricCloudCover');
        popupMetricPressureDesc = document.getElementById('popupMetricPressureDesc');
        popupMetricTouristScore = document.getElementById('popupMetricTouristScore');
        popupMetricTouristDesc = document.getElementById('popupMetricTouristDesc');

        popupTipsCitySpan = document.getElementById('popupTipsCitySpan');
        popupTipHydrationText = document.getElementById('popupTipHydrationText');
        popupTipClothingText = document.getElementById('popupTipClothingText');
        popupTipGearText = document.getElementById('popupTipGearText');
        popupTipPhotoText = document.getElementById('popupTipPhotoText');

        popupWeatherSearchForm = document.getElementById('popupWeatherSearchForm');
        popupWeatherSearchInput = document.getElementById('popupWeatherSearchInput');
        popupUseCurrentLocationBtn = document.getElementById('popupUseCurrentLocationBtn');
        popupSearchResultsList = document.getElementById('popupSearchResultsList');
        popupRefreshWeatherBtn = document.getElementById('popupRefreshWeatherBtn');
        popupRefreshIcon = document.getElementById('popupRefreshIcon');
        popupBtnCelsius = document.getElementById('popupBtnCelsius');
        popupBtnFahrenheit = document.getElementById('popupBtnFahrenheit');
        popupSyncStatusText = document.getElementById('popupSyncStatusText');

        setupEventListeners();
    }

    function setupEventListeners() {
        if (closeWeatherPopupBtn) {
            closeWeatherPopupBtn.addEventListener('click', closeWeatherPopup);
        }

        if (weatherPopupOverlay) {
            weatherPopupOverlay.addEventListener('click', (e) => {
                if (e.target === weatherPopupOverlay) {
                    closeWeatherPopup();
                }
            });
        }

        // Close on Escape Key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && weatherPopupOverlay && weatherPopupOverlay.classList.contains('active')) {
                closeWeatherPopup();
            }
        });

        // Unit Switcher Buttons
        if (popupBtnCelsius && popupBtnFahrenheit) {
            popupBtnCelsius.addEventListener('click', () => {
                if (currentUnit !== 'c') {
                    currentUnit = 'c';
                    popupBtnCelsius.classList.add('active');
                    popupBtnFahrenheit.classList.remove('active');
                    if (cachedWeatherData) renderWeatherUI(cachedWeatherData);
                }
            });

            popupBtnFahrenheit.addEventListener('click', () => {
                if (currentUnit !== 'f') {
                    currentUnit = 'f';
                    popupBtnFahrenheit.classList.add('active');
                    popupBtnCelsius.classList.remove('active');
                    if (cachedWeatherData) renderWeatherUI(cachedWeatherData);
                }
            });
        }

        // Refresh Button
        if (popupRefreshWeatherBtn) {
            popupRefreshWeatherBtn.addEventListener('click', async () => {
                if (popupRefreshIcon) popupRefreshIcon.classList.add('fa-spin');
                if (popupSyncStatusText) popupSyncStatusText.textContent = "Refreshing Data...";
                await initWeatherView(currentLat, currentLng, isCurrentLocation);
                setTimeout(() => {
                    if (popupRefreshIcon) popupRefreshIcon.classList.remove('fa-spin');
                    if (popupSyncStatusText) popupSyncStatusText.textContent = isCurrentLocation ? "Live GPS Sync" : "Destination Synced";
                }, 600);
            });
        }

        // Geolocation Crosshair Button
        if (popupUseCurrentLocationBtn) {
            popupUseCurrentLocationBtn.addEventListener('click', () => {
                requestGeolocation();
            });
        }

        // Quick Destination Chips
        const chips = document.querySelectorAll('.dest-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const city = chip.dataset.city;
                const lat = parseFloat(chip.dataset.lat);
                const lng = parseFloat(chip.dataset.lng);
                if (lat && lng) {
                    currentLat = lat;
                    currentLng = lng;
                    currentCityName = city;
                    isCurrentLocation = false;
                    if (popupSyncStatusText) popupSyncStatusText.textContent = `${city} Synced`;
                    initWeatherView(lat, lng, false);
                }
            });
        });

        // Search Form Submit
        if (popupWeatherSearchForm && popupWeatherSearchInput) {
            popupWeatherSearchForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const query = popupWeatherSearchInput.value.trim();
                if (query) {
                    await searchLocation(query);
                }
            });
        }
    }

    /**
     * Open Weather Popup Modal
     */
    window.openWeatherPopup = function (lat, lng, city) {
        if (!weatherPopupOverlay) {
            initPopupElements();
        }

        if (weatherPopupOverlay) {
            weatherPopupOverlay.classList.add('active');
            weatherPopupOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        if (lat && lng) {
            currentLat = lat;
            currentLng = lng;
            if (city) {
                currentCityName = city;
                isCurrentLocation = false;
                initWeatherView(lat, lng, false);
                return;
            }
            // Use passed coordinates and resolve location name
            initWeatherView(lat, lng, true);
            return;
        }

        if (!isInitialized) {
            requestGeolocation();
            isInitialized = true;
        } else if (cachedWeatherData) {
            renderWeatherUI(cachedWeatherData);
        } else {
            initWeatherView(currentLat, currentLng, true);
        }
    };

    /**
     * Close Weather Popup Modal
     */
    window.closeWeatherPopup = function () {
        if (weatherPopupOverlay) {
            weatherPopupOverlay.classList.remove('active');
            weatherPopupOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    };

    // Geolocation Initializer
    function requestGeolocation() {
        if ('geolocation' in navigator) {
            if (popupSyncStatusText) popupSyncStatusText.textContent = "Acquiring GPS...";
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentLat = position.coords.latitude;
                    currentLng = position.coords.longitude;
                    isCurrentLocation = true;
                    if (popupSyncStatusText) popupSyncStatusText.textContent = "Live GPS Sync";
                    initWeatherView(currentLat, currentLng, true);
                },
                (error) => {
                    console.warn("Weather GPS fallback used:", error.message);
                    if (popupSyncStatusText) popupSyncStatusText.textContent = "Default Location";
                    initWeatherView(currentLat, currentLng, true);
                },
                { enableHighAccuracy: false, timeout: 15000 }
            );
        } else {
            if (popupSyncStatusText) popupSyncStatusText.textContent = "GPS Unavailable";
            initWeatherView(currentLat, currentLng, true);
        }
    }

    // Initialize View with reverse geocoding and weather fetch in parallel
    async function initWeatherView(lat, lng, shouldGeocode = true) {
        const promises = [fetchWeatherData(lat, lng)];
        if (shouldGeocode) {
            promises.push(fetchReverseGeocode(lat, lng));
        } else {
            if (popupHeroCityName) popupHeroCityName.textContent = currentCityName;
            if (popupTipsCitySpan) popupTipsCitySpan.textContent = currentCityName;
            if (popupHeroLocationTag) {
                popupHeroLocationTag.textContent = isCurrentLocation ? "Current Location" : "Destination";
            }
        }
        await Promise.all(promises);
    }

    // Reverse Geocode
    async function fetchReverseGeocode(lat, lng) {
        try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
            if (res.ok) {
                const data = await res.json();
                const city = data.city || data.locality || data.localityInfo?.administrative?.[2]?.name || "Agra";
                const state = data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name || "Uttar Pradesh";
                currentCityName = `${city}, ${state}`;

                if (popupHeroCityName) popupHeroCityName.textContent = currentCityName;
                if (popupTipsCitySpan) popupTipsCitySpan.textContent = currentCityName;
                if (popupHeroLocationTag) {
                    popupHeroLocationTag.textContent = isCurrentLocation ? "Current Location" : "Destination";
                }
            }
        } catch (e) {
            console.warn("Reverse geocode fallback:", e);
            if (popupHeroCityName) popupHeroCityName.textContent = "Agra, Uttar Pradesh";
            if (popupTipsCitySpan) popupTipsCitySpan.textContent = "Agra, Uttar Pradesh";
        }
    }

    // Fetch Weather Data from Free Open-Meteo API
    async function fetchWeatherData(lat, lng) {
        try {
            const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,surface_pressure,cloudcover,visibility,windspeed_10m,winddirection_10m,uv_index&daily=weathercode,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,windspeed_10m_max&timezone=auto`;

            const res = await fetch(apiUrl);
            if (res.ok) {
                const data = await res.json();
                cachedWeatherData = data;
                renderWeatherUI(data);
            } else {
                throw new Error("Open-Meteo API returned error status: " + res.status);
            }
        } catch (err) {
            console.error("Failed to load live weather:", err);
            renderFallbackWeather();
        }
    }

    // Convert Celsius to Fahrenheit if needed
    function formatTemp(celsiusVal) {
        if (celsiusVal === undefined || celsiusVal === null || isNaN(celsiusVal)) return "--";
        if (currentUnit === 'f') {
            return Math.round((celsiusVal * 9 / 5) + 32);
        }
        return Math.round(celsiusVal);
    }

    // Parse WMO Weather Code
    function getWmoDetails(code, isDay = 1) {
        const c = Number(code);
        if (c === 0) {
            return {
                label: isDay ? "Sunny & Clear" : "Clear Night Sky",
                icon: isDay ? "fa-sun" : "fa-moon",
                theme: isDay ? "theme-clear-day" : "theme-clear-night",
                gradient: isDay 
                    ? "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #0284C7 100%)" 
                    : "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)",
                safety: "Safe for Travel",
                safetyClass: "tag-green",
                advisory: "Ideal sunny weather for sightseeing, heritage walks, and outdoor photography."
            };
        } else if (c === 1) {
            return {
                label: "Mainly Clear",
                icon: isDay ? "fa-sun" : "fa-cloud-moon",
                theme: isDay ? "theme-clear-day" : "theme-clear-night",
                gradient: isDay 
                    ? "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #0284C7 100%)" 
                    : "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)",
                safety: "Safe for Travel",
                safetyClass: "tag-green",
                advisory: "Great travel conditions with pleasant light clouds and clear visibility."
            };
        } else if (c === 2 || c === 3) {
            return {
                label: c === 2 ? "Partly Cloudy" : "Overcast Clouds",
                icon: isDay ? "fa-cloud-sun" : "fa-cloud-moon",
                theme: "theme-cloudy",
                gradient: "linear-gradient(135deg, #1E293B 0%, #334155 50%, #0284C7 100%)",
                safety: "Safe for Travel",
                safetyClass: "tag-green",
                advisory: "Pleasant diffused daylight. Excellent for exploring outdoor monuments comfortably."
            };
        } else if (c === 45 || c === 48) {
            return {
                label: c === 45 ? "Foggy" : "Depositing Rime Fog",
                icon: "fa-smog",
                theme: "theme-fog",
                gradient: "linear-gradient(135deg, #1E293B 0%, #334155 50%, #0369A1 100%)",
                safety: "Moderate Caution",
                safetyClass: "tag-amber",
                advisory: "Reduced visibility on roads. Drive with fog lights and keep emergency indicators handy."
            };
        } else if (c >= 51 && c <= 55) {
            return {
                label: "Light Drizzle",
                icon: "fa-cloud-rain",
                theme: "theme-rainy",
                gradient: "linear-gradient(135deg, #0C4A6E 0%, #0369A1 50%, #0284C7 100%)",
                safety: "Slight Caution",
                safetyClass: "tag-amber",
                advisory: "Intermittent light drizzle. Carry a compact umbrella and wear water-resistant shoes."
            };
        } else if (c >= 61 && c <= 65) {
            return {
                label: c === 61 ? "Light Rain" : (c === 63 ? "Moderate Rain" : "Heavy Rain"),
                icon: "fa-cloud-showers-heavy",
                theme: "theme-rainy",
                gradient: "linear-gradient(135deg, #0C4A6E 0%, #0284C7 50%, #0369A1 100%)",
                safety: c >= 63 ? "Caution: Slippery" : "Slight Caution",
                safetyClass: c >= 63 ? "tag-red" : "tag-amber",
                advisory: "Rainy conditions. Pathways and monuments may be slippery. Plan indoor museum visits."
            };
        } else if (c >= 71 && c <= 77) {
            return {
                label: "Snowfall",
                icon: "fa-snowflake",
                theme: "theme-snow",
                gradient: "linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #38BDF8 100%)",
                safety: "Snow Caution",
                safetyClass: "tag-amber",
                advisory: "Sub-zero temperatures and snow. Wear thermal layers, snow boots, and gloves."
            };
        } else if (c >= 80 && c <= 82) {
            return {
                label: "Rain Showers",
                icon: "fa-cloud-showers-water",
                theme: "theme-rainy",
                gradient: "linear-gradient(135deg, #0C4A6E 0%, #0369A1 50%, #0284C7 100%)",
                safety: "Moderate Caution",
                safetyClass: "tag-amber",
                advisory: "Sudden rain showers expected. Keep electronic devices in waterproof pouches."
            };
        } else if (c >= 95) {
            return {
                label: "Thunderstorm",
                icon: "fa-bolt",
                theme: "theme-thunderstorm",
                gradient: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)",
                safety: "Severe Weather Alert",
                safetyClass: "tag-red",
                advisory: "Thunderstorm alert. Seek shelter in solid buildings and avoid open grounds or trees."
            };
        }

        return {
            label: "Clear",
            icon: isDay ? "fa-sun" : "fa-moon",
            theme: "theme-clear-day",
            gradient: "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #0284C7 100%)",
            safety: "Safe for Travel",
            safetyClass: "tag-green",
            advisory: "Normal weather conditions for comfortable travel."
        };
    }

    // Render Weather UI
    function renderWeatherUI(data) {
        if (!data || !data.current_weather) return;

        const current = data.current_weather;
        const hourly = data.hourly || {};
        const daily = data.daily || {};

        const tempC = current.temperature;
        const weatherCode = current.weathercode;
        const isDay = current.is_day !== undefined ? current.is_day : 1;
        const wmo = getWmoDetails(weatherCode, isDay);

        // 1. Hero Card Updates
        if (popupHeroTempValue) popupHeroTempValue.textContent = formatTemp(tempC);
        if (popupHeroTempUnit) popupHeroTempUnit.textContent = `°${currentUnit.toUpperCase()}`;
        if (popupHeroConditionText) popupHeroConditionText.textContent = wmo.label;

        const heroCardEl = document.getElementById('popupHeroWeatherCard') || popupHeroWeatherCard;
        if (heroCardEl) {
            heroCardEl.className = `hero-weather-card ${wmo.theme}`;
            heroCardEl.style.setProperty('background', wmo.gradient, 'important');
            heroCardEl.style.setProperty('color', '#FFFFFF', 'important');
        }

        const heroIconEl = document.getElementById('popupHeroWeatherIcon') || popupHeroWeatherIcon;
        if (heroIconEl) {
            heroIconEl.className = `fa-solid ${wmo.icon} weather-hero-icon`;
        }

        if (popupHeroSafetyBadge && popupHeroSafetyBadgeText) {
            popupHeroSafetyBadgeText.textContent = wmo.safety;
            popupHeroSafetyBadge.className = `hero-safety-badge ${wmo.safetyClass}`;
        }

        // Daily High / Low & Feels Like
        const todayHighC = (daily.temperature_2m_max && daily.temperature_2m_max[0] !== undefined) ? daily.temperature_2m_max[0] : tempC + 3;
        const todayLowC = (daily.temperature_2m_min && daily.temperature_2m_min[0] !== undefined) ? daily.temperature_2m_min[0] : tempC - 4;
        const feelsLikeC = (hourly.apparent_temperature && hourly.apparent_temperature[0] !== undefined)
            ? hourly.apparent_temperature[0]
            : tempC;

        if (popupHeroHighTemp) popupHeroHighTemp.textContent = `${formatTemp(todayHighC)}°`;
        if (popupHeroLowTemp) popupHeroLowTemp.textContent = `${formatTemp(todayLowC)}°`;
        if (popupHeroFeelsLike) popupHeroFeelsLike.textContent = `${formatTemp(feelsLikeC)}°`;

        // Date / Time String
        const now = new Date();
        const options = { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        if (popupHeroDateTime) popupHeroDateTime.textContent = now.toLocaleDateString('en-IN', options);

        // AI Advisory
        if (popupAdvisoryMessageText) {
            let customAdv = wmo.advisory;
            if (tempC > 38) {
                customAdv += " High temperatures detected — stay hydrated, carry sun protection, and avoid midday heat.";
            } else if (tempC < 10) {
                customAdv += " Chilly conditions — wear cozy winter layers, especially during morning sightseeing.";
            }
            popupAdvisoryMessageText.textContent = customAdv;
        }
        if (popupAdvisoryTimeTag) popupAdvisoryTimeTag.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        // 2. Metrics Grid
        if (popupMetricFeelsLike) popupMetricFeelsLike.textContent = `${formatTemp(feelsLikeC)}°`;
        if (popupMetricFeelsDesc) {
            const diff = Math.round(feelsLikeC - tempC);
            if (diff > 2) popupMetricFeelsDesc.textContent = "Humidity makes it feel warmer";
            else if (diff < -2) popupMetricFeelsDesc.textContent = "Wind makes it feel cooler";
            else popupMetricFeelsDesc.textContent = "Similar to actual temperature";
        }

        // UV Index
        const maxUv = (daily.uv_index_max && daily.uv_index_max[0] !== undefined) ? daily.uv_index_max[0] : ((hourly.uv_index && hourly.uv_index[12] !== undefined) ? hourly.uv_index[12] : 4);
        const uvNum = Math.round(maxUv || 4);
        if (popupMetricUvVal) popupMetricUvVal.textContent = uvNum;
        if (popupMetricUvBar) popupMetricUvBar.style.width = `${Math.min((uvNum / 12) * 100, 100)}%`;

        let uvBadgeText = "Low";
        let uvDescText = "No protection needed";
        if (uvNum >= 3 && uvNum <= 5) {
            uvBadgeText = "Moderate";
            uvDescText = "Wear sunscreen & sunglasses";
        } else if (uvNum >= 6 && uvNum <= 7) {
            uvBadgeText = "High";
            uvDescText = "Cover up, seek shade midday";
        } else if (uvNum >= 8) {
            uvBadgeText = "Very High";
            uvDescText = "Extra sun protection essential";
        }
        if (popupMetricUvBadge) popupMetricUvBadge.textContent = uvBadgeText;
        if (popupMetricUvDesc) popupMetricUvDesc.textContent = uvDescText;

        // Wind
        const windSpeed = Math.round(current.windspeed || ((daily.windspeed_10m_max && daily.windspeed_10m_max[0] !== undefined) ? daily.windspeed_10m_max[0] : 12));
        const windDeg = current.winddirection || 45;
        const windDirCompass = getCompassDirection(windDeg);
        if (popupMetricWindVal) popupMetricWindVal.textContent = `${windSpeed} km/h`;
        if (popupMetricWindDir) popupMetricWindDir.textContent = windDirCompass;
        if (popupMetricWindDesc) {
            if (windSpeed < 10) popupMetricWindDesc.textContent = "Gentle light breeze";
            else if (windSpeed < 25) popupMetricWindDesc.textContent = "Moderate refreshing wind";
            else popupMetricWindDesc.textContent = "Gusty winds — secure loose hats";
        }

        // Humidity
        const currentHourIndex = now.getHours();
        const humidity = (hourly.relativehumidity_2m && hourly.relativehumidity_2m[currentHourIndex] !== undefined) ? hourly.relativehumidity_2m[currentHourIndex] : 55;
        if (popupMetricHumidityVal) popupMetricHumidityVal.textContent = `${humidity}%`;
        if (popupMetricHumidityTag) {
            if (humidity > 70) popupMetricHumidityTag.textContent = "Humid";
            else if (humidity < 30) popupMetricHumidityTag.textContent = "Dry";
            else popupMetricHumidityTag.textContent = "Comfortable";
        }
        if (popupMetricHumidityDesc) {
            popupMetricHumidityDesc.textContent = humidity > 70 ? "Moist air, feels muggy" : (humidity < 30 ? "Crisp and dry air" : "Comfortable moisture level");
        }

        // Rain Probability & Precipitation
        const precipProb = (daily.precipitation_probability_max && daily.precipitation_probability_max[0] !== undefined) ? daily.precipitation_probability_max[0] : ((hourly.precipitation_probability && hourly.precipitation_probability[0] !== undefined) ? hourly.precipitation_probability[0] : 0);
        const precipSum = (daily.precipitation_sum && daily.precipitation_sum[0] !== undefined) ? daily.precipitation_sum[0] : 0;
        if (popupMetricPrecipProbTag) popupMetricPrecipProbTag.textContent = `${precipProb}%`;
        if (popupMetricPrecipVal) popupMetricPrecipVal.textContent = `${precipSum} mm`;
        if (popupMetricPrecipDesc) {
            popupMetricPrecipDesc.textContent = precipProb > 40 ? "Rain likely today, carry gear" : "Dry day, negligible chance of rain";
        }

        // Visibility
        const visMeters = (hourly.visibility && hourly.visibility[currentHourIndex] !== undefined) ? hourly.visibility[currentHourIndex] : 10000;
        const visKm = Math.round((visMeters || 10000) / 1000);
        if (popupMetricVisibilityVal) popupMetricVisibilityVal.textContent = `${visKm} km`;
        if (popupMetricVisibilityTag) {
            if (visKm >= 9) popupMetricVisibilityTag.textContent = "Clear";
            else if (visKm >= 5) popupMetricVisibilityTag.textContent = "Moderate";
            else popupMetricVisibilityTag.textContent = "Low Visibility";
        }
        if (popupMetricVisibilityDesc) {
            popupMetricVisibilityDesc.textContent = visKm >= 9 ? "Optimal sightseeing & driving conditions" : "Haze/fog present, allow extra travel time";
        }

        // Sunrise & Sunset
        if (daily.sunrise && daily.sunrise[0] && daily.sunset && daily.sunset[0]) {
            const sunriseDate = new Date(daily.sunrise[0]);
            const sunsetDate = new Date(daily.sunset[0]);
            if (popupMetricSunriseVal) popupMetricSunriseVal.textContent = sunriseDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (popupMetricSunsetVal) popupMetricSunsetVal.textContent = sunsetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const diffHours = ((sunsetDate - sunriseDate) / (1000 * 60 * 60)).toFixed(1);
            if (popupMetricDaylightHours) popupMetricDaylightHours.textContent = `Daylight: ${diffHours} hrs`;
        }

        // Cloud Cover & Pressure
        const cloudCoverVal = (hourly.cloudcover && hourly.cloudcover[currentHourIndex] !== undefined) ? hourly.cloudcover[currentHourIndex] : 20;
        const pressureVal = (hourly.surface_pressure && hourly.surface_pressure[currentHourIndex] !== undefined) ? Math.round(hourly.surface_pressure[currentHourIndex]) : 1012;
        if (popupMetricCloudCover) popupMetricCloudCover.textContent = `${cloudCoverVal}%`;
        if (popupMetricPressureDesc) popupMetricPressureDesc.textContent = `Pressure: ${pressureVal} hPa`;

        // Tourist Activity Suitability Score (Calculated)
        let touristScore = 10;
        if (tempC > 36 || tempC < 8) touristScore -= 2;
        if (humidity > 75) touristScore -= 1.5;
        if (precipProb > 50) touristScore -= 2.5;
        if (windSpeed > 30) touristScore -= 1.5;
        if (visKm < 4) touristScore -= 1.5;
        touristScore = Math.max(Math.min(touristScore, 10), 3.5).toFixed(1);

        if (popupMetricTouristScore) popupMetricTouristScore.textContent = `${touristScore} / 10`;
        if (popupMetricTouristDesc) {
            if (touristScore >= 8.5) popupMetricTouristDesc.textContent = "Prime conditions for monuments & sightseeing";
            else if (touristScore >= 6.5) popupMetricTouristDesc.textContent = "Good conditions, standard travel precautions apply";
            else popupMetricTouristDesc.textContent = "Suboptimal climate, check advisories before excursions";
        }

        // 3. Hourly Forecast Track (24 Hours)
        renderHourlyTrack(hourly);

        // 4. Extended 7-Day Forecast
        renderExtendedForecast(daily);

        // 5. Smart Tourist Packing Tips
        renderSmartTips(tempC, wmo, humidity, uvNum);
    }

    // Render 24-Hour Carousel Track
    function renderHourlyTrack(hourly) {
        if (!popupHourlyForecastTrack || !hourly.time) return;

        const now = new Date();
        const currentHour = now.getHours();

        let trackHtml = "";
        const times = hourly.time || [];
        const temps = hourly.temperature_2m || [];
        const codes = hourly.weathercode || [];
        const rainProbs = hourly.precipitation_probability || [];

        const limit = Math.min(times.length, currentHour + 24);

        for (let i = currentHour; i < limit; i++) {
            const timeObj = new Date(times[i]);
            const hourLabel = i === currentHour ? "Now" : timeObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });
            const tempVal = formatTemp(temps[i]);
            const wmo = getWmoDetails(codes[i], (timeObj.getHours() >= 6 && timeObj.getHours() <= 18) ? 1 : 0);
            const rainP = rainProbs[i] || 0;

            trackHtml += `
                <div class="hourly-card ${i === currentHour ? 'active-hour' : ''}">
                    <span class="hour-time">${hourLabel}</span>
                    <div class="hour-icon-wrap">
                        <i class="fa-solid ${wmo.icon}"></i>
                    </div>
                    <span class="hour-temp">${tempVal}°</span>
                    ${rainP > 15 ? `<span class="hour-rain"><i class="fa-solid fa-droplet"></i> ${rainP}%</span>` : `<span class="hour-cond">${wmo.label.split(' ')[0]}</span>`}
                </div>
            `;
        }

        popupHourlyForecastTrack.innerHTML = trackHtml;
    }

    // Render 7-Day Extended Forecast List
    function renderExtendedForecast(daily) {
        if (!popupExtendedForecastList || !daily.time) return;

        let listHtml = "";
        const days = daily.time || [];
        const maxTemps = daily.temperature_2m_max || [];
        const minTemps = daily.temperature_2m_min || [];
        const codes = daily.weathercode || [];
        const rainProbs = daily.precipitation_probability_max || [];

        const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        for (let i = 0; i < Math.min(days.length, 7); i++) {
            const dateObj = new Date(days[i]);
            const dayName = i === 0 ? "Today" : (i === 1 ? "Tomorrow" : daysOfWeek[dateObj.getDay()]);
            const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
            const wmo = getWmoDetails(codes[i], 1);
            const highT = formatTemp(maxTemps[i]);
            const lowT = formatTemp(minTemps[i]);
            const rainP = rainProbs[i] || 0;

            listHtml += `
                <div class="forecast-day-row">
                    <div class="forecast-day-name-col">
                        <span class="forecast-day-title">${dayName}</span>
                        <span class="forecast-day-date">${dateStr}</span>
                    </div>

                    <div class="forecast-icon-cond-col">
                        <i class="fa-solid ${wmo.icon} forecast-row-icon"></i>
                        <span class="forecast-cond-text">${wmo.label}</span>
                    </div>

                    <div class="forecast-rain-col">
                        ${rainP > 10 ? `<span class="rain-chance-badge"><i class="fa-solid fa-droplet"></i> ${rainP}%</span>` : `<span class="rain-none-badge">-</span>`}
                    </div>

                    <div class="forecast-temp-range-col">
                        <span class="temp-low">${lowT}°</span>
                        <div class="temp-range-bar-bg">
                            <div class="temp-range-bar-fill" style="left: 15%; width: 70%;"></div>
                        </div>
                        <span class="temp-high">${highT}°</span>
                    </div>
                </div>
            `;
        }

        popupExtendedForecastList.innerHTML = listHtml;
    }

    // Dynamic Smart Tourist Tips
    function renderSmartTips(tempC, wmo, humidity, uvNum) {
        if (popupTipHydrationText) {
            if (tempC > 33) popupTipHydrationText.textContent = "Drink 3–4L water + carry ORS electrolytes";
            else if (tempC < 15) popupTipHydrationText.textContent = "Keep warm herbal teas or warm water flask";
            else popupTipHydrationText.textContent = "Carry reusable water bottle for walking tours";
        }

        if (popupTipClothingText) {
            if (tempC > 30) popupTipClothingText.textContent = "Breathable lightweight cottons & loose fits";
            else if (tempC < 15) popupTipClothingText.textContent = "Thermal innerwear, fleece, and light jackets";
            else popupTipClothingText.textContent = "Comfortable activewear & walking sneakers";
        }

        if (popupTipGearText) {
            if (wmo.theme === 'theme-rainy' || wmo.theme === 'theme-storm') {
                popupTipGearText.textContent = "Compact umbrella, waterproof phone pouch, raincoat";
            } else if (uvNum >= 6) {
                popupTipGearText.textContent = "Broad UV sunglasses, SPF 50+ sunscreen & sun-cap";
            } else {
                popupTipGearText.textContent = "Power bank, camera strap & walking shoes";
            }
        }

        if (popupTipPhotoText) {
            if (wmo.theme === 'theme-rainy') {
                popupTipPhotoText.textContent = "Dramatic monsoon reflections around historical plazas";
            } else {
                popupTipPhotoText.textContent = "Golden hour 5:30 PM – 6:30 PM for sunset monument shots";
            }
        }
    }

    // Search Tourist Destination using Open-Meteo Geocoding API
    async function searchLocation(query) {
        try {
            if (popupSyncStatusText) popupSyncStatusText.textContent = `Searching "${query}"...`;
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
            if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results.length > 0) {
                    const firstMatch = geoData.results[0];
                    currentLat = firstMatch.latitude;
                    currentLng = firstMatch.longitude;
                    currentCityName = `${firstMatch.name}, ${firstMatch.admin1 || firstMatch.country || ""}`.trim().replace(/,\s*$/, "");
                    isCurrentLocation = false;

                    if (popupSyncStatusText) popupSyncStatusText.textContent = `${firstMatch.name} Synced`;
                    initWeatherView(currentLat, currentLng, false);
                    if (popupWeatherSearchInput) popupWeatherSearchInput.value = "";
                } else {
                    alert(`Could not find coordinates for "${query}". Please try a major city name.`);
                    if (popupSyncStatusText) popupSyncStatusText.textContent = "Search Not Found";
                }
            }
        } catch (e) {
            console.error("Geocoding search failed:", e);
        }
    }

    // Compass Direction Helper
    function getCompassDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round((degrees % 360) / 22.5) % 16;
        return directions[index];
    }

    // Fallback UI if API is unavailable
    function renderFallbackWeather() {
        if (popupHeroTempValue) popupHeroTempValue.textContent = "32";
        if (popupHeroTempUnit) popupHeroTempUnit.textContent = "°C";
        if (popupHeroConditionText) popupHeroConditionText.textContent = "Sunny & Warm";
        if (popupHeroHighTemp) popupHeroHighTemp.textContent = "35°";
        if (popupHeroLowTemp) popupHeroLowTemp.textContent = "24°";
        if (popupHeroFeelsLike) popupHeroFeelsLike.textContent = "34°";
        if (popupSyncStatusText) popupSyncStatusText.textContent = "Offline Mode";
    }

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', () => {
        initPopupElements();
    });

})();
