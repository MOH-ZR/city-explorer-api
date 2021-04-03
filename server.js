'use strict';

// load environment variables from the .env file
require('dotenv').config();

// application dependencies
const express = require('express');
const cors = require('cors');

// application setup
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

// routes
app.get('/location', handleLocationRequest); // (http://localhost:3000/location?city=lynnwood) try this to work correctly
app.get('/weather', handleWeatherRequest); // (http://localhost:3000/weather?city=seattle) try this to work correctly


const errorMsg = {
    status: 500,
    responseText: "Sorry, something went wrong!",
}

// requests' handlers
function handleLocationRequest(req, res) {
    const searchQuery = req.query.city;
    const locationRawData = require('./data/location.json');
    const location = new Location(locationRawData[0]);

    if (searchQuery.toLowerCase() === location.search_query) {
        res.status(200).send(location);
    } else {
        res.send(errorMsg);
    }
}

function handleWeatherRequest(req, res) {
    const searchQuery = req.query.city;

    if (searchQuery.toLowerCase() === 'seattle') {
        const weatherRawData = require('./data/weather.json');
        const weatherPredictions = weatherRawData.data.map((dayWeather) => {
            const weather = new Weather(dayWeather);
            return weather;
        });
        res.status(200).send(weatherPredictions);
    } else {
        res.send(errorMsg);
    }
}

// constructor functions
function Location(rawData) {
    this.search_query = rawData.display_name.split(',')[0].toLowerCase();
    this.formatted_query = rawData.display_name;
    this.latitude = rawData.lat;
    this.longitude = rawData.lon;
}

function Weather(rawData) {
    this.forecast = rawData.weather.description;
    this.time = rawData.datetime;
}

app.listen(PORT, () => console.log(`listening to port ${PORT}`));