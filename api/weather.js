export default async function handler(req, res) {
  const city = req.query.city;

  const key = process.env.WEATHER_API_KEY;

  try {
    const weather = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${key}&units=metric`,
    );

    const forecast = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${key}&units=metric`,
    );

    const weatherData = await weather.json();

    const forecastData = await forecast.json();

    res.status(200).json({
      weather: weatherData,

      forecast: forecastData,
    });
  } catch {
    res.status(500).json({
      error: "failed",
    });
  }
}
