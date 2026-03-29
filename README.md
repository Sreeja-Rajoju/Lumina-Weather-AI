# ⚡ Lumina Weather AI: Advanced Meteorology Suite

> A professional-grade, AI-powered weather dashboard featuring **Zero-Error precision** and **Gemma 3 27B** deep-insight integration.

![Lumina Weather AI](https://raw.githubusercontent.com/KadariUday/Lumina-Weather-AI/main/frontend/public/cover.png)

---

## 🎨 Premium Features

- **🧠 Google Gemma 3 27B IT**: Real-time clothing suggestions and activity planning powered by state-of-the-art AI.
- **🗺️ Interactive World Explorer**: Drop a pin anywhere on the globe using our high-accuracy Leaflet map to see local weather instantly.
- **🛡️ Fail-Safe AI Logic**: Built-in API Key rotation ensures 100% uptime for AI insights even if quotas are exceeded.
- **✨ Glassmorphic UI**: Experience weather in a stunning, high-contrast dark theme with fluent animations by **Framer Motion**.
- **📍 Precision Geolocation**: One-tap local fetching with robust error handling for "Zero Error" performance.

---

## 📁 Project Architecture

```
Lumina-Weather-AI/
│
├── frontend/               # ⚛️ React 19 + Vite + Tailwind (Vercel)
│   ├── src/                # Modular Components
│   │   ├── components/     # AIInsights, WeatherMapModal, Forecast...
│   │   ├── hooks/          # useWeather custom hook
│   │   └── assets/         # Premium Glassmorphic CSS
│   └── package.json        # Fast Vite build scripts
│
├── backend/                # 🚀 Flask REST API (Render / Python)
│   ├── app.py              # Logic & AI Fallback implementation
│   ├── requirements.txt    # google-genai, flask-cors, etc.
│   └── .env.example        # Documentation for API keys
│
├── .gitignore              # Multi-stack exclusion rules
└── README.md               ← You are here
```

---

## 🚀 Deployment Guide

### 1. Backend (Python/Flask)
1. **Navigate**: `cd backend`
2. **Setup**: `pip install -r requirements.txt`
3. **Environment**: Create `.env` based on `.env.example`.
4. **Deploy**: Deploy to **Render** with the command `gunicorn app:app`.

### 2. Frontend (React/Vite)
1. **Navigate**: `cd frontend`
2. **Setup**: `npm install`
3. **Connect**: Update your API endpoint in the fetch logic if deploying to production.
4. **Deploy**: Deploy the `frontend/` folder to **Vercel** as a "Vite" project.

---

## ⚙️ Local Development

```bash
# Terminal 1: Backend
cd backend
python app.py

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## 🛠️ Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| **UI**    | React 19, Vite, Framer Motion, CSS Variables|
| **AI**    | Google Gemma 3 27B IT (via GenAI SDK)       |
| **Server**| Python 3.12, Flask, Gunicorn, Flask-CORS    |
| **Map**   | Leaflet, React-Leaflet                      |
| **Style** | Premium Glassmorphism (Backdrop-filter)      |

---

## 👨‍💻 Developed By

**Kadari Uday**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/kadariuday)

---

> [!TIP]
> **Pro Tip**: Use the "World Map" to select a remote location, then check the "AI Insights"—the model will analyze specific humidity and AQI markers to give you the perfect outfit recommendation for that spot!
