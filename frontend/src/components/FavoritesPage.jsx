import React from 'react';
import { motion } from 'framer-motion';

export function FavoritesPage({ favorites, onSelectCity, onRemoveFavorite }) {
    if (favorites.length === 0) {
        return (
            <div className="empty-state">
                <i className="fas fa-heart-crack" style={{ fontSize: '4rem', opacity: 0.2 }}></i>
                <h2>No Favorites Yet</h2>
                <p>Add cities to your favorites to track them here!</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="favorites-hub"
        >
            <div className="section-header">
                <h1><i className="fas fa-heart"></i> Favorites Hub</h1>
                <span>{favorites.length} Saved Locations</span>
            </div>

            <div className="favorites-grid-detailed">
                {favorites.map((city, index) => (
                    <div key={index} className="fav-detailed-card" onClick={() => onSelectCity(city)}>
                        <div className="fav-card-header">
                            <h3>{city}</h3>
                            <button 
                                className="remove-btn" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveFavorite(city);
                                }}
                            >
                                <i className="fas fa-trash-can"></i>
                            </button>
                        </div>
                        <div className="fav-card-body">
                            <i className="fas fa-location-arrow" style={{ marginRight: '8px' }}></i>
                            View detailed weather
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
