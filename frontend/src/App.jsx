import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { SearchHeader } from './components/SearchHeader';
import { WeatherCard } from './components/WeatherCard';
import { Forecast } from './components/Forecast';
import { AIInsights } from './components/AIInsights';
import { Highlights } from './components/Highlights';
import { FavoritesPage } from './components/FavoritesPage';
import { DetailedForecast } from './components/DetailedForecast';
import { SettingsPage } from './components/SettingsPage';
import { WeatherMapModal } from './components/WeatherMapModal';
import { useWeather } from './hooks/useWeather';
import { motion, AnimatePresence } from 'framer-motion';

// Import CSS
import './assets/style.css';
import './assets/theme.css';
import './assets/map.css';

function App() {
    const { data, aiData, loading, aiLoading, error, fetchWeather, toggleUnits, units } = useWeather();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [activeSection, setActiveSection] = useState('dashboard');
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem('favoriteCities')) || ['Dubai', 'Reykjavik', 'Mumbai', 'London', 'Yakutsk', 'Singapore']);

    useEffect(() => {
        // Initial fetch
        const urlParams = new URLSearchParams(window.location.search);
        const cityParam = urlParams.get('city');
        const latParam = urlParams.get('lat');
        const lonParam = urlParams.get('lon');

        if (cityParam) {
            fetchWeather({ city: cityParam });
        } else if (latParam && lonParam) {
            fetchWeather({ lat: latParam, lon: lonParam });
        } else {
            fetchWeather({ city: favorites[3] || 'London' });
        }
    }, [fetchWeather]);

    useEffect(() => {
        document.body.className = `${theme === 'light' ? 'light-theme' : 'dark-theme'} ${data ? `weather-${data.weather.condition}` : ''}`;
    }, [theme, data]);

    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const toggleFavorite = (city) => {
        const index = favorites.indexOf(city);
        const newFavorites = [...favorites];
        if (index > -1) {
            newFavorites.splice(index, 1);
        } else {
            newFavorites.push(city);
        }
        setFavorites(newFavorites);
        localStorage.setItem('favoriteCities', JSON.stringify(newFavorites));
    };

    const clearAllData = () => {
        if (window.confirm("Are you sure you want to clear all favorites and reset app data?")) {
            setFavorites([]);
            localStorage.removeItem('favoriteCities');
            localStorage.removeItem('theme');
            localStorage.removeItem('tempUnit');
            window.location.reload();
        }
    };

    const renderMainContent = () => {
        if (activeSection === 'settings') {
            return (
                <SettingsPage 
                    units={units} 
                    onToggleUnit={toggleUnits} 
                    theme={theme}
                    onThemeToggle={handleThemeToggle}
                    onClearFavorites={clearAllData}
                />
            );
        }

        if (activeSection === 'favorites') {
            return (
                <FavoritesPage 
                    favorites={favorites} 
                    onSelectCity={(city) => {
                        fetchWeather({ city });
                        setActiveSection('dashboard');
                    }}
                    onRemoveFavorite={toggleFavorite}
                />
            );
        }

        if (activeSection === 'forecast') {
            if (!data) return (
                <div className="empty-state">
                    <i className="fas fa-cloud-sun" style={{ fontSize: '4rem', opacity: 0.2 }}></i>
                    <h2>No Forecast Data</h2>
                    <p>Load a city to see the detailed 5-day forecast.</p>
                </div>
            );
            return <DetailedForecast daily={data?.daily} />;
        }

        // Default Dashboard View
        if (loading && !data) {
            return (
                <div className="loading-overlay-inline">
                    <div className="loader"></div>
                    <p>Fetching weather insights...</p>
                </div>
            );
        }

        if (!data) {
            return (
                <div className="empty-state">
                    <i className="fas fa-triangle-exclamation" style={{ fontSize: '4rem', color: '#ff4757', opacity: 0.5 }}></i>
                    <h2>Disconnected</h2>
                    <p>{error || "Unable to fetch data. Please check your connection."}</p>
                    <button className="contact-btn-premium" onClick={() => fetchWeather({ city: 'London' })} style={{ marginTop: '1rem' }}>
                        Retry Connection
                    </button>
                </div>
            );
        }

        return (
            <div className="dashboard-grid">
                <div className="grid-left">
                    <WeatherCard
                        weather={data.weather}
                        units={units}
                        onToggleUnit={toggleUnits}
                        onToggleFavorite={toggleFavorite}
                        isFavorite={favorites.includes(data.weather.city)}
                    />
                    <Forecast hourly={data.forecast} daily={data.daily} />
                    <AIInsights insights={aiData} loading={aiLoading} />
                </div>

                <div className="grid-right">
                    <Highlights
                        weather={data.weather}
                        aqi={data.aqi}
                        pollen={data.pollen}
                    />

                    <section className="favorite-cities">
                        <div className="section-header">
                            <h2>Favorite Cities</h2>
                            <span className="fav-count">{favorites.length}</span>
                        </div>
                        <div className="favorites-list">
                            {favorites.length === 0 ? (
                                <p className="no-favorites">No favorites yet. Click the heart icon to add cities!</p>
                            ) : (
                                favorites.map(city => (
                                    <div key={city} className="fav-city-item" onClick={() => {
                                        fetchWeather({ city });
                                        setActiveSection('dashboard');
                                    }}>
                                        <div className="fav-city-name">
                                            <i className="fas fa-location-dot"></i>
                                            {city}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                theme={theme}
                onThemeToggle={handleThemeToggle}
            />

            <main className="main-content">
                <SearchHeader
                    onSearch={(city) => {
                        fetchWeather({ city });
                        setActiveSection('dashboard');
                    }}
                    onMapOpen={() => setIsMapOpen(true)}
                />

                <WeatherMapModal 
                    isOpen={isMapOpen} 
                    onClose={() => setIsMapOpen(false)} 
                    initialCenter={data?.weather?.coord && [data.weather.coord.lat, data.weather.coord.lon]}
                    onSelectLocation={(lat, lon) => {
                        fetchWeather({ lat, lon });
                        setActiveSection('dashboard');
                    }}
                />

                {error && <div className="error-toast">{error}</div>}

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderMainContent()}
                    </motion.div>
                </AnimatePresence>

                <footer className="dashboard-footer">
                    <div className="footer-content">
                        <p>&copy; 2026 Lumina Weather AI. All rights reserved.</p>
                        <div className="footer-links">
                            <a 
                                href="https://www.linkedin.com/in/kadariuday" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="contact-btn-premium"
                            >
                                <i className="fab fa-linkedin"></i> Contact Us
                            </a>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}

export default App;
