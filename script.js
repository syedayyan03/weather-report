class NebulaWeather {
  constructor() {
    // IMPORTANT: You need to get a FREE API key from OpenWeatherMap
    // Go to: https://home.openweathermap.org/users/sign_up
    // Then: https://home.openweathermap.org/api_keys
    // Replace this with your actual API key
    this.apiKey = window.CONFIG.API_KEY; // <-- REPLACE THIS WITH YOUR API KEY
    this.baseUrl = "https://api.openweathermap.org/data/2.5";
    this.units = "metric";
    this.currentCity = "Hyderabad";

    this.init();
  }

  init() {
    // DOM Elements
    this.cityInput = document.getElementById("cityInput");
    this.locationBtn = document.getElementById("locationBtn");
    this.loadingOverlay = document.getElementById("loadingOverlay");
    this.toast = document.getElementById("toast");
    this.toastMessage = document.getElementById("toastMessage");
    this.themeToggle = document.getElementById("themeToggle");

    // Check if API key is configured
    if (this.apiKey === "YOUR_API_KEY_HERE") {
      this.showToast("⚠️ Please configure your API key in script.js", true);
      document.getElementById("cityName").textContent = "API Key Required";
      document.getElementById("countryName").textContent =
        "Get free key from OpenWeatherMap";
      return;
    }

    // Event Listeners
    this.cityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.searchWeather();
    });

    // Fix search button click
    const searchIcon = document.querySelector(".fa-search");

    if (searchIcon) {
      searchIcon.addEventListener("click", () => {
        this.searchWeather();
      });
    }

    if (this.locationBtn) {
      this.locationBtn.addEventListener("click", () =>
        this.getCurrentLocation(),
      );
    }

    if (this.themeToggle) {
      this.themeToggle.addEventListener("click", () => this.toggleTheme());
    }

    // Load saved theme
    this.loadTheme();

    // Initial weather fetch
    this.fetchWeatherData(this.currentCity);

    // Refresh every 10 minutes
    setInterval(() => {
      if (this.currentCity) {
        this.fetchWeatherData(this.currentCity);
      }
    }, 600000);
  }

  showLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = "flex";
    }
  }

  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.display = "none";
    }
  }

  showToast(message, isError = true) {
    if (!this.toast || !this.toastMessage) return;

    this.toastMessage.textContent = message;
    this.toast.classList.add("show");

    // Change toast color based on type
    if (!isError) {
      this.toast.style.borderLeftColor = "#10b981";
      this.toast.querySelector("i").style.color = "#10b981";
    } else {
      this.toast.style.borderLeftColor = "#ef4444";
      this.toast.querySelector("i").style.color = "#ef4444";
    }

    setTimeout(() => {
      this.toast.classList.remove("show");
      // Reset color
      this.toast.style.borderLeftColor = "var(--accent)";
      if (this.toast.querySelector("i")) {
        this.toast.querySelector("i").style.color = "var(--accent)";
      }
    }, 4000);
  }

  async fetchWeatherData(city) {
    if (!city || city.trim() === "") {
      this.showToast("Please enter a valid city name");
      return;
    }

    if (this.apiKey === "YOUR_API_KEY_HERE") {
      this.showToast(
        "⚠️ Please configure your API key first. Get one from OpenWeatherMap for free!",
        true,
      );
      return;
    }

    this.showLoading();

    try {
      // Fetch current weather
      const weatherUrl = `${this.baseUrl}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.units}`;
      console.log("Fetching weather for:", city);
      console.log("API URL:", weatherUrl.replace(this.apiKey, "HIDDEN"));

      const weatherResponse = await fetch(weatherUrl);

      // Handle specific HTTP errors
      if (weatherResponse.status === 401) {
        throw new Error(
          "Invalid API key. Please check your OpenWeatherMap API key.",
        );
      }

      if (weatherResponse.status === 404) {
        throw new Error(`City "${city}" not found. Please check the spelling.`);
      }

      if (weatherResponse.status === 429) {
        throw new Error(
          "Too many requests. Please wait a moment and try again.",
        );
      }

      if (!weatherResponse.ok) {
        const errorData = await weatherResponse.json();
        throw new Error(errorData.message || "Failed to fetch weather data");
      }

      const weatherData = await weatherResponse.json();
      console.log("Weather data received:", weatherData.name);

      // Fetch forecast
      const forecastUrl = `${this.baseUrl}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=${this.units}`;
      const forecastResponse = await fetch(forecastUrl);

      if (!forecastResponse.ok) {
        throw new Error("Forecast data unavailable");
      }

      const forecastData = await forecastResponse.json();

      this.displayWeather(weatherData, forecastData);
      this.currentCity = weatherData.name;
    } catch (error) {
      console.error("Error:", error);
      this.showToast(
        error.message || "Failed to fetch weather data. Please try again.",
      );
      this.displayErrorMessage(city);
    } finally {
      this.hideLoading();
    }
  }

  displayErrorMessage(city) {
    document.getElementById("cityName").textContent = city || "Error";
    document.getElementById("countryName").textContent =
      "Unable to load weather data";
    document.getElementById("temperature").textContent = "--";
    document.getElementById("weatherDesc").textContent =
      "Check API key configuration";
    document.getElementById("feelsLikeStat").textContent = "--°";
    document.getElementById("humidityStat").textContent = "--%";
    document.getElementById("windStat").textContent = "-- km/h";

    // Show API setup instructions
    const heroSection = document.querySelector(".weather-hero");
    if (heroSection) {
      heroSection.style.background =
        "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.2))";
    }
  }

  displayWeather(currentData, forecastData) {
    try {
      // Update location
      document.getElementById("cityName").textContent =
        currentData.name || "Unknown";
      document.getElementById("countryName").textContent =
        currentData.sys?.country || "Unknown";
      document.getElementById("dateTime").textContent = this.formatDateTime(
        new Date(),
      );

      // Update temperature
      const temp = Math.round(currentData.main?.temp || 0);
      document.getElementById("temperature").textContent = temp;
      document.getElementById("feelsLikeStat").textContent =
        `${Math.round(currentData.main?.feels_like || 0)}°`;
      document.getElementById("weatherDesc").textContent =
        currentData.weather?.[0]?.description || "Unknown";

      // Update weather icon
      const iconCode = currentData.weather?.[0]?.icon || "01d";
      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
      const weatherIcon = document.getElementById("weatherIcon");
      if (weatherIcon) {
        weatherIcon.src = iconUrl;
        weatherIcon.alt =
          currentData.weather?.[0]?.description || "Weather icon";
      }

      // Update sidebar stats
      const humidityElem = document.getElementById("humidityStat");
      const windElem = document.getElementById("windStat");
      if (humidityElem)
        humidityElem.textContent = `${currentData.main?.humidity || 0}%`;
      if (windElem)
        windElem.textContent = `${(currentData.wind?.speed * 3.6 || 0).toFixed(1)} km/h`;

      // Update details grid
      document.getElementById("pressure").textContent =
        currentData.main?.pressure || "--";
      document.getElementById("visibility").textContent = (
        (currentData.visibility || 0) / 1000
      ).toFixed(1);
      document.getElementById("clouds").textContent =
        currentData.clouds?.all || "--";

      // Calculate UV Index estimate
      const uvIndex = this.estimateUVIndex(currentData);
      document.getElementById("uvStat").textContent = uvIndex;
      document.getElementById("airQualityValue").textContent =
        this.estimateAQI(currentData);

      // Update sun times
      if (currentData.sys?.sunrise && currentData.sys?.sunset) {
        const sunrise = new Date(currentData.sys.sunrise * 1000);
        const sunset = new Date(currentData.sys.sunset * 1000);
        document.getElementById("sunrise").textContent =
          this.formatTime(sunrise);
        document.getElementById("sunset").textContent = this.formatTime(sunset);
      }

      // Update min/max temp from forecast
      if (forecastData.list && forecastData.list.length > 0) {
        const todayForecast = forecastData.list.slice(0, 8);
        const temps = todayForecast.map((item) => item.main?.temp || 0);
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        document.getElementById("maxTemp").textContent =
          `${Math.round(maxTemp)}°C`;
        document.getElementById("minTemp").textContent =
          `${Math.round(minTemp)}°C`;
      }

      // Display forecast
      this.displayForecast(forecastData);

      // Change background based on weather
      this.updateBackground(currentData.weather?.[0]?.main || "Clear");

      // Show success message
      this.showToast(`✅ Weather updated for ${currentData.name}`, false);
    } catch (error) {
      console.error("Display error:", error);
      this.showToast("Error displaying weather data");
    }
  }

  estimateUVIndex(weatherData) {
    // Simple UV estimation based on time and weather
    const hour = new Date().getHours();
    const clouds = weatherData.clouds?.all || 0;

    let uvBase = 0;
    if (hour >= 10 && hour <= 16) {
      uvBase = 8;
    } else if (hour >= 8 && hour <= 18) {
      uvBase = 5;
    } else {
      uvBase = 2;
    }

    const uvIndex = Math.max(
      0,
      Math.min(11, Math.round(uvBase * (1 - clouds / 100))),
    );
    return uvIndex;
  }

  estimateAQI(weatherData) {
    const weather = weatherData.weather?.[0]?.main?.toLowerCase() || "";

    if (weather.includes("clear")) {
      return Math.floor(Math.random() * 50) + 20;
    } else if (weather.includes("cloud")) {
      return Math.floor(Math.random() * 70) + 30;
    } else if (weather.includes("fog") || weather.includes("mist")) {
      return Math.floor(Math.random() * 100) + 80;
    } else {
      return Math.floor(Math.random() * 60) + 40;
    }
  }

  displayForecast(forecastData) {
    const forecastContainer = document.getElementById("forecastContainer");
    if (!forecastContainer) return;

    forecastContainer.innerHTML = "";

    if (!forecastData.list || forecastData.list.length === 0) {
      forecastContainer.innerHTML =
        '<p style="text-align:center;color:var(--text-muted);">Forecast data unavailable</p>';
      return;
    }

    // Get unique days
    const dailyForecasts = [];
    const processedDates = new Set();

    for (let i = 0; i < forecastData.list.length; i++) {
      const forecast = forecastData.list[i];
      const date = new Date(forecast.dt * 1000);
      const dateKey = date.toDateString();

      if (!processedDates.has(dateKey) && dailyForecasts.length < 5) {
        processedDates.add(dateKey);
        dailyForecasts.push(forecast);
      }
    }

    dailyForecasts.forEach((forecast) => {
      const date = new Date(forecast.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const monthDay = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const card = document.createElement("div");
      card.className = "forecast-card";
      card.innerHTML = `
                <div class="forecast-date">
                    <strong>${dayName}</strong>
                    <small>${monthDay}</small>
                </div>
                <div class="forecast-icon">
                    <img src="https://openweathermap.org/img/wn/${forecast.weather?.[0]?.icon || "01d"}@2x.png" 
                         alt="${forecast.weather?.[0]?.description || "Weather"}">
                </div>
                <div class="forecast-temp">
                    ${Math.round(forecast.main?.temp || 0)}°
                </div>
                <div class="forecast-desc">
                    ${forecast.weather?.[0]?.description || "Unknown"}
                </div>
            `;

      forecastContainer.appendChild(card);
    });
  }

  async getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showToast("Geolocation is not supported by your browser");
      return;
    }

    this.showLoading();

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          console.log("Location obtained:", latitude, longitude);

          const reverseGeoUrl = `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=${this.units}`;
          const response = await fetch(reverseGeoUrl);

          if (!response.ok) {
            throw new Error("Could not get location data");
          }

          const data = await response.json();

          if (data.name) {
            await this.fetchWeatherData(data.name);
            this.showToast(
              `📍 Located: ${data.name}, ${data.sys?.country}`,
              false,
            );
          } else {
            throw new Error("City name not found");
          }
        } catch (error) {
          console.error("Location error:", error);
          this.showToast(
            "Could not get weather for your location. Please search for a city.",
          );
          this.hideLoading();
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to access your location. ";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage +=
              "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "Please check your location settings.";
        }

        this.showToast(errorMessage);
        this.hideLoading();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }

  async searchWeather() {
    const city = this.cityInput.value.trim();
    if (!city) {
      this.showToast("Please enter a city name");
      return;
    }
    await this.fetchWeatherData(city);
    this.cityInput.value = "";
  }

  updateBackground(weatherCondition) {
    const hero = document.querySelector(".weather-hero");
    if (!hero) return;

    const conditions = {
      Clear:
        "linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,236,107,0.15))",
      Clouds:
        "linear-gradient(135deg, rgba(100,100,150,0.15), rgba(150,150,200,0.15))",
      Rain: "linear-gradient(135deg, rgba(50,50,100,0.15), rgba(100,100,150,0.15))",
      Drizzle:
        "linear-gradient(135deg, rgba(50,50,100,0.15), rgba(100,100,150,0.15))",
      Snow: "linear-gradient(135deg, rgba(200,230,255,0.15), rgba(150,200,255,0.15))",
      Thunderstorm:
        "linear-gradient(135deg, rgba(80,80,100,0.15), rgba(40,40,60,0.15))",
    };

    const gradient = conditions[weatherCondition] || conditions["Clear"];
    hero.style.background = gradient;
  }

  formatDateTime(date) {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
  }

  formatTime(date) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    const icon = this.themeToggle.querySelector("i");
    const text = this.themeToggle.querySelector("span");

    if (newTheme === "dark") {
      icon.className = "fas fa-moon";
      text.textContent = "Dark Mode";
    } else {
      icon.className = "fas fa-sun";
      text.textContent = "Light Mode";
    }
  }

  loadTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    if (this.themeToggle) {
      const icon = this.themeToggle.querySelector("i");
      const text = this.themeToggle.querySelector("span");

      if (savedTheme === "light") {
        icon.className = "fas fa-sun";
        text.textContent = "Light Mode";
      }
    }
  }
}

// Initialize app when DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  window.weatherApp = new NebulaWeather();
});
