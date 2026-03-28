# 🔧 Lumina Weather AI — Backend

This folder contains the **Flask Python backend** for the Lumina Weather AI dashboard.

## Structure
```
backend/
├── app.py              # Main Flask application
├── debug_weather.py    # Debug/test script
├── requirements.txt    # Python dependencies
├── Procfile            # Gunicorn production server config
└── .env                # API keys (not committed to git)
```

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Add your API keys to `.env`:
   ```
   OPENWEATHER_API_KEY=your_key_here
   GROQ_API_KEY=your_key_here
   ```

## Running

```bash
# Development
python app.py

# Production
gunicorn app:app
```

> The backend automatically serves frontend assets from `../frontend/static` and templates from `../frontend/templates`.
