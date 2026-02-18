import { RequestHandler } from "express";

const API_KEY = process.env.VITE_ACCUWEATHER_API_KEY;
const BASE_URL = "https://dataservice.accuweather.com";

interface LocationResponse {
  Key: string;
  LocalizedName: string;
  Country: {
    ID: string;
  };
}

interface CurrentCondition {
  Temperature: {
    Metric: {
      Value: number;
    };
  };
  RealFeelTemperature?: {
    Metric: {
      Value: number;
    };
  };
  WeatherText: string;
  WeatherIcon: number;
  RelativeHumidity?: number;
  Wind?: {
    Speed: {
      Metric: {
        Value: number;
      };
    };
  };
  Visibility?: {
    Metric: {
      Value: number;
    };
  };
  Pressure?: {
    Metric: {
      Value: number;
    };
  };
}

interface ForecastDay {
  Date: string;
  Temperature: {
    Maximum: { Value: number };
    Minimum: { Value: number };
  };
  Headline?: {
    Category?: string;
    Icon?: number;
  };
}

interface WeatherResponse {
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
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
  }>;
}

export const handleWeatherSearch: RequestHandler = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city || typeof city !== "string") {
      return res.status(400).json({ error: "City name is required" });
    }

    if (!API_KEY) {
      return res.status(500).json({ error: "API key not configured" });
    }

    // Step 1: Get location key
    const locationResponse = await fetch(
      `${BASE_URL}/locations/v1/cities/search?apikey=${API_KEY}&q=${encodeURIComponent(city)}&details=true`
    );

    if (!locationResponse.ok) {
      return res.status(404).json({ error: "City not found" });
    }

    const locations: LocationResponse[] = await locationResponse.json();

    if (locations.length === 0) {
      return res.status(404).json({ error: "City not found" });
    }

    const location = locations[0];
    const locationKey = location.Key;

    // Step 2: Get current weather
    const currentResponse = await fetch(
      `${BASE_URL}/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`
    );

    if (!currentResponse.ok) {
      throw new Error("Failed to fetch current weather");
    }

    const currentData: CurrentCondition[] = await currentResponse.json();
    const current = currentData[0];

    // Step 3: Get 5-day forecast
    const forecastResponse = await fetch(
      `${BASE_URL}/forecasts/v1/daily/5day/${locationKey}?apikey=${API_KEY}&details=true&metric=true`
    );

    if (!forecastResponse.ok) {
      throw new Error("Failed to fetch forecast");
    }

    const forecastData: { DailyForecasts: ForecastDay[] } =
      await forecastResponse.json();

    const forecast = forecastData.DailyForecasts.map((day) => ({
      day: new Date(day.Date).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      high: Math.round(day.Temperature?.Maximum?.Value || 20),
      low: Math.round(day.Temperature?.Minimum?.Value || 10),
      condition: day.Headline?.Category || "Clear",
      icon: (day.Headline?.Icon || 1).toString().padStart(2, "0"),
    }));

    const response: WeatherResponse = {
      city: location.LocalizedName,
      country: location.Country.ID,
      temperature: Math.round(current?.Temperature?.Metric?.Value || 20),
      feelsLike: Math.round(
        current?.RealFeelTemperature?.Metric?.Value ||
          current?.Temperature?.Metric?.Value ||
          20
      ),
      condition: current?.WeatherText || "Clear",
      humidity: current?.RelativeHumidity || 50,
      windSpeed: Math.round(current?.Wind?.Speed?.Metric?.Value || 0),
      visibility: Math.round(current?.Visibility?.Metric?.Value || 10),
      pressure: current?.Pressure?.Metric?.Value || 1013,
      icon: (current?.WeatherIcon || 1).toString().padStart(2, "0"),
      forecast: forecast.slice(0, 5),
    };

    res.json(response);
  } catch (error) {
    console.error("Weather API error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch weather",
    });
  }
};
