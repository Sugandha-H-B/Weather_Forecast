import { useState, useEffect } from "react";
import {
  Cloud,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Search,
  CloudSnow,
  CloudDrizzle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherData {
  city: string;
  country: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  icon: string;
  forecast: ForecastDay[];
}

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
  icon: string;
}

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [city, setCity] = useState("San Francisco");
  const [inputCity, setInputCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const fetchWeather = async (cityName: string) => {
    try {
      setLoading(true);
      setError("");

      if (!apiKey) {
        setError(
          "Weather API key not configured. Please set VITE_WEATHER_API_KEY"
        );
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=metric&appid=${apiKey}`
      );

      if (!response.ok) {
        throw new Error("City not found");
      }

      const data = await response.json();

      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=metric&appid=${apiKey}`
      );
      const forecastData = await forecastResponse.json();

      const forecast: ForecastDay[] = [];
      for (let i = 0; i < forecastData.list.length; i += 8) {
        const day = forecastData.list[i];
        forecast.push({
          day: new Date(day.dt * 1000).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          high: Math.round(day.main.temp_max),
          low: Math.round(day.main.temp_min),
          condition: day.weather[0].main,
          icon: day.weather[0].icon,
        });
      }

      setWeather({
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        visibility: Math.round(data.visibility / 1000),
        pressure: data.main.pressure,
        icon: data.weather[0].icon,
        forecast: forecast.slice(0, 5),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCity.trim()) {
      setCity(inputCity);
      fetchWeather(inputCity);
      setInputCity("");
    }
  };

  const getWeatherIcon = (iconCode: string, size = 64) => {
    const iconProps = { size, className: "text-cyan-300" };
    if (iconCode.includes("01")) return <Sun {...iconProps} />;
    if (iconCode.includes("02")) return <Cloud {...iconProps} />;
    if (iconCode.includes("03")) return <Cloud {...iconProps} />;
    if (iconCode.includes("04")) return <Cloud {...iconProps} />;
    if (iconCode.includes("09")) return <CloudDrizzle {...iconProps} />;
    if (iconCode.includes("10")) return <CloudRain {...iconProps} />;
    if (iconCode.includes("11")) return <CloudRain {...iconProps} />;
    if (iconCode.includes("13")) return <CloudSnow {...iconProps} />;
    return <Cloud {...iconProps} />;
  };

  const getSmallWeatherIcon = (iconCode: string) => {
    return getWeatherIcon(iconCode, 32);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Weather Forecast
          </h1>
          <p className="text-gray-400 text-lg">
            Beautiful weather updates with glass morphism design
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="glass p-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
                placeholder="Search for a city..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all"
              />
              <button
                type="submit"
                className="glass-button px-6 py-3 font-semibold text-white hover:text-cyan-300 transition-all"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="glass p-4 mb-8 border-red-500/30 bg-red-500/10">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="glass p-12 text-center">
            <div className="inline-block animate-spin">
              <Cloud size={48} className="text-cyan-400" />
            </div>
            <p className="mt-4 text-gray-300">Loading weather data...</p>
          </div>
        ) : weather ? (
          <>
            {/* Main Weather Card */}
            <div className="glass p-8 md:p-12 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={20} className="text-cyan-400" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                      {weather.city}, {weather.country}
                    </h2>
                  </div>
                  <p className="text-gray-400 text-lg">{weather.condition}</p>
                </div>
                <div className="mt-6 md:mt-0">
                  {getWeatherIcon(weather.icon, 96)}
                </div>
              </div>

              {/* Temperature Display */}
              <div className="mb-8">
                <div className="flex items-baseline gap-4">
                  <span className="text-7xl md:text-8xl font-bold gradient-text-warm">
                    {weather.temperature}°
                  </span>
                  <div>
                    <p className="text-gray-400">Feels like</p>
                    <p className="text-3xl font-semibold text-cyan-300">
                      {weather.feelsLike}°
                    </p>
                  </div>
                </div>
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets size={18} className="text-blue-400" />
                    <span className="text-gray-400 text-sm">Humidity</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {weather.humidity}%
                  </p>
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind size={18} className="text-purple-400" />
                    <span className="text-gray-400 text-sm">Wind Speed</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {weather.windSpeed} km/h
                  </p>
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye size={18} className="text-cyan-400" />
                    <span className="text-gray-400 text-sm">Visibility</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {weather.visibility} km
                  </p>
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge size={18} className="text-orange-400" />
                    <span className="text-gray-400 text-sm">Pressure</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {weather.pressure} mb
                  </p>
                </div>
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                5-Day Forecast
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {weather.forecast.map((day, index) => (
                  <div key={index} className="glass-card p-4 text-center">
                    <p className="text-gray-300 font-semibold mb-3">
                      {day.day}
                    </p>
                    <div className="flex justify-center mb-3">
                      {getSmallWeatherIcon(day.icon)}
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{day.condition}</p>
                    <div className="flex justify-center gap-2">
                      <span className="text-white font-bold">{day.high}°</span>
                      <span className="text-gray-500">{day.low}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-12 text-gray-500 text-sm">
              <p>Weather data provided by OpenWeatherMap</p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
