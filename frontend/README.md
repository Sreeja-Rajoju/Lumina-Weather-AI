# 🎨 Lumina Weather AI — Frontend

This folder contains the **HTML, CSS, and JavaScript frontend** for the Lumina Weather AI dashboard.

## Structure
```
frontend/
├── templates/
│   └── index.html          # Jinja2 HTML template (served by Flask)
└── static/
    ├── style.css           # Main design system & layout
    ├── theme.css           # Dark/light theme variables
    ├── map.css             # Leaflet map modal styles
    ├── app.js              # Core dashboard logic & interactions
    ├── app_extra.js        # Additional UI helpers
    ├── map.js              # Interactive map with Leaflet
    ├── location.js         # Browser geolocation support
    └── favicon.jpg         # App favicon
```

## Design System

- **Font**: Outfit (Google Fonts)
- **Icons**: Font Awesome 6
- **Map**: Leaflet.js
- **Style**: Glassmorphism with animated backgrounds, dark/light modes, and smooth micro-animations.

## Notes

- The `templates/` folder is rendered by Flask's Jinja2 engine — it is **not** a standalone HTML file.
- Static assets are referenced via Flask's `url_for('static', filename='...')` helper.
- To make changes, edit files here and restart the backend server.
