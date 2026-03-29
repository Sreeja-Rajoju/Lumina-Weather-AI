const CONFIG = {
    // ⚙️ API Configuration
    // When local, uses localhost. When deployed, it points to the production Render URL.
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://127.0.0.1:5000' 
        : 'https://lumina-weather-ai.onrender.com', // ⚠️ UPDATE THIS URL AFTER YOUR RENDER DEPLOYMENT
};
