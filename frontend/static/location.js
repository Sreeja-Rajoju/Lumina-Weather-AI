document.addEventListener('DOMContentLoaded', () => {
    const locationBtn = document.getElementById('locationBtn');
    
    // Geolocation Handler
    if (locationBtn) {
        locationBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                locationBtn.classList.add('loading'); 
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lon = position.coords.longitude;
                        
                        // Call fetchWeatherByCoords from app.js
                        if (typeof fetchWeatherByCoords === 'function') {
                            fetchWeatherByCoords(lat, lon);
                        } else {
                            // Fallback to reload if not ready
                            window.location.href = `./?lat=${lat}&lon=${lon}`;
                        }
                        locationBtn.classList.remove('loading');
                    },
                    (error) => {
                        alert("Unable to retrieve your location. Please ensure location services are enabled.");
                        console.error(error);
                        locationBtn.classList.remove('loading');
                    }
                );
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        });
    }
});
