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

const API_KEY = "zpka_199ba14de0b246689ee5775102dea025_a1f39d22";

export default function Weather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [city, setCity] = useState("Bangalore");
  const [inputCity, setInputCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const getLocationKey = async (cityName: string): Promise<string> => {
    const response = await fetch(
      `https://dataservice.accuweather.com/locations/v1/cities/search?apikey=${API_KEY}&q=${encodeURIComponent(cityName)}&details=true`
    );

    if (!response.ok) {
      throw new Error("City not found");
    }

    const data = await response.json();
    if (data.length === 0) {
      throw new Error("City not found");
    }

    return data[0].Key;
  };

  const fetchWeather = async (cityName: string) => {
    try {
      setLoading(true);
      setError("");

      const locationKey = await getLocationKey(cityName);

      // Current weather
      const currentResponse = await fetch(
        `https://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`
      );

      if (!currentResponse.ok) {
        throw new Error("Failed to fetch current weather");
      }

      const currentData = await currentResponse.json();
      const current = currentData[0];

      // 5-day forecast
      const forecastResponse = await fetch(
        `https://dataservice.accuweather.com/forecasts/v1/daily/5day/${locationKey}?apikey=${API_KEY}&details=true&metric=true`
      );

      if (!forecastResponse.ok) {
        throw new Error("Failed to fetch forecast");
      }

      const forecastData = await forecastResponse.json();

      const forecast: ForecastDay[] = forecastData.DailyForecasts.map(
        (day: any) => ({
          day: new Date(day.Date).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          high: Math.round(day.Temperature?.Maximum?.Value || 20),
          low: Math.round(day.Temperature?.Minimum?.Value || 10),
          condition: day.Headline?.Category || "Clear",
          icon: (day.Headline?.Icon || 1).toString().padStart(2, "0"),
        })
      );

      // Get city details
      const detailsResponse = await fetch(
        `https://dataservice.accuweather.com/locations/v1/${locationKey}?apikey=${API_KEY}&details=true`
      );
      const detailsData = await detailsResponse.json();

      setWeather({
        city: detailsData?.LocalizedName || cityName,
        country: detailsData?.Country?.ID || "IN",
        temperature: Math.round(current?.Temperature?.Metric?.Value || 20),
        feelsLike: Math.round(
          current?.RealFeelTemperature?.Metric?.Value || current?.Temperature?.Metric?.Value || 20
        ),
        condition: current?.WeatherText || "Clear",
        humidity: current?.RelativeHumidity || 50,
        windSpeed: Math.round(current?.Wind?.Speed?.Metric?.Value || 0),
        visibility: Math.round(current?.Visibility?.Metric?.Value || 10),
        pressure: current?.Pressure?.Metric?.Value || 1013,
        icon: (current?.WeatherIcon || 1).toString().padStart(2, "0"),
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

  const popularCities = [
    // Karnataka Cities
    "Bangalore",
    "Mysore",
    "Mangalore",
    "Hubli",
    "Belgaum",
    "Shimoga",
    "Tumkur",
    "Hassan",
    "Kolar",
    "Davangere",
  ];

  const handleCityClick = (cityName: string) => {
    setCity(cityName);
    fetchWeather(cityName);
  };

  const getWeatherIcon = (iconCode: string, size = 64) => {
    const iconProps = { size, className: "text-cyan-300" };
    const code = parseInt(iconCode);

    // AccuWeather icon codes
    if (code === 1 || code === 2) return <Sun {...iconProps} />; // Sunny/Mostly sunny
    if (code === 3 || code === 4 || code === 5 || code === 6)
      return <Cloud {...iconProps} />; // Partly cloudy/Cloudy
    if (code === 7 || code === 8) return <Cloud {...iconProps} />; // Mostly cloudy/Overcast
    if (code === 11) return <CloudDrizzle {...iconProps} />; // Drizzle
    if (code === 12 || code === 13 || code === 14 || code === 18)
      return <CloudRain {...iconProps} />; // Rainy
    if (code === 15 || code === 16 || code === 17 || code === 41 || code === 42)
      return <CloudRain {...iconProps} />; // T-storms
    if (code === 19 || code === 20 || code === 21 || code === 22 || code === 23)
      return <CloudSnow {...iconProps} />; // Sleet/Snow
    if (code === 24) return <CloudSnow {...iconProps} />; // Ice
    if (code === 25 || code === 26 || code === 29)
      return <CloudSnow {...iconProps} />; // Snow showers
    if (code === 30 || code === 31) return <Cloud {...iconProps} />; // Hot/Cold

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

        {/* Popular Cities */}
        <div className="mb-8">
          <p className="text-gray-400 text-sm mb-3">Popular Cities:</p>
          <div className="flex flex-wrap gap-2">
            {popularCities.map((cityName) => (
              <button
                key={cityName}
                onClick={() => handleCityClick(cityName)}
                className="glass-button px-4 py-2 text-sm text-white rounded-full hover:text-cyan-300 transition-all"
              >
                {cityName}
              </button>
            ))}
          </div>
        </div>

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
