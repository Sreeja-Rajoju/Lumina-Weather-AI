// Map Modal Functions
let map = null;
let currentMarker = null;

function initMapButton() {
    const mapBtn = document.getElementById('mapBtn');
    if (mapBtn) {
        mapBtn.addEventListener('click', function () {
            openMapModal();
        });
    }
}

function openMapModal() {
    const mapModal = document.getElementById('mapModal');
    if (mapModal) {
        mapModal.classList.add('active');
        setTimeout(() => {
            initWorldMap();
        }, 100);
    }
}

function closeMapModal() {
    const mapModal = document.getElementById('mapModal');
    if (mapModal) {
        mapModal.classList.remove('active');
        if (map) {
            map.remove();
            map = null;
            currentMarker = null;
        }
    }
}

function initWorldMap() {
    const worldMapDiv = document.getElementById('worldMap');
    if (!worldMapDiv) return;

    if (map) {
        map.invalidateSize();
        return;
    }

    map = L.map('worldMap', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 13,
        zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    map.on('click', function (e) {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        if (currentMarker) {
            map.removeLayer(currentMarker);
        }

        const purpleIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background: #7c4dff; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(124, 77, 255, 0.6);"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        currentMarker = L.marker([lat, lon], { icon: purpleIcon }).addTo(map);
        getWeatherByCoordinates(lat, lon);
    });
}

function getWeatherByCoordinates(lat, lon) {
    const instruction = document.querySelector('.map-instruction');
    const originalText = instruction.innerHTML;
    instruction.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching weather data...';

    // Proxied through our backend to protect the API key
    fetch(`${CONFIG.API_BASE_URL}/api/reverse-geocode?lat=${lat}&lon=${lon}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                let selectedLocation = data[0];
                for (let location of data) {
                    if (location.state) {
                        selectedLocation = location;
                        break;
                    }
                }

                const cityName = selectedLocation.name;
                const country = selectedLocation.country;
                const state = selectedLocation.state || '';

                const popupContent = `
                    <div class="weather-popup">
                        <h3><i class="fas fa-location-dot"></i> ${cityName}</h3>
                        <p>${state ? state + ', ' : ''}${country}</p>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">
                            Lat: ${lat.toFixed(4)}°, Lon: ${lon.toFixed(4)}°
                        </p>
                        <button onclick="selectMapLocation('${cityName.replace(/'/g, "\\'")}')">
                            <i class="fas fa-check"></i> Get Weather
                        </button>
                    </div>
                `;

                currentMarker.bindPopup(popupContent, {
                    maxWidth: 250,
                    className: 'custom-popup'
                }).openPopup();

                instruction.innerHTML = `<i class="fas fa-check-circle" style="color: #7c4dff;"></i> Location found: ${cityName}, ${country}`;
            } else {
                instruction.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ff4757;"></i> No city found at this location. Try clicking on a populated area.';
                setTimeout(() => { instruction.innerHTML = originalText; }, 3000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            instruction.innerHTML = '<i class="fas fa-exclamation-circle" style="color: #ff4757;"></i> Failed to get location data. Please try again.';
            setTimeout(() => { instruction.innerHTML = originalText; }, 3000);
        });
}

function selectMapLocation(cityName) {
    closeMapModal();
    if (typeof fetchWeather === 'function') {
        fetchWeather(cityName);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initMapButton();
});
