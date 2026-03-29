import React from 'react';

export function Highlights({ weather, aqi, pollen }) {
    if (!weather) return null;

    return (
        <section className="highlights-section">
            <h2>Today Highlight</h2>
            <div className="highlights-grid">
                <div className="highlight-card">
                    <p>Chance of Rain</p>
                    <div className="h-value">{weather.rain_chance}%</div>
                    <i className="fas fa-cloud-showers-heavy" style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '2rem', opacity: 0.3 }}></i>
                </div>
                <div className="highlight-card">
                    <p>UV Index</p>
                    <div className="h-value">{weather.uv_index}</div>
                    <i className="fas fa-sun" style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '2rem', opacity: 0.3 }}></i>
                </div>
                <div className="highlight-card">
                    <p>Wind Status</p>
                    <div className="h-value">{weather.wind_speed} m/s</div>
                    <i className="fas fa-wind" style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '2rem', opacity: 0.3 }}></i>
                </div>
                <div className="highlight-card">
                    <p>Humidity</p>
                    <div className="h-value">{weather.humidity}%</div>
                    <i className="fas fa-droplet" style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '2rem', opacity: 0.3 }}></i>
                </div>

                {aqi && (
                    <div className="highlight-card">
                        <p>Air Quality</p>
                        <div className="h-value">{aqi.val}</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{aqi.label}</p>
                        <i className="fas fa-lungs" style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '2rem', opacity: 0.15 }}></i>
                    </div>
                )}

                {pollen && (
                    <div className="highlight-card">
                        <p>Pollen (Grass)</p>
                        <div className="h-value">{pollen.grass}</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Tree: {pollen.tree}</p>
                        <i className="fas fa-tree" style={{ position: 'absolute', bottom: '15px', right: '15px', fontSize: '2rem', opacity: 0.15 }}></i>
                    </div>
                )}
            </div>
        </section>
    );
}
