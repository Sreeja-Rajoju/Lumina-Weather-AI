import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://127.0.0.1:5000' 
        : 'https://lumina-weather-ai.onrender.com', 
};

export function useWeather(defaultCity = 'London') {
    const [data, setData] = useState(null);
    const [aiData, setAiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState(null);
    const [units, setUnits] = useState(localStorage.getItem('tempUnit') || 'metric');

    const fetchAIInsights = useCallback(async (city) => {
        setAiLoading(true);
        try {
            const response = await axios.get(`${CONFIG.API_BASE_URL}/api/ai-insights`, { 
                params: { city, units } 
            });
            setAiData(response.data);
        } catch (err) {
            console.error('AI Fetch Error:', err);
        } finally {
            setAiLoading(false);
        }
    }, [units]);

    const fetchWeather = useCallback(async (params) => {
        setLoading(true);
        setError(null);
        setAiData(null); // Reset AI data on new search
        try {
            const queryParams = { ...params, units };
            const response = await axios.get(`${CONFIG.API_BASE_URL}/api/weather`, { params: queryParams });
            
            if (response.data.error) {
                setError(response.data.error);
            } else {
                setData(response.data);
                // Trigger AI insights fetch separately
                fetchAIInsights(response.data.weather.city);
            }
        } catch (err) {
            console.error('Fetch Error:', err);
            setError('Unable to connect to the weather service.');
        } finally {
            setLoading(false);
        }
    }, [units, fetchAIInsights]);

    const toggleUnits = () => {
        const newUnit = units === 'metric' ? 'imperial' : 'metric';
        setUnits(newUnit);
        localStorage.setItem('tempUnit', newUnit);
    };

    return { data, aiData, loading, aiLoading, error, fetchWeather, toggleUnits, units };
}
