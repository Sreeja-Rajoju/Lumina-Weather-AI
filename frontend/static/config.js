const CONFIG = {
    // Replace with your Render backend URL once deployed, e.g., 'https://your-app.onrender.com'
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://127.0.0.1:5000' 
        : 'https://lumina-weather-ai.onrender.com', // Change this after Render deployment
};
