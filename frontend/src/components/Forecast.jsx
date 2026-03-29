import React from 'react';

export function Forecast({ hourly, daily }) {
    return (
        <div className="forecast-container">
            {hourly && (
                <section className="forecast-section">
                    <div className="section-header">
                        <h2><i className="fas fa-clock"></i> Today's Hourly</h2>
                    </div>
                    <div className="forecast-row">
                        {hourly.map((item, index) => (
                            <div key={index} className="forecast-card">
                                <span className="f-time">{item.time}</span>
                                <img src={`http://openweathermap.org/img/wn/${item.icon}@2x.png`} alt="Icon" />
                                <span className="f-temp">{item.temp}°</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {daily && (
                <section className="daily-forecast-section">
                    <div className="section-header">
                        <h2><i className="fas fa-calendar-week"></i> 5-Day Precision</h2>
                    </div>
                    <div className="daily-forecast-row">
                        {daily.map((day, index) => (
                            <div key={index} className="daily-card-mini">
                                <div className="daily-day-mini">{day.day}</div>
                                <div className="daily-date-mini">{day.date}</div>
                                <img src={`http://openweathermap.org/img/wn/${day.icon}@2x.png`} alt="Icon" />
                                <div className="daily-temps-mini">
                                    <span className="daily-high-mini">{day.high}°</span>
                                    <span className="daily-low-mini">{day.low}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
