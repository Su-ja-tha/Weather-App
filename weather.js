const cities = ["London", "Tokyo", "Melbourne", "New York", "Delhi"];

function getWeatherDescription(code) {
  const descriptions = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 51: "Light drizzle", 61: "Light rain", 80: "Rain showers"
  };
  return descriptions[code] || `Unknown weather (code ${code})`;
}

async function getWeather(city) {
  const resultDiv = document.getElementById("weatherResult");
  resultDiv.textContent = "🔄 Fetching weather...";

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    if (!geoRes.ok) throw new Error("Geolocation error");

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found.");
    }

    const { latitude, longitude, name: cityName } = geoData.results[0];

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    if (!weatherRes.ok) throw new Error("Weather API error");

    const weatherData = await weatherRes.json();
    const current = weatherData.current_weather;

    resultDiv.innerHTML = `
      <strong>${cityName}</strong><br>
      🌡️ ${current.temperature}°C<br>
      ☁️ ${getWeatherDescription(current.weathercode)}
    `;

  } catch (err) {
    resultDiv.textContent = `❌ ${err.message}`;
  }
}

document.getElementById("getWeatherBtn").addEventListener("click", () => {
  const city = document.getElementById("cityInput").value.trim();
  if (city) {
    getWeather(city);
  } else {
    document.getElementById("weatherResult").textContent = "⚠️ Please enter a city name.";
  }
});

async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch location for ${city}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error(`City not found: ${city}`);
  }

  const { latitude, longitude, name } = data.results[0];
  return { city: name, latitude, longitude };
}

async function getWeather({ city, latitude, longitude }) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch weather for ${city}`);

  const data = await res.json();
  const current = data.current_weather;
  if (!current) throw new Error(`Weather data not available for ${city}`);

  return {
    city,
    temperatureC: current.temperature,
    windSpeedKmh: current.windspeed, 
    description: getWeatherDescription(current.weathercode)
  };
}


// Main function triggered on button click
async function showWeather() {
  const resultDiv = document.getElementById("weatherResult");
  const cityInput = document.getElementById("cityInput");
  const city = cityInput.value.trim();
  
  if (!city) {
    resultDiv.textContent = "⚠️ Please enter a city name.";
    return;
  }
  
  resultDiv.textContent = "⏳ Fetching weather...";
  
  try {
    const coords = await getCoordinates(city);
    const weather = await getWeather(coords);
    resultDiv.innerHTML = `
      <strong>${weather.city}</strong><br>
      🌡️ Temperature: ${weather.temperatureC}°C<br>
      ☁️ Condition: ${weather.description}<br>
      💨 Wind Speed: ${weather.windSpeedKmh} km/h
    `;
    
  } catch (error) {
    resultDiv.textContent = `❌ Error: ${error.message}`;
  }
}

// Attach event listener after page loads
document.getElementById("getWeatherBtn").addEventListener("click", showWeather);
async function getWeatherForCities(cityList) {
  try {
    const locations = await Promise.all(cityList.map(getCoordinates));
    const weatherReports = await Promise.all(locations.map(getWeather));

    console.log("🌍 Weather for multiple cities:");
    weatherReports.forEach(report => {
      console.log(`${report.city}: ${report.temperatureC}°C, ${report.description}, Wind Speed: ${report.windSpeedKmh} km/h`);
    });

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

getWeatherForCities(cities);
