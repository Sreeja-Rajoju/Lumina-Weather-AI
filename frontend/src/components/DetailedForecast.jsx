import React from 'react';
import { motion } from 'framer-motion';

export function DetailedForecast({ daily }) {
    if (!daily) return null;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 100
            }
        }
    };

    const getStatusLabel = (temp) => {
        if (temp > 28) return { text: 'Hot & Sunny', class: 'status-hot' };
        if (temp > 20) return { text: 'Pleasant', class: 'status-pleasant' };
        if (temp > 10) return { text: 'Chilly', class: 'status-chilly' };
        return { text: 'Cold', class: 'status-cold' };
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="forecast-details-hub"
        >
            <div className="section-header">
                <h1><i className="fas fa-chart-line"></i> 5-Day Precision Dashboard</h1>
                <span>Dynamic Meteorological Analysis</span>
            </div>

            <div className="daily-details-stack">
                {daily.map((day, index) => {
                    const status = getStatusLabel(day.high);
                    return (
                        <motion.div 
                            key={index} 
                            variants={itemVariants}
                            className={`full-daily-card ${status.class}`}
                        >
                            <div className="day-card-left">
                                <div className="day-name">{day.day}</div>
                                <div className="day-date">{day.date}</div>
                            </div>
                            
                            <div className="day-card-visual">
                                <img src={`http://openweathermap.org/img/wn/${day.icon}@2x.png`} alt="weather" />
                                <span className="status-badge">{status.text}</span>
                            </div>

                            <div className="day-card-center">
                                <div className="temp-range-large">
                                    <div className="range-item">
                                        <span className="label">High</span>
                                        <span className="val-high">{day.high}°</span>
                                    </div>
                                    <div className="range-divider"></div>
                                    <div className="range-item">
                                        <span className="label">Low</span>
                                        <span className="val-low">{day.low}°</span>
                                    </div>
                                </div>
                            </div>

                            <div className="day-card-right">
                                <div className="metric-chip">
                                    <i className="fas fa-droplet"></i>
                                    <span>65% Hum</span>
                                </div>
                                <div className="metric-chip">
                                    <i className="fas fa-wind"></i>
                                    <span>14 km/h</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
}
