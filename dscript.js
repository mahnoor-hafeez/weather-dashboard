
// Constants
const API_KEY = '4a9fba6ba278b4e12858c059aaa49522'; 

// DOM Elements
const elements = {
    searchBtn: document.getElementById('searchBtn'),
    locationBtn: document.getElementById('locationBtn'),
    cityInput: document.getElementById('cityInput'),
    cityName: document.getElementById('cityName'),
    currentWeather: document.getElementById('currentWeather'),
    forecastContainer: document.getElementById('forecastContainer'),
    loader: document.getElementById('loader'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    chatMessages: document.getElementById('chatMessages'),
    weatherWidget: document.getElementById('weatherWidget')
};

// Chart instances
let tempBarChart, conditionChart, tempLineChart;

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
elements.searchBtn.addEventListener('click', handleSearch);
elements.locationBtn.addEventListener('click', handleGeolocation);
elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
elements.sendChatBtn.addEventListener('click', handleChatMessage);
elements.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleChatMessage();
});

// Initialize Application
async function initializeApp() {
    initializeCharts();
    const lastCity = localStorage.getItem('lastSearchedCity');
    if (lastCity) {
        elements.cityInput.value = lastCity;
        await handleSearch();
    } else {
        handleGeolocation();
    }
}

async function getWeatherData(lat = null, lon = null) {
    showLoader();
    try {
        let currentUrl, forecastUrl;
        if (lat !== null && lon !== null) {
            currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        } else {
            const city = elements.cityInput.value.trim();
            if (!city) {
                showError('Please enter a city name');
                return;
            }
            currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;
        }

        // Fetch both current weather and forecast data
        const [currentData, forecastData] = await Promise.all([
            fetch(currentUrl).then(handleApiResponse),
            fetch(forecastUrl).then(handleApiResponse)
        ]);

        updateDashboard(currentData, forecastData);
        localStorage.setItem('lastSearchedCity', currentData.name);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Failed to fetch weather data. Please try again.');
    } finally {
        hideLoader();
    }
}

// API Response Handler
async function handleApiResponse(response) {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

// Update Dashboard
function updateDashboard(currentData, forecastData) {
    displayCurrentWeather(currentData);
    display5DayForecast(forecastData);
    updateCharts(forecastData);
    updateBackgroundByWeather(currentData.weather[0].main);
}

// Display Current Weather
function displayCurrentWeather(data) {
    const weather = data.weather[0];
    elements.cityName.textContent = `${data.name}, ${data.sys.country}`;
    elements.currentWeather.innerHTML = `
        <div class="weather-item">
            <img src="https://openweathermap.org/img/wn/${weather.icon}@2x.png" alt="${weather.description}">
            <h3>${weather.main}</h3>
            <p>${weather.description}</p>
        </div>
        <div class="weather-item">
            <i class="fas fa-temperature-high"></i>
            <div>
                <h3>Temperature</h3>
                <p>${data.main.temp.toFixed(1)}°C</p>
                <p>Feels like: ${data.main.feels_like.toFixed(1)}°C</p>
            </div>
        </div>
        <div class="weather-item">
            <i class="fas fa-tint"></i>
            <div>
                <h3>Humidity</h3>
                <p>${data.main.humidity}%</p>
            </div>
        </div>
        <div class="weather-item">
            <i class="fas fa-wind"></i>
            <div>
                <h3>Wind</h3>
                <p>${data.wind.speed.toFixed(1)} m/s</p>
            </div>
        </div>
    `;
}
// Get Background by Weather Condition
function getBackgroundByWeather(weatherCondition) {
    const backgrounds = {
        Clear: 'linear-gradient(to right, #f6d365, #fda085)',
        Clouds: 'linear-gradient(to right, #bdc3c7, #2c3e50)',
        Rain: 'linear-gradient(to right, #373b44, #4286f4)',
        Snow: 'linear-gradient(to right, #e6dada, #274046)',
        Thunderstorm: 'linear-gradient(to right, #141E30, #243B55)', // Example for Thunderstorm
        Drizzle: 'linear-gradient(to right, #3a7bd5, #3a6073)', // Example for Drizzle
        Mist: 'linear-gradient(to right, #606c88, #3f4c6b)' // Example for Mist/Fog
    };

    // Return the background for the weather condition or default to Clear
    return backgrounds[weatherCondition] || backgrounds.Clear;
}


// Display 5-Day Forecast
function display5DayForecast(data) {
    const dailyForecasts = processForecastData(data.list);
    elements.forecastContainer.innerHTML = dailyForecasts.map(forecast => {
        const weatherCondition = forecast.weather[0].main; // Get the weather condition
        const background = getBackgroundByWeather(weatherCondition); // Get the appropriate background

        return `
            <div class="forecast-card" style="background: ${background};">
                <h4>${new Date(forecast.dt * 1000).toLocaleDateString()}</h4>
                <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="${forecast.weather[0].description}">
                <p>${forecast.main.temp.toFixed(1)}°C</p>
                <p>${forecast.weather[0].main}</p>
            </div>
        `;
    }).join('');
}

// Update Background for Current Weather
function updateBackgroundByWeather(weatherCondition) {
    const background = getBackgroundByWeather(weatherCondition);
    elements.weatherWidget.style.background = background;
}

// Process Forecast Data
function processForecastData(forecastList) {
    const dailyData = {};
    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        if (!dailyData[date]) {
            dailyData[date] = forecast;
        }
    });
    return Object.values(dailyData).slice(0, 5);
}

// Chart Initialization and Updates
function initializeCharts() {
    // Temperature Bar Chart
    const tempCtx = document.getElementById('tempBarChart').getContext('2d');
    tempBarChart = new Chart(tempCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C)',
                data: [],
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            animation: {
                delay: (context) => context.dataIndex * 100
            },
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Weather Conditions Doughnut Chart
    const conditionCtx = document.getElementById('conditionDoughnutChart').getContext('2d');
    conditionChart = new Chart(conditionCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)'
                ]
            }]
        },
        options: {
            animation: {
                delay: (context) => context.dataIndex * 100
            },
            responsive: true
        }
    });

    // Temperature Line Chart
    const lineCtx = document.getElementById('tempLineChart').getContext('2d');
    tempLineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature Trend',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.4
            }]
        },
        options: {
            animation: {
                y: {
                    duration: 2000,
                    from: -100
                }
            },
            responsive: true
        }
    });
}

// Update Charts with New Data
function updateCharts(forecastData) {
    const processedData = processForecastData(forecastData.list);
    
    // Update Bar Chart
    updateTempBarChart(processedData);
    
    // Update Doughnut Chart
    updateConditionChart(processedData);
    
    // Update Line Chart
    updateTempLineChart(processedData);
}

// Individual Chart Updates
function updateTempBarChart(data) {
    tempBarChart.data.labels = data.map(item => new Date(item.dt * 1000).toLocaleDateString());
    tempBarChart.data.datasets[0].data = data.map(item => item.main.temp);
    tempBarChart.update();
}

function updateConditionChart(data) {
    const conditions = {};
    data.forEach(item => {
        const condition = item.weather[0].main;
        conditions[condition] = (conditions[condition] || 0) + 1;
    });

    conditionChart.data.labels = Object.keys(conditions);
    conditionChart.data.datasets[0].data = Object.values(conditions);
    conditionChart.update();
}

function updateTempLineChart(data) {
    tempLineChart.data.labels = data.map(item => new Date(item.dt * 1000).toLocaleDateString());
    tempLineChart.data.datasets[0].data = data.map(item => item.main.temp);
    tempLineChart.update();
}

// UI Helper Functions
function appendMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;
    messageDiv.textContent = content;
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function updateBackgroundByWeather(weatherCondition) {
    const backgrounds = {
        Clear: 'linear-gradient(to right, #f6d365, #fda085)',
        Clouds: 'linear-gradient(to right, #bdc3c7, #2c3e50)',
        Rain: 'linear-gradient(to right, #373b44, #4286f4)',
        Snow: 'linear-gradient(to right, #e6dada, #274046)'
    };
    
    elements.weatherWidget.style.background = backgrounds[weatherCondition] || backgrounds.Clear;
}

function showLoader() {
    elements.loader.classList.remove('hidden');
}

function hideLoader() {
    elements.loader.classList.add('hidden');
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    elements.currentWeather.innerHTML = '';
    elements.currentWeather.appendChild(errorDiv);
    
    // Clear other elements that might display old data
    elements.cityName.textContent = '';
    elements.forecastContainer.innerHTML = '';
    
    // Reset charts
    updateCharts({ list: [] });
}

// Geolocation Handler
function handleGeolocation() {
    if (navigator.geolocation) {
        showLoader();
        navigator.geolocation.getCurrentPosition(
            position => getWeatherData(position.coords.latitude, position.coords.longitude),
            error => {
                hideLoader();
                showError('Unable to retrieve your location');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
    }
}

// Search Handler
async function handleSearch() {
    const city = elements.cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    await getWeatherData();
}
