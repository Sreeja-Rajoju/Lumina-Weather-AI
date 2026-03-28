# ⚡ Lumina Weather AI

> A professional-grade, multi-platform AI weather dashboard. Split architecture: **React-style Vanilla JS Frontend** + **Flask REST API Backend**.

![Lumina Weather AI](frontend/static/cover.png)

---

## 📁 Project Structure

```
Lumina-Weather-AI/
│
├── backend/                # 🚀 REST API (Deploy to Render)
│   ├── app.py              # Flask API with Gemma 3 27B AI
│   ├── requirements.txt    # Python dependencies (incl. CORS)
│   ├── Procfile            # Gunicorn config
│   └── .env                # API keys
│
├── frontend/               # 🎨 Static UI (Deploy to Vercel)
│   ├── index.html          # Main HTML (Static, no Jinja2)
│   ├── vercel.json         # Vercel hosting config
│   └── static/
│       ├── config.js       # ⚙️ API Configuration
│       ├── app.js          # DOM Rendering & logic
│       ├── location.js     # Geolocation helpers
│       └── map.js          # Interactive map logic
│
├── render.yaml             # Render Blueprint
└── README.md               ← You are here
```

---

## 🚀 Split Deployment Guide

This project is optimized for a **dual-service deployment**:

### 1. Backend (Render)
- **Repo Root**: `backend/`
- **Build**: `pip install -r backend/requirements.txt`
- **Start**: `gunicorn backend.app:app`
- **Env Vars**: Add `OPENWEATHER_API_KEY` and `GEMINI_API_KEY`.
- **Note**: Once deployed, copy your Render URL (e.g., `https://api.onrender.com`).

### 2. Frontend (Vercel)
- **Edit `frontend/static/config.js`**: Update `API_BASE_URL` with your Render URL.
- **Connect GitHub to Vercel**:
  - **Framework**: Other / None
  - **Root Directory**: `frontend`
  - **Build Command**: *(leave blank)*
  - **Output Directory**: `.`
- **Deploy**: Your UI is now live and talking to your backend!

---

## ⚙️ Local Development

1. **Start Backend**:
   ```bash
   cd backend
   python app.py
   ```
2. **Run Frontend**:
   Simply open `frontend/index.html` in your browser (Live Server recommended).
   *The frontend automatically detects `localhost` and connects to the local Flask API.*

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Python, Flask, Gunicorn, Flask-CORS |
| AI        | Google Gemma 3 27B IT (via GenAI)   |
| Frontend  | Vanilla JS, HTML5, CSS3             |
| Hosting   | Render (Backend) + Vercel (Frontend)|
| Map       | Leaflet.js                          |

---

## 👨‍💻 Author

**Kadari Uday**
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/kadariuday)
