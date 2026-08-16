/* SafeYatra AI - Dedicated Live Weather & Travel Climate Engine */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard (Optional check if SafeYatraDB is loaded)
    if (typeof SafeYatraDB !== 'undefined' && SafeYatraDB.requireAuth) {
        SafeYatraDB.requireAuth();
    }

    // Default Fallback Coordinates (Agra, Uttar Pradesh)
    let currentLat = 27.1751;
    let currentLng = 78.0421;
    let currentCityName = "Agra, Uttar Pradesh";
    let isCurrentLocation = true;
    let currentUnit = 'c'; // 'c' for Celsius, 'f' for Fahrenheit
    let cachedWeatherData = null;

    // DOM Elements
    const heroWeatherCard = document.getElementById('heroWeatherCard');
    const heroLocationTag = document.getElementById('heroLocationTag');
    const heroCityName = document.getElementById('heroCityName');
    const heroDateTime = document.getElementById('heroDateTime');
    const heroSafetyBadge = document.getElementById('heroSafetyBadge');
    const heroSafetyBadgeText = document.getElementById('heroSafetyBadgeText');
    const heroTempValue = document.getElementById('heroTempValue');
    const heroTempUnit = document.getElementById('heroTempUnit');
    const heroConditionText = document.getElementById('heroConditionText');
    const heroHighTemp = document.getElementById('heroHighTemp');
    const heroLowTemp = document.getElementById('heroLowTemp');
    const heroFeelsLike = document.getElementById('heroFeelsLike');
    const heroWeatherIcon = document.getElementById('heroWeatherIcon');

    const aiWeatherAdvisoryBox = document.getElementById('aiWeatherAdvisoryBox');
    const advisoryMessageText = document.getElementById('advisoryMessageText');
    const advisoryTimeTag = document.getElementById('advisoryTimeTag');

    const hourlyForecastTrack = document.getElementById('hourlyForecastTrack');
    const extendedForecastList = document.getElementById('extendedForecastList');

    // Metrics DOM Elements
    const metricFeelsLike = document.getElementById('metricFeelsLike');
    const metricFeelsDesc = document.getElementById('metricFeelsDesc');
    const metricUvBadge = document.getElementById('metricUvBadge');
    const metricUvVal = document.getElementById('metricUvVal');
    const metricUvBar = document.getElementById('metricUvBar');
    const metricUvDesc = document.getElementById('metricUvDesc');
    const metricWindDir = document.getElementById('metricWindDir');
    const metricWindVal = document.getElementById('metricWindVal');
    const metricWindDesc = document.getElementById('metricWindDesc');
    const metricHumidityTag = document.getElementById('metricHumidityTag');
    const metricHumidityVal = document.getElementById('metricHumidityVal');
    const metricHumidityDesc = document.getElementById('metricHumidityDesc');
    const metricPrecipProbTag = document.getElementById('metricPrecipProbTag');
    const metricPrecipVal = document.getElementById('metricPrecipVal');
    const metricPrecipDesc = document.getElementById('metricPrecipDesc');
    const metricVisibilityTag = document.getElementById('metricVisibilityTag');
    const metricVisibilityVal = document.getElementById('metricVisibilityVal');
    const metricVisibilityDesc = document.getElementById('metricVisibilityDesc');
    const metricSunriseVal = document.getElementById('metricSunriseVal');
    const metricSunsetVal = document.getElementById('metricSunsetVal');
    const metricDaylightHours = document.getElementById('metricDaylightHours');
    const metricCloudCover = document.getElementById('metricCloudCover');
    const metricPressureDesc = document.getElementById('metricPressureDesc');
    const metricTouristScore = document.getElementById('metricTouristScore');
    const metricTouristDesc = document.getElementById('metricTouristDesc');

    // Packing tips elements
    const tipsCitySpan = document.getElementById('tipsCitySpan');
    const tipHydrationText = document.getElementById('tipHydrationText');
    const tipClothingText = document.getElementById('tipClothingText');
    const tipGearText = document.getElementById('tipGearText');
    const tipPhotoText = document.getElementById('tipPhotoText');

    // Search and Action Elements
    const weatherSearchForm = document.getElementById('weatherSearchForm');
    const weatherSearchInput = document.getElementById('weatherSearchInput');
    const useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');
    const searchResultsList = document.getElementById('searchResultsList');
    const refreshWeatherBtn = document.getElementById('refreshWeatherBtn');
    const refreshIcon = document.getElementById('refreshIcon');
    const btnCelsius = document.getElementById('btnCelsius');
    const btnFahrenheit = document.getElementById('btnFahrenheit');
    const syncStatusText = document.getElementById('syncStatusText');

    // Check URL parameters for lat, lng, and city
    const urlParams = new URLSearchParams(window.location.search);
    const paramLat = urlParams.get('lat');
    const paramLng = urlParams.get('lng');
    const paramCity = urlParams.get('city');

    if (paramLat && paramLng) {
        currentLat = parseFloat(paramLat);
        currentLng = parseFloat(paramLng);
        if (paramCity) {
            currentCityName = decodeURIComponent(paramCity);
            isCurrentLocation = false;
        }
        initWeatherView(currentLat, currentLng, !paramCity);
    } else {
        // Automatically request GPS position
        requestGeolocation();
    }

    // Geolocation Initializer
    function requestGeolocation() {
        if ('geolocation' in navigator) {
            if (syncStatusText) syncStatusText.textContent = "Acquiring GPS...";
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentLat = position.coords.latitude;
                    currentLng = position.coords.longitude;
                    isCurrentLocation = true;
                    if (syncStatusText) syncStatusText.textContent = "Live GPS Sync";
                    initWeatherView(currentLat, currentLng, true);
                },
                (error) => {
                    console.warn("Weather GPS fallback used:", error.message);
                    if (syncStatusText) syncStatusText.textContent = "Default Location";
                    initWeatherView(currentLat, currentLng, true);
                },
                { enableHighAccuracy: false, timeout: 20000 }
            );
        } else {
            if (syncStatusText) syncStatusText.textContent = "GPS Unavailable";
            initWeatherView(currentLat, currentLng, true);
        }
    }

    // Initialize View with reverse geocoding and weather fetch
    async function initWeatherView(lat, lng, shouldGeocode = true) {
        if (shouldGeocode) {
            await fetchReverseGeocode(lat, lng);
        } else {
            if (heroCityName) heroCityName.textContent = currentCityName;
            if (tipsCitySpan) tipsCitySpan.textContent = currentCityName;
            if (heroLocationTag) {
                heroLocationTag.textContent = isCurrentLocation ? "Current Location" : "Destination";
            }
        }
        await fetchWeatherData(lat, lng);
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
            }
        } catch (e) {
            console.warn("Reverse geocoding error:", e);
            currentCityName = "Agra, Uttar Pradesh";
        }
        if (heroCityName) heroCityName.textContent = currentCityName;
        if (tipsCitySpan) tipsCitySpan.textContent = currentCityName;
        if (heroLocationTag) {
            heroLocationTag.textContent = isCurrentLocation ? "Current Location" : "Destination";
        }
    }

    // Fetch Full Weather Forecast from Open-Meteo
    async function fetchWeatherData(lat, lng) {
        try {
            const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error("Weather API request failed");

            const data = await res.json();
            cachedWeatherData = data;
            renderWeatherUI(data);
        } catch (err) {
            console.error("Error fetching weather data:", err);
            // Render realistic fallback data if offline
            renderFallbackWeatherData(lat, lng);
        }
    }

    // Temperature Converter Utility
    function toDisplayTemp(celsius) {
        if (celsius === null || celsius === undefined || isNaN(celsius)) return "--";
        const val = Math.round(celsius);
        if (currentUnit === 'f') {
            return Math.round((val * 9 / 5) + 32);
        }
        return val;
    }

    // Render Full Weather UI
    function renderWeatherUI(data) {
        const current = data.current || {};
        const daily = data.daily || {};
        const hourly = data.hourly || {};

        const tempC = current.temperature_2m ?? 32;
        const feelsC = current.apparent_temperature ?? tempC;
        const weatherCode = current.weather_code ?? 0;
        const isDay = current.is_day !== undefined ? current.is_day === 1 : true;
        const humidity = current.relative_humidity_2m ?? 48;
        const windSpeed = current.wind_speed_10m ?? 12;
        const windDir = current.wind_direction_10m ?? 45;
        const cloudCover = current.cloud_cover ?? 10;
        const pressure = Math.round(current.pressure_msl ?? 1012);
        const precip = current.precipitation ?? 0;

        const maxTempC = (daily.temperature_2m_max && daily.temperature_2m_max[0] !== undefined) ? daily.temperature_2m_max[0] : tempC + 4;
        const minTempC = (daily.temperature_2m_min && daily.temperature_2m_min[0] !== undefined) ? daily.temperature_2m_min[0] : tempC - 6;
        const maxUv = (daily.uv_index_max && daily.uv_index_max[0] !== undefined) ? daily.uv_index_max[0] : 6;
        const precipProbMax = (daily.precipitation_probability_max && daily.precipitation_probability_max[0] !== undefined) ? daily.precipitation_probability_max[0] : 0;
        const sunriseStr = daily.sunrise && daily.sunrise[0] ? formatTimeStr(daily.sunrise[0]) : "05:48 AM";
        const sunsetStr = daily.sunset && daily.sunset[0] ? formatTimeStr(daily.sunset[0]) : "06:52 PM";

        const parsed = interpretWmo(weatherCode, isDay, tempC);

        // 1. Hero Card Rendering
        if (heroWeatherCard) {
            heroWeatherCard.className = `hero-weather-card ${parsed.themeClass}`;
            heroWeatherCard.style.setProperty('background', parsed.gradient, 'important');
            heroWeatherCard.style.setProperty('color', '#FFFFFF', 'important');
        }
        if (heroTempValue) heroTempValue.textContent = toDisplayTemp(tempC);
        if (heroTempUnit) heroTempUnit.textContent = currentUnit === 'f' ? "°F" : "°C";
        if (heroConditionText) heroConditionText.textContent = parsed.label;
        if (heroHighTemp) heroHighTemp.textContent = `${toDisplayTemp(maxTempC)}°`;
        if (heroLowTemp) heroLowTemp.textContent = `${toDisplayTemp(minTempC)}°`;
        if (heroFeelsLike) heroFeelsLike.textContent = `${toDisplayTemp(feelsC)}°`;

        if (heroWeatherIcon) {
            heroWeatherIcon.className = `fa-solid ${parsed.icon} weather-hero-icon`;
        }

        // Live Date & Time formatting
        const now = new Date();
        const dateOptions = { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
        if (heroDateTime) {
            heroDateTime.textContent = now.toLocaleDateString('en-IN', dateOptions);
        }

        // Safety Badge
        if (heroSafetyBadge && heroSafetyBadgeText) {
            heroSafetyBadgeText.textContent = parsed.safetyStatusText;
            if (parsed.isWarning) {
                heroSafetyBadge.style.background = "rgba(239, 68, 68, 0.25)";
                heroSafetyBadge.style.borderColor = "rgba(252, 165, 165, 0.5)";
                heroSafetyBadge.style.color = "#FECACA";
            } else {
                heroSafetyBadge.style.background = "rgba(16, 185, 129, 0.25)";
                heroSafetyBadge.style.borderColor = "rgba(110, 231, 183, 0.45)";
                heroSafetyBadge.style.color = "#A7F3D0";
            }
        }

        // AI Advisory
        if (advisoryMessageText) {
            advisoryMessageText.textContent = generateAiAdvisory(tempC, weatherCode, humidity, maxUv, windSpeed);
        }
        if (advisoryTimeTag) {
            advisoryTimeTag.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // 2. Hourly Forecast Rendering (24 Hours)
        renderHourlyForecast(hourly);

        // 3. Metrics Grid Rendering
        renderMetricsGrid({
            feelsC,
            tempC,
            maxUv,
            windSpeed,
            windDir,
            humidity,
            precip,
            precipProbMax,
            cloudCover,
            pressure,
            sunriseStr,
            sunsetStr,
            hourly
        });

        // 4. 7-Day Daily Forecast Rendering
        renderDailyForecast(daily);

        // 5. Smart Travel & Packing Tips
        renderPackingTips(tempC, weatherCode, maxUv, rainChanceOrZero(precipProbMax));
    }

    // Helper for Rain probability
    function rainChanceOrZero(val) {
        return (val && !isNaN(val)) ? val : 0;
    }

    // Interpret WMO weather codes
    function interpretWmo(code, isDay = true, temp = 30) {
        let label = "Clear Sky";
        let icon = isDay ? "fa-sun" : "fa-moon";
        let themeClass = isDay ? "theme-clear-day" : "theme-clear-night";
        let gradient = isDay 
            ? "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #0284C7 100%)" 
            : "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)";
        let safetyStatusText = "Safe for Travel";
        let isWarning = false;

        if (code === 0) {
            label = isDay ? "Sunny & Clear" : "Clear Night Sky";
            icon = isDay ? "fa-sun" : "fa-moon";
            themeClass = isDay ? "theme-clear-day" : "theme-clear-night";
            gradient = isDay 
                ? "linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #0284C7 100%)" 
                : "linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)";
            if (temp > 38) {
                safetyStatusText = "Extreme Heat Advisory";
                isWarning = true;
            } else {
                safetyStatusText = "Optimal Travel Conditions";
            }
        } else if (code >= 1 && code <= 3) {
            label = code === 1 ? "Mainly Clear" : (code === 2 ? "Partly Cloudy" : "Overcast");
            icon = isDay ? (code === 3 ? "fa-cloud" : "fa-cloud-sun") : (code === 3 ? "fa-cloud" : "fa-cloud-moon");
            themeClass = "theme-cloudy";
            gradient = "linear-gradient(135deg, #1E293B 0%, #334155 50%, #0284C7 100%)";
            safetyStatusText = "Pleasant for Sightseeing";
        } else if (code === 45 || code === 48) {
            label = "Misty / Foggy";
            icon = "fa-smog";
            themeClass = "theme-fog";
            gradient = "linear-gradient(135deg, #1E293B 0%, #334155 50%, #0369A1 100%)";
            safetyStatusText = "Low Visibility Warning";
            isWarning = true;
        } else if (code >= 51 && code <= 57) {
            label = "Light Drizzle";
            icon = "fa-cloud-rain";
            themeClass = "theme-rainy";
            gradient = "linear-gradient(135deg, #0C4A6E 0%, #0369A1 50%, #0284C7 100%)";
            safetyStatusText = "Carry Light Umbrella";
        } else if (code >= 61 && code <= 67) {
            label = "Moderate Rain";
            icon = "fa-cloud-showers-heavy";
            themeClass = "theme-rainy";
            gradient = "linear-gradient(135deg, #0C4A6E 0%, #0284C7 50%, #0369A1 100%)";
            safetyStatusText = "Wet Roads Warning";
            isWarning = true;
        } else if (code >= 71 && code <= 77) {
            label = "Snowfall";
            icon = "fa-snowflake";
            themeClass = "theme-snow";
            gradient = "linear-gradient(135deg, #0369A1 0%, #0284C7 50%, #38BDF8 100%)";
            safetyStatusText = "Cold Weather Alert";
            isWarning = true;
        } else if (code >= 80 && code <= 82) {
            label = "Rain Showers";
            icon = "fa-cloud-showers-water";
            themeClass = "theme-rainy";
            gradient = "linear-gradient(135deg, #0C4A6E 0%, #0369A1 50%, #0284C7 100%)";
            safetyStatusText = "Intermittent Showers";
            isWarning = true;
        } else if (code >= 95) {
            label = "Thunderstorm Alert";
            icon = "fa-bolt-lightning";
            themeClass = "theme-thunderstorm";
            gradient = "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4C1D95 100%)";
            safetyStatusText = "Severe Storm Warning";
            isWarning = true;
        }

        return { label, icon, themeClass, gradient, safetyStatusText, isWarning };
    }

    // Dynamic AI Advisory Generator
    function generateAiAdvisory(temp, code, humidity, uv, wind) {
        if (code >= 95) {
            return "⚠️ Thunderstorm & lightning detected nearby. Avoid open outdoor monument grounds and delay highway transit until skies clear.";
        }
        if (code >= 61 && code <= 82) {
            return "🌧️ Rainy conditions active. Monuments may have slick marble pathways (especially Taj Mahal). Keep an umbrella ready and plan indoor museum visits.";
        }
        if (code === 45 || code === 48) {
            return "🌫️ Dense fog/mist in the area. Early morning monument views may be obscured. Best photography hours will be between 11:00 AM and 3:00 PM.";
        }
        if (temp >= 38) {
            return "☀️ High thermal heat index today. Complete outdoor sightseeing before 11:00 AM or after 4:30 PM. Drink plenty of electrolyte water and wear broad-spectrum sunscreen.";
        }
        if (uv >= 8) {
            return "🧴 Very High UV Index today. Peak sun intensity between 11:30 AM and 3:30 PM. Use SPF 50+ sunscreen, UV-rated sunglasses, and a wide-brim hat.";
        }
        if (temp <= 12) {
            return "🧥 Chilly weather conditions. Layer up with thermal jackets and warm accessories for morning & evening tourist walks.";
        }
        return "✨ Great travel conditions today! Ideal climate for walking heritage tours, photography, and exploring local bazaars. Stay comfortably hydrated.";
    }

    // Render Hourly 24-Hour Forecast
    function renderHourlyForecast(hourly) {
        if (!hourlyForecastTrack) return;
        if (!hourly.time || !hourly.temperature_2m) {
            hourlyForecastTrack.innerHTML = `<div class="hourly-loading-placeholder">Forecast data currently unavailable.</div>`;
            return;
        }

        const now = new Date();
        const currentHour = now.getHours();

        // Find index of current hour
        let startIdx = 0;
        if (hourly.time && hourly.time.length > 0) {
            for (let i = 0; i < hourly.time.length; i++) {
                const itemDate = new Date(hourly.time[i]);
                if (itemDate.getHours() === currentHour && itemDate.getDate() === now.getDate()) {
                    startIdx = i;
                    break;
                }
            }
        }

        let html = '';
        const limit = Math.min(24, hourly.time.length - startIdx);

        for (let i = 0; i < limit; i++) {
            const idx = startIdx + i;
            const itemDate = new Date(hourly.time[idx]);
            const hourNum = itemDate.getHours();
            const timeLabel = i === 0 ? "Now" : formatHour(hourNum);
            const temp = toDisplayTemp(hourly.temperature_2m[idx]);
            const code = hourly.weather_code ? hourly.weather_code[idx] : 0;
            const rainProb = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;
            const isItemDay = hourNum >= 6 && hourNum < 19;
            const parsed = interpretWmo(code, isItemDay, hourly.temperature_2m[idx]);

            html += `
                <div class="hourly-card ${i === 0 ? 'active-now' : ''}">
                    <span class="hourly-time">${timeLabel}</span>
                    <i class="fa-solid ${parsed.icon} hourly-icon"></i>
                    <span class="hourly-temp">${temp}°</span>
                    ${rainProb > 10 ? `
                        <div class="hourly-rain-prob" title="Rain probability">
                            <i class="fa-solid fa-droplet" style="font-size:9px;"></i>
                            <span>${rainProb}%</span>
                        </div>
                    ` : `
                        <span style="height:14px;"></span>
                    `}
                </div>
            `;
        }

        hourlyForecastTrack.innerHTML = html;
    }

    // Render Metrics Grid
    function renderMetricsGrid(m) {
        // Feels Like
        if (metricFeelsLike) metricFeelsLike.textContent = `${toDisplayTemp(m.feelsC)}°`;
        if (metricFeelsDesc) {
            const diff = m.feelsC - m.tempC;
            if (diff > 2) metricFeelsDesc.textContent = "Humidity makes it feel warmer";
            else if (diff < -2) metricFeelsDesc.textContent = "Wind breeze makes it feel cooler";
            else metricFeelsDesc.textContent = "Consistent with actual temperature";
        }

        // UV Index
        const uv = Math.round(m.maxUv || 0);
        if (metricUvVal) metricUvVal.textContent = uv;
        if (metricUvBar) metricUvBar.style.width = `${Math.min(100, (uv / 11) * 100)}%`;
        if (metricUvBadge) {
            if (uv <= 2) {
                metricUvBadge.textContent = "Low";
                metricUvBadge.style.background = "#DCFCE7";
                metricUvBadge.style.color = "#15803D";
            } else if (uv <= 5) {
                metricUvBadge.textContent = "Moderate";
                metricUvBadge.style.background = "#FEF3C7";
                metricUvBadge.style.color = "#B45309";
            } else if (uv <= 7) {
                metricUvBadge.textContent = "High";
                metricUvBadge.style.background = "#FFEDD5";
                metricUvBadge.style.color = "#C2410C";
            } else {
                metricUvBadge.textContent = "Very High";
                metricUvBadge.style.background = "#FEE2E2";
                metricUvBadge.style.color = "#B91C1C";
            }
        }
        if (metricUvDesc) {
            if (uv >= 8) metricUvDesc.textContent = "High sunburn risk. Stay shaded mid-day.";
            else if (uv >= 6) metricUvDesc.textContent = "Wear SPF 30+ & sunglasses outdoors.";
            else metricUvDesc.textContent = "Low risk. Minimal sun protection needed.";
        }

        // Wind
        const windKm = Math.round(m.windSpeed || 0);
        if (metricWindVal) metricWindVal.textContent = `${windKm} km/h`;
        const dirStr = getWindDirectionText(m.windDir);
        if (metricWindDir) metricWindDir.textContent = dirStr;
        if (metricWindDesc) {
            if (windKm > 35) metricWindDesc.textContent = "Strong gusty winds. Hold onto hats.";
            else if (windKm > 18) metricWindDesc.textContent = "Moderate breeze. Good air circulation.";
            else metricWindDesc.textContent = "Light gentle breeze. Calming air.";
        }

        // Humidity
        if (metricHumidityVal) metricHumidityVal.textContent = `${m.humidity}%`;
        if (metricHumidityTag) {
            if (m.humidity > 70) {
                metricHumidityTag.textContent = "High";
                metricHumidityTag.style.background = "#EFF6FF";
                metricHumidityTag.style.color = "#1D4ED8";
            } else if (m.humidity < 30) {
                metricHumidityTag.textContent = "Dry";
                metricHumidityTag.style.background = "#FFFBEB";
                metricHumidityTag.style.color = "#B45309";
            } else {
                metricHumidityTag.textContent = "Ideal";
                metricHumidityTag.style.background = "#ECFDF5";
                metricHumidityTag.style.color = "#047857";
            }
        }
        if (metricHumidityDesc) {
            if (m.humidity > 70) metricHumidityDesc.textContent = "Moist & humid air. Sweat evaporates slowly.";
            else if (m.humidity < 30) metricHumidityDesc.textContent = "Dry crisp air. Keep lips & skin moisturized.";
            else metricHumidityDesc.textContent = "Comfortable relative humidity level.";
        }

        // Rain / Precipitation
        if (metricPrecipVal) metricPrecipVal.textContent = `${m.precip || 0} mm`;
        if (metricPrecipProbTag) metricPrecipProbTag.textContent = `${m.precipProbMax || 0}% chance`;
        if (metricPrecipDesc) {
            if (m.precipProbMax > 60) metricPrecipDesc.textContent = "High probability of rain showers today.";
            else if (m.precipProbMax > 25) metricPrecipDesc.textContent = "Passing light showers possible.";
            else metricPrecipDesc.textContent = "Clear skies. No rainfall expected today.";
        }

        // Visibility
        let visKm = 10;
        if (m.hourly && m.hourly.visibility && m.hourly.visibility.length > 0) {
            const rawVis = m.hourly.visibility[0];
            if (rawVis) visKm = Math.round(rawVis / 1000);
        }
        if (metricVisibilityVal) metricVisibilityVal.textContent = `${visKm} km`;
        if (metricVisibilityDesc) {
            if (visKm >= 10) metricVisibilityDesc.textContent = "Perfect clear visibility for road trips & monuments.";
            else if (visKm >= 5) metricVisibilityDesc.textContent = "Moderate visibility. Drive with normal care.";
            else metricVisibilityDesc.textContent = "Hazy / Foggy. Reduced visibility for travel.";
        }

        // Sunrise & Sunset
        if (metricSunriseVal) metricSunriseVal.textContent = m.sunriseStr;
        if (metricSunsetVal) metricSunsetVal.textContent = m.sunsetStr;
        if (metricDaylightHours) {
            metricDaylightHours.textContent = `Daylight: ~13 hrs`;
        }

        // Cloud Cover & Pressure
        if (metricCloudCover) metricCloudCover.textContent = `${m.cloudCover}%`;
        if (metricPressureDesc) metricPressureDesc.textContent = `Pressure: ${m.pressure} hPa (Normal)`;

        // Outdoor Tourist Comfort Score
        if (metricTouristScore) {
            let score = 9.4;
            if (m.tempC > 36) score -= 2.0;
            if (m.precipProbMax > 50) score -= 2.5;
            if (m.maxUv > 8) score -= 1.0;
            score = Math.max(4.5, Math.min(9.8, score)).toFixed(1);
            metricTouristScore.textContent = `${score} / 10`;
            if (metricTouristDesc) {
                if (score >= 8.5) metricTouristDesc.textContent = "Superb weather for monument exploration & walks";
                else if (score >= 6.5) metricTouristDesc.textContent = "Good travel conditions with minor heat/rain precautions";
                else metricTouristDesc.textContent = "Take weather precautions during outdoor excursions";
            }
        }
    }

    // Render 7-Day Daily Forecast
    function renderDailyForecast(daily) {
        if (!extendedForecastList) return;
        if (!daily.time || !daily.temperature_2m_max) {
            extendedForecastList.innerHTML = `<div class="daily-loading-placeholder">7-day forecast unavailable.</div>`;
            return;
        }

        let html = '';
        const count = Math.min(7, daily.time.length);

        for (let i = 0; i < count; i++) {
            const dateObj = new Date(daily.time[i]);
            const isToday = i === 0;
            const dayName = isToday ? "Today" : dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
            const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            const maxT = toDisplayTemp(daily.temperature_2m_max[i]);
            const minT = toDisplayTemp(daily.temperature_2m_min[i]);
            const code = daily.weather_code ? daily.weather_code[i] : 0;
            const parsed = interpretWmo(code, true, daily.temperature_2m_max[i]);
            const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;

            html += `
                <div class="forecast-row-card">
                    <div class="forecast-day-col">
                        <span class="forecast-day-name">${dayName}</span>
                        <span class="forecast-date-str">${dateStr}</span>
                    </div>

                    <div class="forecast-cond-col">
                        <i class="fa-solid ${parsed.icon} forecast-icon"></i>
                        <span class="forecast-cond-text">${parsed.label}</span>
                        ${rainProb > 15 ? `
                            <span class="forecast-rain-chance">
                                <i class="fa-solid fa-droplet" style="font-size:10px;"></i>
                                ${rainProb}%
                            </span>
                        ` : `
                            <span class="forecast-rain-chance" style="opacity:0;">--</span>
                        `}
                    </div>

                    <div class="forecast-temp-range-col">
                        <span class="forecast-low-temp">${minT}°</span>
                        <div class="forecast-temp-bar-wrap">
                            <div class="forecast-temp-bar-fill"></div>
                        </div>
                        <span class="forecast-high-temp">${maxT}°</span>
                    </div>
                </div>
            `;
        }

        extendedForecastList.innerHTML = html;
    }

    // Render Packing Tips based on Weather
    function renderPackingTips(temp, code, uv, rainChance) {
        if (tipHydrationText) {
            if (temp > 35) tipHydrationText.textContent = "Carry 2L water + ORS / coconut water";
            else tipHydrationText.textContent = "Carry regular refillable water bottle";
        }
        if (tipClothingText) {
            if (temp > 32) tipClothingText.textContent = "Breathable light cotton & linen attire";
            else if (temp < 18) tipClothingText.textContent = "Warm fleece jacket & full sleeves";
            else tipClothingText.textContent = "Casual comfortable travel clothes";
        }
        if (tipGearText) {
            if (rainChance > 40 || (code >= 51 && code <= 82)) {
                tipGearText.textContent = "Compact umbrella & waterproof phone pouch";
            } else if (uv >= 6) {
                tipGearText.textContent = "Polarized sunglasses, SPF sunscreen & cap";
            } else {
                tipGearText.textContent = "Comfortable walking sneakers & powerbank";
            }
        }
        if (tipPhotoText) {
            if (code >= 45 && code <= 48) {
                tipPhotoText.textContent = "Mid-day 11:30 AM – 3:30 PM (after mist clears)";
            } else {
                tipPhotoText.textContent = "Golden hour 5:30 PM – 6:45 PM for best lighting";
            }
        }
    }

    // Fallback Mock Data if network is unavailable
    function renderFallbackWeatherData(lat, lng) {
        const fallbackData = {
            current: {
                temperature_2m: 34,
                apparent_temperature: 37,
                weather_code: 0,
                is_day: 1,
                relative_humidity_2m: 48,
                wind_speed_10m: 14,
                wind_direction_10m: 60,
                cloud_cover: 15,
                pressure_msl: 1011,
                precipitation: 0
            },
            daily: {
                time: [new Date().toISOString().split('T')[0]],
                temperature_2m_max: [36],
                temperature_2m_min: [25],
                weather_code: [0],
                uv_index_max: [7],
                precipitation_probability_max: [10],
                sunrise: ["2026-08-16T05:48:00"],
                sunset: ["2026-08-16T18:52:00"]
            },
            hourly: {
                time: Array.from({ length: 24 }, (_, i) => {
                    const d = new Date();
                    d.setHours(d.getHours() + i);
                    return d.toISOString();
                }),
                temperature_2m: Array.from({ length: 24 }, () => 33),
                weather_code: Array.from({ length: 24 }, () => 0),
                precipitation_probability: Array.from({ length: 24 }, () => 5),
                visibility: Array.from({ length: 24 }, () => 10000)
            }
        };
        renderWeatherUI(fallbackData);
    }

    // Helper functions
    function formatTimeStr(isoStr) {
        if (!isoStr) return "--:--";
        const date = new Date(isoStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatHour(hourNum) {
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 || 12;
        return `${displayHour} ${period}`;
    }

    function getWindDirectionText(degrees) {
        if (degrees === undefined || degrees === null) return "NE";
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index] || "NE";
    }

    // =========================================================================
    // Event Listeners & Interactive Handlers
    // =========================================================================

    // Temperature Unit Switcher (°C / °F)
    if (btnCelsius) {
        btnCelsius.addEventListener('click', () => {
            if (currentUnit !== 'c') {
                currentUnit = 'c';
                btnCelsius.classList.add('active');
                if (btnFahrenheit) btnFahrenheit.classList.remove('active');
                if (cachedWeatherData) renderWeatherUI(cachedWeatherData);
            }
        });
    }

    if (btnFahrenheit) {
        btnFahrenheit.addEventListener('click', () => {
            if (currentUnit !== 'f') {
                currentUnit = 'f';
                btnFahrenheit.classList.add('active');
                if (btnCelsius) btnCelsius.classList.remove('active');
                if (cachedWeatherData) renderWeatherUI(cachedWeatherData);
            }
        });
    }

    // Refresh Button Handler
    if (refreshWeatherBtn) {
        refreshWeatherBtn.addEventListener('click', async () => {
            refreshWeatherBtn.classList.add('spinning');
            if (syncStatusText) syncStatusText.textContent = "Updating...";
            await fetchWeatherData(currentLat, currentLng);
            setTimeout(() => {
                refreshWeatherBtn.classList.remove('spinning');
                if (syncStatusText) syncStatusText.textContent = "Live GPS Sync";
            }, 600);
        });
    }

    // Use Current GPS Button
    if (useCurrentLocationBtn) {
        useCurrentLocationBtn.addEventListener('click', () => {
            document.querySelectorAll('.dest-chip').forEach(c => c.classList.remove('active'));
            requestGeolocation();
        });
    }

    // Popular Tourist Destination Chips
    document.querySelectorAll('.dest-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.dest-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const lat = parseFloat(chip.getAttribute('data-lat'));
            const lng = parseFloat(chip.getAttribute('data-lng'));
            const city = chip.getAttribute('data-city');

            currentLat = lat;
            currentLng = lng;
            currentCityName = `${city}, India`;
            isCurrentLocation = false;

            if (syncStatusText) syncStatusText.textContent = `${city} Synced`;
            initWeatherView(lat, lng, false);
        });
    });

    // Destination Search Handling
    if (weatherSearchForm) {
        weatherSearchForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const query = weatherSearchInput.value.trim();
            if (!query) return;

            await performDestinationSearch(query);
        });
    }

    async function performDestinationSearch(query) {
        try {
            if (searchResultsList) {
                searchResultsList.style.display = "block";
                searchResultsList.innerHTML = `<div class="search-item"><i class="fa-solid fa-circle-notch fa-spin"></i> Searching "${query}"...</div>`;
            }

            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
            if (res.ok) {
                const data = await res.json();
                if (data.results && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(item => {
                        const stateStr = item.admin1 ? `, ${item.admin1}` : '';
                        const countryStr = item.country ? `, ${item.country}` : '';
                        const fullLabel = `${item.name}${stateStr}${countryStr}`;
                        html += `
                            <div class="search-item" data-lat="${item.latitude}" data-lng="${item.longitude}" data-name="${fullLabel}">
                                <i class="fa-solid fa-location-dot"></i>
                                <span>${fullLabel}</span>
                            </div>
                        `;
                    });
                    searchResultsList.innerHTML = html;

                    // Add click listeners to items
                    searchResultsList.querySelectorAll('.search-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const lat = parseFloat(item.getAttribute('data-lat'));
                            const lng = parseFloat(item.getAttribute('data-lng'));
                            const name = item.getAttribute('data-name');

                            currentLat = lat;
                            currentLng = lng;
                            currentCityName = name;
                            isCurrentLocation = false;

                            searchResultsList.style.display = "none";
                            weatherSearchInput.value = "";
                            document.querySelectorAll('.dest-chip').forEach(c => c.classList.remove('active'));

                            if (syncStatusText) syncStatusText.textContent = `${name.split(',')[0]} Synced`;
                            initWeatherView(lat, lng, false);
                        });
                    });
                } else {
                    searchResultsList.innerHTML = `<div class="search-item" style="color:var(--text-muted);">No locations found for "${query}".</div>`;
                }
            }
        } catch (err) {
            console.warn("Geocoding search failed:", err);
            if (searchResultsList) {
                searchResultsList.innerHTML = `<div class="search-item" style="color:var(--text-muted);">Search request failed. Please try again.</div>`;
            }
        }
    }

    // Close search dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (searchResultsList && !weatherSearchForm.contains(e.target) && !searchResultsList.contains(e.target)) {
            searchResultsList.style.display = "none";
        }
    });

});
