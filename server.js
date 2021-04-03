'use strict';

// load environment variables from the .env file
require('dotenv').config();

// application dependencies
const express = require('express');
const superagent = require('superagent');
const cors = require('cors');

// application setup
const PORT = process.env.PORT || 3000;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const WEATHER_CODE_API_KEY = process.env.WEATHER_CODE_API_KEY;
const PARKS_CODE_API_KEY = process.env.PARKS_CODE_API_KEY;
const app = express();
app.use(cors());

// routes
app.get('/location', handleLocationRequest);
app.get('/weather', handleWeatherRequest);
app.get('/parks', handleParksRequest);

// requests' handlers
function handleLocationRequest(req, res) {
    const searchQuery = req.query.city;
    const url = 'https://us1.locationiq.com/v1/search.php?';

    if (!searchQuery) {
        res.status(404).send('no search query was provided!');
    }

    const cityParam = {
        key: GEO_CODE_API_KEY,
        city: searchQuery,
        format: 'json'
    }

    superagent.get(url).query(cityParam).then((resData) => {
        const location = new Location(resData.body[0], searchQuery);
        res.status(200).send(location);
    }).catch((error) => {
        res.status(500).send('Sorry, something went wrong!');
    });
}

function handleWeatherRequest(req, res) {
    const searchQueryLat = req.query.lat;
    const searchQueryLon = req.query.lon;
    const url = 'https://api.weatherbit.io/v2.0/forecast/daily?'

    if (!searchQueryLat || !searchQueryLon) {
        res.status(404).send('no search query was provided!');
    }


    const weatherParam = {
        key: WEATHER_CODE_API_KEY,
        lat: searchQueryLat,
        lon: searchQueryLon
    }

    superagent.get(url).query(weatherParam).then(resData => {
        const weatherMap = resData.body.data.map((day) => {
            return new Weather(day);
        });
        res.status(200).send(weatherMap.slice(0, 8));
    }).catch((error) => {
        res.status(500).send('Sorry, something went wrong');
    });
}

function handleParksRequest(req, res) {
    const searchQuery = req.query.q;
    const url = 'https://developer.nps.gov/api/v1/parks?';

    if (!searchQuery) {
        res.status(404).send('no search query was provided!');
    }

    const parksParam = {
        api_key: PARKS_CODE_API_KEY,
        q: searchQuery,
        limit: 10,
    }

    superagent.get(url).query(parksParam).then(resData => {
        const tenParks = resData.body.data.map((park) => {
            return new Park(park);
        });
        res.status(200).send(tenParks);
    }).catch((error) => {
        res.status(500).send('Sorry, something went wrong!');
    });

}

// constructor functions
function Location(rawData, searchQuery) {
    this.search_query = searchQuery;
    this.formatted_query = rawData.display_name;
    this.latitude = rawData.lat;
    this.longitude = rawData.lon;
}

function Weather(rawData) {
    this.forecast = rawData.weather.description;
    this.time = rawData.datetime;
}

function Park(parkData) {
    this.name = parkData.fullName;
    this.address = parkData.addresses[0].postalCode + " " + parkData.addresses[0].line1 + ", " + parkData.addresses[0].city + ", " + parkData.addresses[0].stateCode;
    this.fee = this.fee || "0.00";
    this.description = parkData.description;
    this.url = parkData.url;
}
app.listen(PORT, () => console.log(`listening to port ${PORT}`));