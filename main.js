/******************************
 * CONFIG
 ****************************/
const API_KEY = "53b33ec4d7cb2ce70e5fd376ed49972e";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

/******************************
 * DOM ELEMENTS
 ******************************/
const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");

const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");
const weatherDisplay = document.getElementById("weather-display");

const cityName = document.getElementById("city-name");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");

const feelsLike = document.getElementById("feels-like");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const pressure = document.getElementById("pressure");

const effectsContainer = document.getElementById("weather-effects");

/******************************
 * FETCH HELPERS
 ******************************/
async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("API Error");
    return res.json();
}

async function getWeather(city) {
    return fetchJSON(
        `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
}

async function getForecast(city) {
    return fetchJSON(
        `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
}

/******************************
 * FORECAST PROCESSING
 ******************************/
function build5DayForecast(list) {
    const days = {};

    list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];

        if (!days[date]) {
            days[date] = {
                temps: [],
                icon: item.weather[0].icon,
                main: item.weather[0].main
            };
        }

        days[date].temps.push(item.main.temp);
    });

    return Object.keys(days).slice(0, 5).map(date => {
        const d = days[date];

        return {
            date,
            avg: (d.temps.reduce((a, b) => a + b, 0) / d.temps.length).toFixed(1),
            icon: d.icon,
            main: d.main
        };
    });
}

function build3HourForecast(list) {
    return list.slice(0, 8).map(item => ({
        time: item.dt_txt,
        temp: item.main.temp,
        icon: item.weather[0].icon
    }));
}

/******************************
 * RENDER FORECAST
 ******************************/
function render5Day(data) {
    const container = document.getElementById("five-day");

    container.innerHTML = data.map(day => `
        <div class="day-card">
            <p>${day.date}</p>
            <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png">
            <p>${day.avg}°C</p>
            <small>${day.main}</small>
        </div>
    `).join("");
}

function render3Hour(data) {
    const container = document.getElementById("three-hour");

    container.innerHTML = data.map(h => `
        <div class="hour-card">
            <p>${new Date(h.time).getHours()}:00</p>
            <img src="https://openweathermap.org/img/wn/${h.icon}@2x.png">
            <p>${h.temp}°C</p>
        </div>
    `).join("");
}

/******************************
 * EFFECTS
 ******************************/
function clearEffects() {
    effectsContainer.innerHTML = "";
}

function createRain() {
    clearEffects();

    for (let i = 0; i < 70; i++) {
        const drop = document.createElement("div");
        drop.className = "rain-drop";
        drop.style.left = Math.random() * 100 + "vw";
        drop.style.animationDuration = (0.4 + Math.random()) + "s";
        effectsContainer.appendChild(drop);
    }
}

function createSnow() {
    clearEffects();

    for (let i = 0; i < 50; i++) {
        const flake = document.createElement("div");
        flake.className = "snowflake";
        flake.style.left = Math.random() * 100 + "vw";
        flake.style.animationDuration = (2 + Math.random() * 3) + "s";
        effectsContainer.appendChild(flake);
    }
}

/******************************
 * UI UPDATE
 ******************************/
function setBackground(type) {
    switch (type) {
        case "Rain":
            document.body.style.background = "linear-gradient(135deg, #667db6, #0082c8)";
            createRain();
            break;

        case "Snow":
            document.body.style.background = "linear-gradient(135deg, #83a4d4, #b6fbff)";
            createSnow();
            break;

        case "Clear":
            document.body.style.background = "linear-gradient(135deg, #fceabb, #f8b500)";
            clearEffects();
            break;

        default:
            document.body.style.background = "linear-gradient(135deg, #f6d365, #fda085)";
            clearEffects();
    }
}

function displayWeather(current) {
    const type = current.weather[0].main;

    cityName.textContent = `${current.name}, ${current.sys.country}`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`;

    temperature.textContent = `${current.main.temp}°C`;
    description.textContent = current.weather[0].description;

    feelsLike.textContent = `${current.main.feels_like}°C`;
    humidity.textContent = `${current.main.humidity}%`;
    wind.textContent = `${current.wind.speed} m/s`;
    pressure.textContent = `${current.main.pressure} hPa`;

    setBackground(type);

    weatherDisplay.classList.remove("hidden");
}

/******************************
 * HISTORY
 ******************************/
function saveHistory(city) {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    history = history.filter(c => c.toLowerCase() !== city.toLowerCase());
    history.unshift(city);

    if (history.length > 5) history.pop();

    localStorage.setItem("history", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById("search-history");
    const history = JSON.parse(localStorage.getItem("history")) || [];

    list.innerHTML = history.map(city =>
        `<li data-city="${city}">${city}</li>`
    ).join("");
}

/******************************
 * LOADING / ERROR
 ******************************/
function showLoading() {
    loading.classList.remove("hidden");
    weatherDisplay.classList.add("hidden");
}

function hideLoading() {
    loading.classList.add("hidden");
}

function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
    weatherDisplay.classList.add("hidden");
}

function hideError() {
    errorBox.classList.add("hidden");
}

/******************************
 * MAIN CONTROLLER
 ******************************/
async function loadWeather(city) {
    try {
        showLoading();
        hideError();

        const current = await getWeather(city);
        const forecast = await getForecast(city);

        // Weather UI
        displayWeather(current);

        // Forecast UI
        const fiveDay = build5DayForecast(forecast.list);
        const threeHour = build3HourForecast(forecast.list);

        render5Day(fiveDay);
        render3Hour(threeHour);

        saveHistory(city);

    } catch (err) {
        showError("Failed to load weather data");
        console.error(err);
    } finally {
        hideLoading();
    }
}

/******************************
 * EVENTS
 ******************************/
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const city = cityInput.value.trim();
    if (city) {
        loadWeather(city);
        cityInput.value = "";
    }
});

document.getElementById("search-history")
    .addEventListener("click", (e) => {
        if (e.target.tagName === "LI") {
            loadWeather(e.target.dataset.city);
        }
    });

window.addEventListener("DOMContentLoaded", () => {
    weatherDisplay.classList.add("hidden");
    renderHistory();
});
