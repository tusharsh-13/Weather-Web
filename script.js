const API_KEY = "c901aab5888343ab86590605250712";

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const statusText = document.getElementById("status-text");

const weatherMain = document.getElementById("weather-main");
const cityNameEl = document.getElementById("city-name");
const dateTimeEl = document.getElementById("date-time");
const lastUpdatedEl = document.getElementById("last-updated");
const tempEl = document.getElementById("temperature");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const minMaxEl = document.getElementById("min-max");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const descEl = document.getElementById("description");
const iconEl = document.getElementById("weather-icon");

const unitCBtn = document.getElementById("unit-c");
const unitFBtn = document.getElementById("unit-f");

const forecastSection = document.getElementById("forecast-section");
const forecastList = document.getElementById("forecast-list");

let currentUnit = "metric";
let lastWeather = null;

console.log("Weather Web script loaded");

function normalizeQuery(raw) {
  const key = raw.trim().toLowerCase();

  const aliases = {
    delhi: "Delhi, India",
    "new delhi": "New Delhi, India",
    mumbai: "Mumbai, India",
    bombay: "Mumbai, India",
    bhopal: "Bhopal, India",
    kolkata: "Kolkata, India",
    calcutta: "Kolkata, India",
    chennai: "Chennai, India",
    bangalore: "Bangalore, India",
    bengaluru: "Bengaluru, India",
    hyderabad: "Hyderabad, India",
    pune: "Pune, India",
  };

  return aliases[key] || raw.trim();
}

function cToF(c) {
  return (c * 9) / 5 + 32;
}

function fToC(f) {
  return ((f - 32) * 5) / 9;
}

function formatLocaltime(localtimeStr) {
  if (!localtimeStr) return "";
  const [datePart, timePart] = localtimeStr.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const date = new Date(year, month - 1, day, hour, minute);
  return date.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLastUpdated(lastUpdatedEpoch) {
  if (!lastUpdatedEpoch) return "";
  const nowSec = Date.now() / 1000;
  const diffMin = Math.max(0, Math.floor((nowSec - lastUpdatedEpoch) / 60));

  if (diffMin < 1) return "Updated just now";
  if (diffMin === 1) return "Updated 1 min ago";
  if (diffMin < 60) return `Updated ${diffMin} mins ago`;
  const hours = Math.floor(diffMin / 60);
  return `Updated ${hours} hr${hours > 1 ? "s" : ""} ago`;
}

function renderWeather() {
  if (!lastWeather) return;

  const {
    city,
    localtime,
    lastUpdatedEpoch,
    current,
    astro,
    todayMaxC,
    todayMinC,
    todayMaxF,
    todayMinF,
  } = lastWeather;

  const useMetric = currentUnit === "metric";
  const unitLabel = useMetric ? "°C" : "°F";

  const displayTemp = useMetric
    ? Math.round(current.tempC)
    : Math.round(current.tempF);
  const displayFeels = useMetric
    ? Math.round(current.feelsC)
    : Math.round(current.feelsF);

  const displayMin = useMetric ? Math.round(todayMinC) : Math.round(todayMinF);
  const displayMax = useMetric ? Math.round(todayMaxC) : Math.round(todayMaxF);

  const windText = useMetric
    ? `${current.windKph} kph`
    : `${current.windMph} mph`;

  cityNameEl.textContent = city;
  dateTimeEl.textContent = formatLocaltime(localtime);
  lastUpdatedEl.textContent = formatLastUpdated(lastUpdatedEpoch);

  tempEl.textContent = `${displayTemp}${unitLabel}`;
  feelsLikeEl.textContent = `${displayFeels}${unitLabel}`;
  humidityEl.textContent = `${current.humidity}%`;
  windEl.textContent = windText;
  minMaxEl.textContent = `${displayMin}° / ${displayMax}${unitLabel}`;

  sunriseEl.textContent = astro.sunrise || "-";
  sunsetEl.textContent = astro.sunset || "-";

  descEl.textContent = current.description;
  iconEl.src = `https:${current.icon}`;
  iconEl.alt = current.description;

  weatherMain.classList.remove("hidden");
}

function renderForecast() {
  if (!lastWeather) return;

  const { forecast } = lastWeather;
  const useMetric = currentUnit === "metric";
  const unitLabel = useMetric ? "°C" : "°F";

  forecastList.innerHTML = "";

  forecast.forEach((day, index) => {
    const date = new Date(day.year, day.month - 1, day.day);
    const dayName = date.toLocaleDateString(undefined, { weekday: "short" });

    const max = useMetric
      ? Math.round(day.maxTempC)
      : Math.round(day.maxTempF);
    const min = useMetric
      ? Math.round(day.minTempC)
      : Math.round(day.minTempF);

    const item = document.createElement("div");
    item.className = "forecast-item";
    item.innerHTML = `
      <div class="day-name">${index === 0 ? "Today" : dayName}</div>
      <img src="https:${day.icon}" alt="${day.text}">
      <div class="temp-range">${min}${unitLabel} / ${max}${unitLabel}</div>
    `;
    forecastList.appendChild(item);
  });

  forecastSection.classList.remove("hidden");
}

async function fetchWeather(city) {
  statusText.textContent = "Fetching weather...";
  weatherMain.classList.add("hidden");
  forecastSection.classList.add("hidden");

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${encodeURIComponent(
      city
    )}&days=5&aqi=no&alerts=no`;

    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 400) {
        statusText.textContent = "City not found. Try another name.";
      } else if (res.status === 401) {
        statusText.textContent = "Invalid API key. Check your WeatherAPI key.";
      } else {
        statusText.textContent = "Something went wrong. Please try again.";
      }
      return;
    }

    const data = await res.json();

    const { location, current, forecast } = data;

    const cityLabel = `${location.name}, ${location.country}`;
    const localtime = location.localtime;
    const lastUpdatedEpoch = current.last_updated_epoch;

    const firstDay = forecast.forecastday[0];

    const astro = {
      sunrise: firstDay.astro.sunrise,
      sunset: firstDay.astro.sunset,
    };

    const forecastDays = forecast.forecastday.map((d) => {
      const [year, month, dayNum] = d.date.split("-").map(Number);
      return {
        year,
        month,
        day: dayNum,
        maxTempC: d.day.maxtemp_c,
        minTempC: d.day.mintemp_c,
        maxTempF: d.day.maxtemp_f,
        minTempF: d.day.mintemp_f,
        icon: d.day.condition.icon,
        text: d.day.condition.text,
      };
    });

    lastWeather = {
      city: cityLabel,
      localtime,
      lastUpdatedEpoch,
      current: {
        tempC: current.temp_c,
        tempF: current.temp_f,
        feelsC: current.feelslike_c,
        feelsF: current.feelslike_f,
        humidity: current.humidity,
        windKph: current.wind_kph,
        windMph: current.wind_mph,
        description: current.condition.text,
        icon: current.condition.icon,
      },
      astro,
      todayMaxC: firstDay.day.maxtemp_c,
      todayMinC: firstDay.day.mintemp_c,
      todayMaxF: firstDay.day.maxtemp_f,
      todayMinF: firstDay.day.mintemp_f,
      forecast: forecastDays,
    };

    statusText.textContent = "";
    renderWeather();
    renderForecast();
  } catch (err) {
    console.error(err);
    statusText.textContent = "Network error. Check your connection.";
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const rawCity = cityInput.value;
  const city = normalizeQuery(rawCity);

  if (!city) {
    statusText.textContent = "Please enter a city name.";
    weatherMain.classList.add("hidden");
    forecastSection.classList.add("hidden");
    return;
  }
  fetchWeather(city);
});

document.querySelectorAll(".city-chip").forEach((btn) => {
  btn.addEventListener("click", () => {
    const rawCity = btn.getAttribute("data-city");
    const city = normalizeQuery(rawCity);
    cityInput.value = rawCity; 
    fetchWeather(city);
  });
});

unitCBtn.addEventListener("click", () => {
  if (currentUnit === "metric") return;
  currentUnit = "metric";
  unitCBtn.classList.add("active");
  unitFBtn.classList.remove("active");
  renderWeather();
  renderForecast();
});

unitFBtn.addEventListener("click", () => {
  if (currentUnit === "imperial") return;
  currentUnit = "imperial";
  unitFBtn.classList.add("active");
  unitCBtn.classList.remove("active");
  renderWeather();
  renderForecast();
});
