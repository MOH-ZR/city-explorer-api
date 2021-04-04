'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');

// Application Setup
const PORT = process.env.PORT;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

const app = express();
app.use(cors());

// Database Connection Setup
const client = new pg.Client({
    connectionString: DATABASE_URL,
    // ssl: {
    //     rejectUnauthorized: false
    // }
});

// routes
app.get('/location', handleLocationRequest);
app.get('/', (request, response) => { response.status(200).send('ok'); });


function handleLocationRequest(req, res) {
    const cityName = req.query.city;
    const url = 'https://us1.locationiq.com/v1/search.php?';
    if (!cityName) {
        res.status(404).send('no search query was provided');
    }

    // check if the city is exist in the city database
    const safeValues = [cityName];
    const sqlQuery = `SELECT * FROM location WHERE search_query=$1`;

    // query the database
    client.query(sqlQuery, safeValues).then(result => {
        if (result.rows.length === 0) {
            throw error;
        }
        res.status(200).json(result.rows[0]);
    }).catch((error) => {
        const cityQueryParam = {
            key: GEO_CODE_API_KEY,
            city: cityName,
            format: 'json'
        };

        superagent.get(url).query(cityQueryParam).then(resData => {
            const location = new Location(resData.body[0], cityName);
            const safeValues = [cityName, location.formatted_query, location.latitude, location.longitude];
            const sqlQuery = `INSERT INTO location(search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)`;
            client.query(sqlQuery, safeValues);

            res.status(200).send(location);
        }).catch((error) => {
            res.status(500).send('Sorry, something went wrong');
        });
    });

}

// constructors
function Location(data, query) {
    this.search_query = query;
    this.formatted_query = data.display_name;
    this.latitude = data.lat;
    this.longitude = data.lon;
}

// Connect to DB and Start the Web Server
client.connect().then(() => {
    app.listen(PORT, () => {
        console.log("Connected to database:", client.connectionParameters.database) //show what database we connected to
        console.log('Server up on', PORT);
    });
})