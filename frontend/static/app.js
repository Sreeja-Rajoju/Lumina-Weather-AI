// Favorite Cities Management
const defaultFavorites = ['Dubai', 'Reykjavik', 'Mumbai', 'London', 'Yakutsk', 'Singapore'];
let favorites = JSON.parse(localStorage.getItem('favoriteCities'));

if (!favorites || favorites.length === 0) {
    favorites = defaultFavorites;
    localStorage.setItem('favoriteCities', JSON.stringify(favorites));
}

let currentUnit = localStorage.getItem('tempUnit') || 'C';
let currentTheme = localStorage.getItem('theme') || 'dark';
let animationsEnabled = localStorage.getItem('animations') !== 'false';

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    updateFavoritesDisplay();
    initSidebarNavigation();
    initTheme();
    initSearchForm();
    
    // Check for city in URL params or default to favorites[3] (London)
    const urlParams = new URLSearchParams(window.location.search);
    const cityParam = urlParams.get('city');
    const latParam = urlParams.get('lat');
    const lonParam = urlParams.get('lon');
    const unitsParam = urlParams.get('units');

    if (unitsParam) {
        currentUnit = unitsParam === 'imperial' ? 'F' : 'C';
        localStorage.setItem('tempUnit', currentUnit);
    }

    if (cityParam) {
        fetchWeather(cityParam);
    } else if (latParam && lonParam) {
        fetchWeatherByCoords(latParam, lonParam);
    } else {
        fetchWeather(favorites[3] || 'London');
    }
});

// ─── API Fetching ───

async function fetchWeather(city) {
    showLoading(true);
    const units = currentUnit === 'F' ? 'imperial' : 'metric';
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}&units=${units}`);
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
        } else {
            renderWeather(data);
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        showError('Unable to connect to the weather service.');
    } finally {
        showLoading(false);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    showLoading(true);
    const units = currentUnit === 'F' ? 'imperial' : 'metric';
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/weather?lat=${lat}&lon=${lon}&units=${units}`);
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
        } else {
            renderWeather(data);
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        showError('Unable to connect to the weather service.');
    } finally {
        showLoading(false);
    }
}

// ─── DOM Rendering ───

function renderWeather(data) {
    const { weather, forecast, daily, aqi, pollen, insights } = data;
    const unitLabel = currentUnit;

    // Update Body Class for BG
    document.body.className = `${currentTheme === 'light' ? 'light-theme' : ''} weather-${weather.condition}`;

    // 1. Current Weather
    const weatherContainer = document.getElementById('currentWeatherContainer');
    weatherContainer.innerHTML = `
        <div class="current-weather-card">
            <div class="card-header">
                <div class="location-tag" data-city="${weather.city}">
                    <i class="fas fa-location-dot"></i> ${weather.city}, ${weather.country}
                    <button class="fav-btn" onclick="toggleFavorite('${weather.city}')" title="Add to favorites">
                        <i class="${favorites.includes(weather.city) ? 'fas' : 'far'} fa-heart" id="favIcon"></i>
                    </button>
                </div>
                <div class="unit-toggle" onclick="toggleUnitChange()" title="Toggle °C / °F">
                    <span style="font-size: 0.8rem; font-weight: bold; margin-right: 5px;">°${unitLabel}</span>
                    <i class="fas fa-exchange-alt"></i>
                </div>
            </div>
            <div class="date-time">${weather.date}</div>

            <div class="weather-info-main">
                <div class="main-temp">${weather.temp}°${unitLabel}</div>
                <div class="weather-details">
                    <div class="feels-like">Feels Like ${weather.feels_like}°${unitLabel}</div>
                    <div class="temp-range">High: ${weather.high}° Low: ${weather.low}°</div>
                    <div class="description">
                        <i class="fas fa-cloud"></i> ${weather.description}
                    </div>
                </div>
            </div>

            <div class="sun-times">
                <div class="sun-item">
                    <i class="fas fa-sunrise"></i>
                    <div>
                        <span class="label">Sunrise</span>
                        <span class="time">${weather.sunrise}</span>
                    </div>
                </div>
                <div class="sun-item">
                    <i class="fas fa-sunset"></i>
                    <div>
                        <span class="label">Sunset</span>
                        <span class="time">${weather.sunset}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 2. Hourly Forecast
    const hourlyRow = document.getElementById('hourlyForecastRow');
    hourlyRow.innerHTML = forecast.map(item => `
        <div class="forecast-card">
            <span class="f-time">${item.time}</span>
            <img src="http://openweathermap.org/img/wn/${item.icon}.png" alt="Icon">
            <span class="f-temp">${item.temp}°</span>
        </div>
    `).join('');

    // Update Day Length (Static for now as in old code)
    const sunDetailsCard = document.getElementById('sunDetailsCard');
    sunDetailsCard.innerHTML = `
        <div class="sun-item">
            <p>Sunrise</p>
            <h3>${weather.sunrise}</h3>
        </div>
        <div class="sun-item">
            <p>Sunset</p>
            <h3>${weather.sunset}</h3>
        </div>
        <div class="sun-details">
            <p>Length of day</p>
            <h3>10h 23m</h3>
        </div>
    `;

    // 3. Daily Forecast
    const dailySection = document.getElementById('dailyForecastSection');
    const dailyGrid = document.getElementById('dailyForecastGrid');
    if (daily && daily.length > 0) {
        dailySection.style.display = 'block';
        dailyGrid.innerHTML = daily.map(day => `
            <div class="daily-card">
                <div class="daily-day">${day.day}</div>
                <div class="daily-date">${day.date}</div>
                <img src="http://openweathermap.org/img/wn/${day.icon}.png" alt="Icon">
                <div class="daily-temps">
                    <span class="daily-high">${day.high}°</span>
                    <span class="daily-low">${day.low}°</span>
                </div>
            </div>
        `).join('');
    } else {
        dailySection.style.display = 'none';
    }

    // 4. AI Insights
    const aiSection = document.getElementById('aiInsightsSection');
    const aiContainer = document.getElementById('aiInsightsContainer');
    if (insights) {
        aiSection.style.display = 'block';
        aiContainer.innerHTML = `
            <div class="ai-summary-card">
                <div class="ai-icon"><i class="fas fa-comment-dots"></i></div>
                <div class="ai-text">
                    <h3>Today's Vibe</h3>
                    <p>${insights.summary}</p>
                </div>
            </div>

            <div class="suggestions-grid">
                <div class="suggestion-card activity">
                    <div class="gender-icon"><i class="fas fa-person-running"></i></div>
                    <div class="suggestion-content">
                        <h4>Activity Tip</h4>
                        <p>${insights.activities}</p>
                    </div>
                </div>
                <div class="suggestion-card men">
                    <div class="gender-icon"><i class="fas fa-mars"></i></div>
                    <div class="suggestion-content">
                        <h4>For Men</h4>
                        <p>${insights.men}</p>
                    </div>
                </div>
                <div class="suggestion-card women">
                    <div class="gender-icon"><i class="fas fa-venus"></i></div>
                    <div class="suggestion-content">
                        <h4>For Women</h4>
                        <p>${insights.women}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        aiSection.style.display = 'none';
    }

    // 5. Highlights
    const highlightsGrid = document.getElementById('highlightsGrid');
    let highlightsHTML = `
        <div class="highlight-card">
            <p>Chance of Rain</p>
            <div class="h-value">${weather.rain_chance}%</div>
            <i class="fas fa-cloud-showers-heavy"></i>
        </div>
        <div class="highlight-card">
            <p>UV Index</p>
            <div class="h-value">${weather.uv_index}</div>
            <i class="fas fa-sun"></i>
        </div>
        <div class="highlight-card">
            <p>Wind Status</p>
            <div class="h-value">${weather.wind_speed} m/s</div>
            <i class="fas fa-wind"></i>
        </div>
        <div class="highlight-card">
            <p>Humidity</p>
            <div class="h-value">${weather.humidity}%</div>
            <i class="fas fa-droplet"></i>
        </div>
    `;

    if (aqi) {
        highlightsHTML += `
            <div class="highlight-card">
                <p>Air Quality</p>
                <div class="h-value">${aqi.val}</div>
                <p style="color: var(--text-secondary); font-size: 0.8rem;">${aqi.label}</p>
                <i class="fas fa-lungs" style="opacity: 0.5;"></i>
            </div>
        `;
    }

    if (pollen) {
        highlightsHTML += `
            <div class="highlight-card">
                <p>Pollen (Grass)</p>
                <div class="h-value">${pollen.grass}</div>
                <p style="color: var(--text-secondary); font-size: 0.8rem;">Tree: ${pollen.tree}</p>
                <i class="fas fa-tree" style="opacity: 0.5;"></i>
            </div>
        `;
    }

    highlightsGrid.innerHTML = highlightsHTML;

    // Show Dashboard
    const dashboardGrid = document.getElementById('dashboardGrid');
    dashboardGrid.style.opacity = '1';
}

// ─── UI Actions ───

function initSearchForm() {
    const searchForm = document.getElementById('searchForm');
    const cityInput = document.getElementById('cityInput');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const city = cityInput.value.trim();
            if (city) fetchWeather(city);
        });
    }
}

function toggleUnitChange() {
    currentUnit = currentUnit === 'C' ? 'F' : 'C';
    localStorage.setItem('tempUnit', currentUnit);
    const locationTag = document.querySelector('.location-tag');
    if (locationTag) {
        const currentCity = locationTag.getAttribute('data-city');
        fetchWeather(currentCity);
    }
}

function toggleFavorite(city) {
    const index = favorites.indexOf(city);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(city);
    }
    localStorage.setItem('favoriteCities', JSON.stringify(favorites));
    updateFavoritesDisplay();
    
    // Update active heart icon
    const favIcon = document.getElementById('favIcon');
    if (favIcon) {
        if (favorites.includes(city)) {
            favIcon.classList.remove('far');
            favIcon.classList.add('fas');
        } else {
            favIcon.classList.remove('fas');
            favIcon.classList.add('far');
        }
    }
}

function updateFavoritesDisplay() {
    const favCount = document.getElementById('favCount');
    const favoritesList = document.getElementById('favoritesList');
    if (favCount) favCount.textContent = favorites.length;
    if (favoritesList) {
        if (favorites.length === 0) {
            favoritesList.innerHTML = '<p class="no-favorites">No favorites yet. Click the heart icon to add cities!</p>';
        } else {
            favoritesList.innerHTML = favorites.map(city => `
                <div class="fav-city-item" onclick="fetchWeather('${city.replace(/'/g, "\\'")}')">
                    <div class="fav-city-name">
                        <i class="fas fa-location-dot"></i>
                        ${city}
                    </div>
                </div>
            `).join('');
        }
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function showError(msg) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `<div class="error-toast">${msg}</div>`;
    setTimeout(() => container.innerHTML = '', 5000);
}

// ─── Utility Navigation ───

function initSidebarNavigation() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    document.body.classList.toggle('light-theme', currentTheme === 'light');
    const icon = document.querySelector('#themeToggleBtn i');
    if (icon) {
        icon.className = currentTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function initTheme() {
    document.body.classList.toggle('light-theme', currentTheme === 'light');
    const icon = document.querySelector('#themeToggleBtn i');
    if (icon) {
        icon.className = currentTheme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function showDashboard() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToFavorites() {
    const section = document.querySelector('.favorite-cities');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

function scrollToForecast() {
    const section = document.querySelector('.daily-forecast-section');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

function showSettings() {
    // Basic settings modal logic (reused/simplified from old code)
    const settingsHTML = `
        <div class="settings-modal" id="settingsModal">
            <div class="settings-content">
                <div class="settings-header">
                    <h2><i class="fas fa-gear"></i> Settings</h2>
                    <button onclick="document.getElementById('settingsModal').remove()" class="close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="settings-body">
                    <div class="setting-item">
                        <label>Temperature Unit</label>
                        <div class="toggle-group">
                            <button class="toggle-btn ${currentUnit === 'C' ? 'active' : ''}" onclick="setUnit('C')">Celsius (°C)</button>
                            <button class="toggle-btn ${currentUnit === 'F' ? 'active' : ''}" onclick="setUnit('F')">Fahrenheit (°F)</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', settingsHTML);
}

function setUnit(unit) {
    currentUnit = unit;
    localStorage.setItem('tempUnit', unit);
    document.getElementById('settingsModal').remove();
    const city = document.querySelector('.location-tag')?.getAttribute('data-city');
    if (city) fetchWeather(city);
}
