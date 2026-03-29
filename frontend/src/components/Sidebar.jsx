import React from 'react';

export function Sidebar({ activeSection, onSectionChange, theme, onThemeToggle }) {
    return (
        <aside className="sidebar">
            <div className="logo">
                <i className="fas fa-bolt"></i>
                <span>Lumina AI</span>
            </div>
            <nav className="nav-links">
                <button
                    className={activeSection === 'dashboard' ? 'active' : ''}
                    onClick={() => onSectionChange('dashboard')}
                    title="Dashboard"
                >
                    <i className="fas fa-th-large"></i>
                </button>
                <button
                    className={activeSection === 'favorites' ? 'active' : ''}
                    onClick={() => onSectionChange('favorites')}
                    title="Favorites"
                >
                    <i className="fas fa-heart"></i>
                </button>
                <button
                    className={activeSection === 'forecast' ? 'active' : ''}
                    onClick={() => onSectionChange('forecast')}
                    title="Forecast"
                >
                    <i className="fas fa-calendar-days"></i>
                </button>
                <button
                    className={activeSection === 'settings' ? 'active' : ''}
                    onClick={() => onSectionChange('settings')}
                    title="Settings"
                >
                    <i className="fas fa-gear"></i>
                </button>
            </nav>
            <div className="sidebar-footer">
                <button className="theme-toggle-btn" onClick={onThemeToggle} title="Toggle Theme">
                    <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'}></i>
                </button>
            </div>
        </aside>
    );
}
