// Constants and API Keys
const API_KEY = '4a9fba6ba278b4e12858c059aaa49522';
const GEMINI_API_KEY = 'AIzaSyDpu8Xez-y4_YaCzxym1VVrAEZ2wE4Jb2A';

// DOM Elements
const elements = {
    searchBtn: document.getElementById('searchBtn'),
    cityInput: document.getElementById('cityInput'),
    forecastTable: document.getElementById('forecastTable'),
    pagination: document.getElementById('pagination'),
    chatInput: document.getElementById('chatInput'),
    sendChatBtn: document.getElementById('sendChatBtn'),
    chatMessages: document.getElementById('chatMessages'),
    unitToggle: document.getElementById('unitToggle'),
    sortAscBtn: document.getElementById('sortAscBtn'),
    sortDescBtn: document.getElementById('sortDescBtn'),
    filterRainBtn: document.getElementById('filterRainBtn'),
    highestTempBtn: document.getElementById('highestTempBtn'),
    resetBtn: document.getElementById('resetBtn')
};

// State Management
let state = {
    currentPage: 1,
    itemsPerPage: 10,
    forecastData: [],
    originalData: [],
    isCelsius: true,
    isFiltered: false
};

// Event Listeners
function initializeEventListeners() {
    elements.searchBtn.addEventListener('click', getWeatherData);
    elements.sendChatBtn.addEventListener('click', handleChatSubmit);
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSubmit();
    });
    elements.unitToggle.addEventListener('change', toggleTemperatureUnit);
    elements.sortAscBtn.addEventListener('click', () => sortTemperatures('asc'));
    elements.sortDescBtn.addEventListener('click', () => sortTemperatures('desc'));
    elements.filterRainBtn.addEventListener('click', filterRainyDays);
    elements.highestTempBtn.addEventListener('click', showHighestTemperature);
    elements.resetBtn.addEventListener('click', resetFilters);
    document.getElementById('getLocationButton').addEventListener('click', getLocationWeather);


    // City input validation
    elements.cityInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    });
}

// Weather Data Functions
async function getWeatherData() {
    const city = elements.cityInput.value.trim();
    if (!city) {
        showNotification('Please enter a city name', 'error');
        return;
    }

    try {
        showLoader(); // Show loader before the fetch call
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) {
            throw new Error('City not found or API error');
        }

        const data = await response.json();
        state.forecastData = data.list;
        state.originalData = [...data.list]; // Store original data for resetting filters
        state.currentPage = 1;
        
        updateTable();
        showNotification(`Weather data loaded for ${city}`, 'success');
        localStorage.setItem('lastCity', city);
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        hideLoader(); // Hide loader after the fetch call
    }
}


// Table Display Functions
function updateTable() {
    const tbody = elements.forecastTable.querySelector('tbody');
    tbody.innerHTML = '';

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const pageData = state.forecastData.slice(startIndex, endIndex);

    pageData.forEach(item => {
        const row = document.createElement('tr');
        const date = new Date(item.dt * 1000);
        
        row.innerHTML = `
            <td>${formatDate(date)}</td>
            <td>${formatTemperature(item.main.temp)}</td>
            <td>
                <div class="weather-condition">
                    <span>${capitalizeFirst(item.weather[0].description)}</span>
                </div>
            </td>
            <td>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" 
                     alt="${item.weather[0].description}" 
                     class="weather-icon">
            </td>
        `;
        
        tbody.appendChild(row);
    });

    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(state.forecastData.length / state.itemsPerPage);
    elements.pagination.innerHTML = '';

    // Previous button
    addPaginationButton('Previous', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            updateTable();
        }
    }, state.currentPage === 1);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        addPaginationButton(i.toString(), () => {
            state.currentPage = i;
            updateTable();
        }, false, i === state.currentPage);
    }

    // Next button
    addPaginationButton('Next', () => {
        if (state.currentPage < totalPages) {
            state.currentPage++;
            updateTable();
        }
    }, state.currentPage === totalPages);
}


// Filter Functions
function sortTemperatures(direction) {
    state.forecastData.sort((a, b) => {
        return direction === 'asc' 
            ? a.main.temp - b.main.temp 
            : b.main.temp - a.main.temp;
    });
    updateTable();
}

function filterRainyDays() {
    if (!state.isFiltered) {
        state.forecastData = state.forecastData.filter(item => 
            item.weather[0].main.toLowerCase().includes('rain')
        );
        state.isFiltered = true;
        elements.filterRainBtn.classList.add('active');
    } else {
        resetFilters();
    }
    state.currentPage = 1;
    updateTable();
}

function showHighestTemperature() {
    const highestTempDay = state.originalData.reduce((prev, current) => 
        current.main.temp > prev.main.temp ? current : prev
    );

    const date = new Date(highestTempDay.dt * 1000);
    showNotification(
        `Highest temperature: ${formatTemperature(highestTempDay.main.temp)} on ${formatDate(date)}`,
        'info'
    );
}

// Reset Function
function resetFilters() {
    state.forecastData = [...state.originalData];
    state.isFiltered = false;
    elements.filterRainBtn.classList.remove('active');
    state.currentPage = 1;
    updateTable();
}

// Chatbot Functions
async function handleChatSubmit() {
    const message = elements.chatInput.value.trim();
    if (!message) return;

    appendChatMessage('user', message);
    elements.chatInput.value = '';

    try {
        if (message.toLowerCase().includes('weather') || message.toLowerCase().includes('raining')) {
            await handleWeatherQuery(message);
        } else {
            await handleGeminiQuery(message);
        }
    } catch (error) {
        appendChatMessage('bot', 'Sorry, I encountered an error processing your request.');
    }
}

async function handleWeatherQuery(message) {
    const cityMatch = message.match(/in ([a-zA-Z\s]+)/i);
    const city = cityMatch ? cityMatch[1].trim() : localStorage.getItem('lastCity');

    if (!city) {
        appendChatMessage('bot', 'Please specify a city name or search for a city first.');
        return;
    }

    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );

        if (!response.ok) throw new Error('Weather data not found');

        const data = await response.json();
        const weather = data.weather[0].description;
        const temperature = data.main.temp;
        const feelsLike = data.main.feels_like;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const pressure = data.main.pressure;
        const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
        const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();
        const isRaining = data.weather.some(condition => condition.main.toLowerCase().includes('rain'));

        // Analyze the user's message to respond appropriately
        const lowerMessage = message.toLowerCase();
        let weatherResponse = '';

        if (lowerMessage.includes('raining')) {
            weatherResponse = isRaining
                ? `Yes, it is currently raining in ${city}.`
                : `No, it is not raining in ${city}.`;
        } else if (lowerMessage.includes('temperature')) {
            weatherResponse = `The current temperature in ${city} is ${Math.round(temperature)}°C, and it feels like ${Math.round(feelsLike)}°C.`;
        } else if (lowerMessage.includes('wind') || lowerMessage.includes('windy')) {
            weatherResponse = `The wind speed in ${city} is ${windSpeed} m/s.`;
        } else if (lowerMessage.includes('humidity')) {
            weatherResponse = `The humidity level in ${city} is ${humidity}%.`;
        } else if (lowerMessage.includes('pressure')) {
            weatherResponse = `The atmospheric pressure in ${city} is ${pressure} hPa.`;
        } else if (lowerMessage.includes('sunrise')) {
            weatherResponse = `The sun rises at ${sunrise} in ${city}.`;
        } else if (lowerMessage.includes('sunset')) {
            weatherResponse = `The sun sets at ${sunset} in ${city}.`;
        } else if (lowerMessage.includes('weather') || lowerMessage.includes('forecast')) {
            weatherResponse = `The current weather in ${city} is ${weather}, with a temperature of ${Math.round(temperature)}°C.`;
        } else if (lowerMessage.includes('hot') || lowerMessage.includes('cold')) {
            weatherResponse = temperature > 25
                ? `Yes, it's quite hot in ${city} with a temperature of ${Math.round(temperature)}°C.`
                : `No, it's not hot in ${city}. The temperature is ${Math.round(temperature)}°C.`;
        } else if (lowerMessage.includes('tomorrow') || lowerMessage.includes('forecast')) {
            weatherResponse = `For a detailed weather forecast in ${city}, please use the forecast search functionality.`;
        } else if (lowerMessage.includes('uv index') || lowerMessage.includes('uv')) {
            // OpenWeather API does not provide UV index directly in the basic endpoint,
            // but it can be obtained from a different API endpoint, or handled via another fetch.
            weatherResponse = `I currently do not have UV index data, but you can check local weather apps for this information.`;
        } else if (lowerMessage.includes('cold')) {
            weatherResponse = temperature < 15
                ? `Yes, it's cold in ${city} with a temperature of ${Math.round(temperature)}°C.`
                : `No, it's not cold in ${city}. The temperature is ${Math.round(temperature)}°C.`;
        } else {
            weatherResponse = `The weather in ${city} is currently ${weather} with a temperature of ${Math.round(temperature)}°C.`;
        }

        appendChatMessage('bot', weatherResponse);
    } catch (error) {
        appendChatMessage('bot', `Sorry, I couldn't get weather information for ${city}.`);
    }
}

async function handleGeminiQuery(message) {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: message }] }]
                })
            }
        );

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            appendChatMessage('bot', data.candidates[0].content.parts[0].text);
        } else {
            appendChatMessage('bot', 'I am not sure how to answer that.');
        }
    } catch (error) {
        appendChatMessage('bot', 'Sorry, I couldn\'t process that query.');
    }
}

// Utility Functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTemperature(value) {
    return `${Math.round(value)}°${state.isCelsius ? 'C' : 'F'}`;
}

function toggleTemperatureUnit() {
    state.isCelsius = !state.isCelsius;
    updateTable();
}

function appendChatMessage(sender, message) {
    const chatMessage = document.createElement('div');
    chatMessage.classList.add('chat-message', sender);
    chatMessage.textContent = message;
    elements.chatMessages.appendChild(chatMessage);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function showNotification(message, type = 'info') {
    // Implement notification display based on type ('success', 'error', 'info')
}

function showLoader() {
    document.body.classList.add('loading');
}

function hideLoader() {
    document.body.classList.remove('loading');
}

function addPaginationButton(label, onClick, isDisabled = false, isActive = false) {
    const button = document.createElement('button');
    button.textContent = label;
    button.classList.add('pagination-btn');
    if (isDisabled) button.disabled = true;
    if (isActive) button.classList.add('active');
    button.addEventListener('click', onClick);
    elements.pagination.appendChild(button);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}


// Initialize Event Listeners
initializeEventListeners();
 