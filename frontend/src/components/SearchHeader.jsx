import React, { useState } from 'react';

export function SearchHeader({ onSearch, onGeoLocate, onMapOpen }) {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    return (
        <header className="dashboard-header">
            <div className="search-bar">
                <i 
                    className="fas fa-search search-icon-btn" 
                    onClick={() => handleSubmit()} 
                    style={{ cursor: 'pointer', transition: 'color 0.3s' }}
                    title="Run search"
                ></i>
                <form onSubmit={handleSubmit} style={{ flex: 1 }}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search City..."
                        autoComplete="off"
                    />
                </form>
                <div className="search-actions">
                    <button className="location-btn" onClick={onGeoLocate} title="Use my current location">
                        <i className="fas fa-location-crosshairs"></i>
                    </button>
                </div>
            </div>
            <button className="map-btn" id="mapBtn" onClick={onMapOpen} title="Open World Map Explorer">
                <i className="fas fa-map-marked-alt"></i>
            </button>
        </header>
    );
}
