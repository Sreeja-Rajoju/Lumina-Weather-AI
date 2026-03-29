import React from 'react';

export function WeatherCard({ weather, units, onToggleFavorite, isFavorite, onToggleUnit }) {
    if (!weather) return null;

    const unitLabel = units === 'metric' ? 'C' : 'F';

    return (
        <div className="current-weather-card">
            <div className="card-header">
                <div className="location-tag" data-city={weather.city}>
                    <i className="fas fa-location-dot"></i> {weather.city}, {weather.country}
                    <button className="fav-btn" onClick={() => onToggleFavorite(weather.city)} title="Add to favorites">
                        <i className={`${isFavorite ? 'fas' : 'far'} fa-heart`}></i>
                    </button>
                </div>
                <div className="unit-toggle" onClick={onToggleUnit} title="Toggle °C / °F">
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', marginRight: '5px' }}>
                        °{unitLabel}
                    </span>
                    <i className="fas fa-exchange-alt"></i>
                </div>
            </div>
            <div className="date-time">{weather.date}</div>

            <div className="weather-info-main">
                <div className="main-temp">{weather.temp}°{unitLabel}</div>
                <div className="weather-details">
                    <div className="feels-like">Feels Like {weather.feels_like}°{unitLabel}</div>
                    <div className="temp-range">High: {weather.high}° Low: {weather.low}°</div>
                    <div className="description">
                        <i className="fas fa-cloud"></i> {weather.description}
                    </div>
                </div>
            </div>

            <div className="sun-times">
                <div className="sun-item">
                    <i className="fas fa-sunrise"></i>
                    <div>
                        <span className="label">Sunrise</span>
                        <span className="time">{weather.sunrise}</span>
                    </div>
                </div>
                <div className="sun-item">
                    <i className="fas fa-sunset"></i>
                    <div>
                        <span className="label">Sunset</span>
                        <span className="time">{weather.sunset}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
