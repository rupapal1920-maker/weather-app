
import React, { useState } from "react";
import "./app.css";

const weatherInfo = (code) => {
  if (code === 0) return ["Clear Sky", "☀️"];
  if ([1, 2].includes(code)) return ["Partly Cloudy", "🌤️"];
  if (code === 3) return ["Cloudy", "☁️"];
  if ([45, 48].includes(code)) return ["Foggy", "🌫️"];
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
    return ["Rainy", "🌧️"];
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return ["Snowy", "❄️"];
  if ([95, 96, 99].includes(code)) return ["Thunderstorm", "⛈️"];
  return ["Unknown", "🌡️"];
};

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getWeather(cityName) {
    if (!cityName.trim()) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) throw new Error("Location search failed.");

      const geoData = await geoResponse.json();

      if (!geoData.results?.length) {
        throw new Error("City not found. Try another city.");
      }

      const place = geoData.results[0];
      setLocation(`${place.name}, ${place.country}`);

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      );

      if (!weatherResponse.ok) throw new Error("Weather data unavailable.");

      const data = await weatherResponse.json();
      setWeather(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function getMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
          );

          if (!weatherResponse.ok) throw new Error("Weather data unavailable.");

          const data = await weatherResponse.json();

          setLocation("Your Current Location");
          setWeather(data);
        } catch (err) {
          setError(err.message || "Could not get weather.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location permission denied. Search for a city instead.");
        setLoading(false);
      }
    );
  }

  const current = weather?.current;
  const daily = weather?.daily;
  const [description, emoji] = current
    ? weatherInfo(current.weather_code)
    : ["", ""];

  return (
    <div className="app">
      <header className="navbar">
        <h2>☀ WeatherNow</h2>
        <span>Weather Forecast</span>
      </header>

      <main className="container">
        <section className="welcome">
          <p className="eyebrow">YOUR WEATHER COMPANION</p>
          <h1>Know your weather.</h1>
          <p>Get accurate weather updates for any location.</p>
        </section>

        <form
          className="search-box"
          onSubmit={(e) => {
            e.preventDefault();
            getWeather(city);
          }}
        >
          <span>🔍</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Search city... e.g. Mumbai"
          />
          <button type="submit" disabled={loading}>
            Search
          </button>
        </form>

        <button
          className="location-btn"
          onClick={getMyLocation}
          disabled={loading}
        >
          📍 Use my current location
        </button>

        {loading && <p className="status">Getting weather data...</p>}
        {error && <p className="error">{error}</p>}

        {weather && current && (
          <>
            <section className="weather-card">
              <div className="weather-top">
                <div>
                  <p className="label">CURRENT WEATHER</p>
                  <h2>{location}</h2>
                  <p className="condition">{description}</p>
                </div>
                <div className="main-icon">{emoji}</div>
              </div>

              <div className="temperature">
                {Math.round(current.temperature_2m)}°
                <span>C</span>
              </div>

              <p className="feels">
                Feels like {Math.round(current.apparent_temperature)}°C
              </p>

              <div className="details">
                <div>
                  <span>💧</span>
                  <p>Humidity</p>
                  <strong>{current.relative_humidity_2m}%</strong>
                </div>
                <div>
                  <span>💨</span>
                  <p>Wind Speed</p>
                  <strong>{current.wind_speed_10m} km/h</strong>
                </div>
                <div>
                  <span>🌧️</span>
                  <p>Precipitation</p>
                  <strong>{current.precipitation} mm</strong>
                </div>
              </div>
            </section>

            <section className="forecast">
              <h2>7-Day Forecast</h2>
              <div className="forecast-grid">
                {daily.time.map((date, index) => {
                  const [dayDescription, dayIcon] = weatherInfo(
                    daily.weather_code[index]
                  );

                  const day = new Date(date + "T12:00:00")
                    .toLocaleDateString("en-US", {
                      weekday: "short",
                    });

                  return (
                    <div className="forecast-item" key={date}>
                      <p>{index === 0 ? "Today" : day}</p>
                      <span className="forecast-icon">{dayIcon}</span>
                      <strong>
                        {Math.round(daily.temperature_2m_max[index])}°
                      </strong>
                      <span className="low">
                        {Math.round(daily.temperature_2m_min[index])}°
                      </span>
                      <small>{dayDescription}</small>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {!weather && !loading && !error && (
          <div className="empty-state">
            <span>🌤️</span>
            <h2>Search for a city</h2>
            <p>Your weather information will appear here.</p>
          </div>
        )}
      </main>

      <footer>
        <p>WeatherNow | Built by Rupa Pal</p>
        <p>Weather data powered by Open-Meteo</p>
      </footer>
    </div>
  );
}

export default App;
