import React from 'react';
import { motion } from 'framer-motion';

export function SettingsPage({ units, onToggleUnit, theme, onThemeToggle, onClearFavorites }) {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="settings-hub"
        >
            <div className="section-header">
                <h1><i className="fas fa-gear"></i> App Settings</h1>
                <span>Customize User Preferences</span>
            </div>

            <div className="settings-section">
                <div className="setting-item">
                    <div className="setting-info">
                        <h3>Temperature Units</h3>
                        <p>Change how temperature is displayed globally.</p>
                    </div>
                    <div className="toggle-group">
                        <button 
                            className={`toggle-btn ${units === 'metric' ? 'active' : ''}`}
                            onClick={onToggleUnit}
                        >
                            Celsius (°C)
                        </button>
                        <button 
                            className={`toggle-btn ${units === 'imperial' ? 'active' : ''}`}
                            onClick={onToggleUnit}
                        >
                            Fahrenheit (°F)
                        </button>
                    </div>
                </div>

                <div className="setting-item">
                    <div className="setting-info">
                        <h3>Display Theme</h3>
                        <p>Toggle between Dark and Light mode presets.</p>
                    </div>
                    <div className="toggle-group">
                        <button 
                            className={`toggle-btn ${theme === 'light' ? 'active' : ''}`}
                            onClick={onThemeToggle}
                        >
                            <i className="fas fa-sun"></i> Light
                        </button>
                        <button 
                            className={`toggle-btn ${theme === 'dark' ? 'active' : ''}`}
                            onClick={onThemeToggle}
                        >
                            <i className="fas fa-moon"></i> Dark
                        </button>
                    </div>
                </div>

                <div className="setting-item">
                    <div className="setting-info" style={{ color: '#ff4757' }}>
                        <h3>Data Management</h3>
                        <p>Permanently clear your favorites and cache.</p>
                    </div>
                    <button className="clear-btn" onClick={onClearFavorites}>
                        <i className="fas fa-trash-can"></i> Reset All Data
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
