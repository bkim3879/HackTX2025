import React, { useState, useEffect } from 'react';

const TopNavigationBar = () => {
  const [time, setTime] = useState('');
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const centralTime = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago' });
      setTime(centralTime);
    }, 1000);

    // Fetch weather for Chicago (as a proxy for US Central)
    fetch('https://api.open-meteo.com/v1/forecast?latitude=41.85&longitude=-87.65&current_weather=true')
      .then(response => response.json())
      .then(data => {
        setWeather(data.current_weather);
      })
      .catch(error => console.error('Error fetching weather:', error));

    return () => clearInterval(timer);
  }, []);

  const getWeatherIcon = (weathercode) => {
    if (weathercode === 0) return '☀️'; // Clear sky
    if (weathercode > 0 && weathercode < 4) return '⛅️'; // Mainly clear, partly cloudy, and overcast
    if (weathercode > 50 && weathercode < 70) return '🌧️'; // Drizzle, Rain
    if (weathercode > 70 && weathercode < 80) return '🌨️'; // Snow
    if (weathercode > 90) return '⛈️'; // Thunderstorm
    return '☁️';
  }

  return (
    <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-700">
      <div className="flex items-center space-x-4">
        <span className="text-red-500 font-bold">LIVE</span>
        <span>MONACO GRAND PRIX</span>
        <span>LAP 24/78</span>
        <span>{time}</span>
        {weather && <span>{getWeatherIcon(weather.weathercode)} {weather.temperature}°C</span>}
      </div>
      <div>
        <img src="https://www.formula1.com/etc/designs/fom-website/images/f1_logo.svg" alt="F1 Logo" className="h-6" />
      </div>
    </div>
  );
};

export default TopNavigationBar;
