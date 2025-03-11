Change in file by main.
# Weather Dashboard with Chatbot Integration

## Project Overview

The **Weather Dashboard with Chatbot Integration** is a web application that allows users to retrieve weather forecasts for various cities. It integrates with the OpenWeather API to fetch current weather data and a chatbot powered by the Gemini API to provide an interactive conversational experience. Users can view weather conditions, toggle between temperature units, filter results, and chat with the bot for additional information.

### Features

- **Weather Forecast**: Search for weather conditions in different cities.
- **Temperature Unit Toggle**: Switch between Celsius and Fahrenheit.
- **Pagination**: Navigate through multiple pages of weather data.
- **Rainy Days Filter**: Filter forecast data to show only rainy days.
- **Chatbot**: Ask weather-related questions and receive responses via a chatbot.
- **Responsive Design**: Optimized for both desktop and mobile devices.

## Technologies Used
- HTML
- CSS
- JavaScript
- OpenWeather API
- Gemini API

## Getting Started
Follow the instructions below to run the project locally on your machine.

### Prerequisites
Make sure you have the following installed:
- [Visual Studio Code](https://code.visualstudio.com/) (or any code editor of your choice)
- [Node.js](https://nodejs.org/) (optional, for development purposes)
- A web browser (Chrome, Firefox, etc.)

### Installation Steps
1. **Clone the Repository**
   Open your terminal and run the following command to clone the repository:

   git clone <repository-url>


   Replace `<repository-url>` with the URL of your repository.

2. **Navigate to the Project Directory**

   Change into the project directory:

   cd weather-dashboard


3. **Set Up API Keys**
   - Sign up for an account on [OpenWeather](https://openweathermap.org/) to get your API key.
   - Sign up for an account on [Google Cloud](https://cloud.google.com/) to obtain your Gemini API key.
   - Replace the placeholder API keys in `tables.js` with your actual keys:

   const API_KEY = 'your-openweather-api-key';
   const GEMINI_API_KEY = 'your-gemini-api-key';


4. **Open the Project in Visual Studio Code**
   Open Visual Studio Code and use the "Open Folder" option to select your project directory.

5. **Open the HTML File**
   Locate and open the `index.html` file in your project.

6. **Run the Project**
   You can use the Live Server extension in Visual Studio Code to run the project:

   - Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) if you haven’t already.
   - Right-click on the `index.html` file and select **"Open with Live Server"**.

   Your default web browser should open and display the Weather Dashboard.

## Usage
1. Enter a city name in the search bar and click the **Search** button to fetch the weather data.
2. Use the pagination controls to navigate through multiple pages of forecast data.
3. Toggle between Celsius and Fahrenheit to switch temperature units.
4. Click on **Filter Rainy Days** to show only days with rain in the forecast.
5. Interact with the chatbot by typing questions in the chat input box and pressing **Enter** or clicking the **Send** button.

## Contributing
Contributions are welcome! If you would like to contribute to this project, please fork the repository and submit a pull request with your changes.

