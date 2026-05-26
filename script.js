class NebulaWeather {
  constructor() {
    this.currentCity = "Hyderabad";

    this.init();
  }

  init() {
    this.cityInput = document.getElementById("cityInput");

    this.locationBtn = document.getElementById("locationBtn");

    this.loadingOverlay = document.getElementById("loadingOverlay");

    this.cityInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.searchWeather();
      }
    });

    document
      .querySelector(".fa-search")

      .addEventListener("click", () => {
        this.searchWeather();
      });

    this.fetchWeatherData(this.currentCity);
  }

  showLoading() {
    this.loadingOverlay.style.display = "flex";
  }

  hideLoading() {
    this.loadingOverlay.style.display = "none";
  }

  async fetchWeatherData(city) {
    if (!city) return;

    this.showLoading();

    try {
      const response = await fetch(
        `/api/weather?city=${encodeURIComponent(city)}`,
      );

      const data = await response.json();

      if (data.error) {
        throw Error(data.error);
      }

      this.displayWeather(data.weather, data.forecast);

      this.currentCity = city;
    } catch (e) {
      alert("Weather load failed");

      console.log(e);
    } finally {
      this.hideLoading();
    }
  }

  displayWeather(current, forecast) {
    document.getElementById("cityName").textContent = current.name;

    document.getElementById("countryName").textContent = current.sys.country;

    document.getElementById("temperature").textContent = Math.round(
      current.main.temp,
    );

    document.getElementById("weatherDesc").textContent =
      current.weather[0].description;

    document.getElementById("feelsLikeStat").textContent =
      Math.round(current.main.feels_like) + "°";

    document.getElementById("humidityStat").textContent =
      current.main.humidity + "%";

    document.getElementById("windStat").textContent =
      (current.wind.speed * 3.6).toFixed(1) + " km/h";

    document.getElementById("pressure").textContent = current.main.pressure;

    document.getElementById("visibility").textContent = (
      current.visibility / 1000
    ).toFixed(1);

    document.getElementById("clouds").textContent = current.clouds.all;

    document.getElementById("weatherIcon").src =
      `https://openweathermap.org/img/wn/${current.weather[0].icon}@4x.png`;

    document.getElementById("maxTemp").textContent =
      Math.round(current.main.temp_max) + "°C";

    document.getElementById("minTemp").textContent =
      Math.round(current.main.temp_min) + "°C";

    const sunrise = new Date(current.sys.sunrise * 1000);

    const sunset = new Date(current.sys.sunset * 1000);

    document.getElementById("sunrise").textContent = sunrise.toLocaleTimeString(
      [],
      {
        hour: "2-digit",

        minute: "2-digit",
      },
    );

    document.getElementById("sunset").textContent = sunset.toLocaleTimeString(
      [],
      {
        hour: "2-digit",

        minute: "2-digit",
      },
    );

    this.showForecast(forecast);
  }

  showForecast(forecast) {
    const container = document.getElementById("forecastContainer");

    container.innerHTML = "";

    const days = [];

    const seen = new Set();

    forecast.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString();

      if (!seen.has(date) && days.length < 5) {
        seen.add(date);

        days.push(item);
      }
    });

    days.forEach((day) => {
      const card = document.createElement("div");

      card.className = "forecast-card";

      card.innerHTML = `

<div class=
"forecast-date">

${new Date(day.dt * 1000).toLocaleDateString("en-US", {
  weekday: "short",
})}

</div>

<div class=
"forecast-icon">

<img src=
"https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png">

</div>

<div class=
"forecast-temp">

${Math.round(day.main.temp)}°

</div>

<div class=
"forecast-desc">

${day.weather[0].description}

</div>

`;

      container.appendChild(card);
    });
  }

  searchWeather() {
    const city = this.cityInput.value.trim();

    if (city) {
      this.fetchWeatherData(city);

      this.cityInput.value = "";
    }
  }
}

document.addEventListener(
  "DOMContentLoaded",

  () => {
    new NebulaWeather();
  },
);
