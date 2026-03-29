import React, { useState, useEffect, useRef } from 'react';
import { INDIAN_CITIES } from '../utils/indianCities';

export function SearchHeader({ onSearch, onMapOpen }) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e, selectedValue) => {
        if (e) e.preventDefault();
        const finalQuery = selectedValue || query;
        if (finalQuery.trim()) {
            onSearch(finalQuery.trim());
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        
        if (value.trim().length > 1) {
            const filtered = INDIAN_CITIES.filter(item => 
                item.city.toLowerCase().startsWith(value.toLowerCase()) ||
                item.state.toLowerCase().startsWith(value.toLowerCase())
            ).slice(0, 6); // Limit to top 6 results for performance/UI
            
            setSuggestions(filtered);
            setShowSuggestions(true);
            setSelectedIndex(-1);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            const selected = suggestions[selectedIndex].city;
            setQuery(selected);
            handleSubmit(null, selected);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <header className="dashboard-header">
            <div className="search-bar-container" ref={wrapperRef} style={{ flex: 1, position: 'relative' }}>
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
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Search Indian City..."
                            autoComplete="off"
                        />
                    </form>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <ul className="search-suggestions-dropdown">
                        {suggestions.map((item, index) => (
                            <li 
                                key={`${item.city}-${item.state}`}
                                className={`suggestion-item ${index === selectedIndex ? 'active' : ''}`}
                                onClick={() => {
                                    setQuery(item.city);
                                    handleSubmit(null, item.city);
                                }}
                            >
                                <div className="suggestion-city">
                                    <i className="fas fa-location-dot"></i>
                                    <span>{item.city}</span>
                                </div>
                                <span className="suggestion-state">{item.state}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <button className="map-btn" id="mapBtn" onClick={onMapOpen} title="Open World Map Explorer">
                <i className="fas fa-map-marked-alt"></i>
            </button>
        </header>
    );
}
