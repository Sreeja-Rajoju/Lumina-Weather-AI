# Lumina Weather AI - Premium Intelligence Dashboard

Maintained by **Kadari Uday**

A professional-grade, modern, and responsive Weather Web Application built with Python, Flask, and the OpenWeather API, featuring AI-powered suggestions and interactive mapping.

## 🌟 Key Features

- **Real-Time Meteorology**: Fetches live weather conditions, 5-day forecasts, and hourly trends using OpenWeather API.
- **AI Outfit Guide**: Integrated **Groq AI** (Llama 3.3) to provide lightning-fast, personalized clothing suggestions based on current weather conditions.
- **Interactive World Map**: Powered by **Leaflet.js**, allowing users to explore global weather patterns by clicking any location.
- **Premium UI/UX**: Modern Glassmorphism-inspired design with:
    - **Theme System**: Persisted Dark "SkySense Navy" and Light modes.
    - **Unit Conversion**: Instant toggle between Celsius and Fahrenheit.
    - **Favorites Manager**: Quick access to pinned cities.
- **Robust Error Handling**: Graceful management of invalid inputs, API failures, and network issues.
- **Mobile Optimized**: Fully responsive layout for all device sizes.

## 🛠️ Technologies Used

- **Backend**: Python 3.13, Flask, Requests, Groq
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+), Leaflet.js
- **APIs**: OpenWeatherMap API, Groq Cloud API, Open-Meteo (Pollen data)
- **Icons & Fonts**: Font Awesome 6, Google Fonts (Outfit)

## 🚀 Setup Instructions

1. **Clone the Project**
   ```bash
   cd "Weather Dashboard"
   ```

2. **Install Dependencies**
   ```bash
   pip install flask requests groq
   ```

3. **Get API Keys**
   - **OpenWeatherMap**: [Get API Key here](https://openweathermap.org/api)
   - **Groq Cloud**: [Get Groq API Key here](https://console.groq.com/keys)

4. **Configure API Keys**
   - Open `app.py`.
   - Replace `API_KEY` (line 13) with your OpenWeather API key.
   - Replace `GROQ_API_KEY` (line 19) with your Groq API key.

5. **Run the Application**
   ```bash
   python app.py
   ```
   - Open your browser and navigate to `http://127.0.0.1:5000`.

## 📁 Project Structure
- `app.py`: Core Flask application and API integration logic.
- `templates/index.html`: Main dashboard template.
- `static/`:
    - `style.css`: Core design system and layout.
    - `app.js`: Main UI logic, favorites, and theme management.
    - `map.js`: Leaflet map integration and coordinate handling.
    - `location.js`: Geolocation and unit conversion logic.
## 🚀 Deployment (Hosting)

This application is ready to be hosted on **Render** (or Railway).

### Steps to Deploy on Render:
1.  **Connect GitHub**: Create a new **Web Service** on [Render](https://render.com) and connect this repository.
2.  **Runtime Settings**:
    - **Language**: `Python`
    - **Build Command**: `pip install -r requirements.txt`
    - **Start Command**: `gunicorn app:app`
3.  **Environment Variables**:
    Go to the **Environment** tab in your Render dashboard and add:
    - `OPENWEATHER_API_KEY`: Your OpenWeather API Key.
    - `GROQ_API_KEY`: Your Groq API Key.

---

### 🛡️ Security Note
The `.env` file is ignored by Git to protect your API keys. **Never** upload your keys directly to GitHub. Always use environment variables in your hosting provider's dashboard.
## 💡 Developer Insights (Interview Talking Points)
- **State Management**: Implemented client-side persistence for themes and favorites without external frameworks.
- **Performance**: Utilized `ThreadPoolExecutor` in the backend to parallelize multiple API requests (Weather, Forecast, AQI, Pollen), significantly reducing page load time.
- **AI Integration**: Leveraged LLMs to provide contextual utility (clothing suggestions) beyond raw data.
- **Visual Design**: Followed "Glassmorphism" principles to create a premium, high-end feel.---

<div align="center">
  <h3>✨ Built by Kadari Uday ✨</h3>
  <p><i>Transforming meteorological data into intelligent insights.</i></p>
  
  <a href="https://www.linkedin.com/in/kadariuday">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
</div>

---
