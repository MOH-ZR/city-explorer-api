'use strict';

require('dotenv').config();

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const cors = require('cors');

// Load the Environment Variables 
const PORT = process.env.PORT;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY;
const MOVIE_CODE_API_KEY = process.env.MOVIE_CODE_API_KEY;
const YELP_CODE_API_KEY = process.env.YELP_CODE_API_KEY;
const ENV = process.env.ENV;
const DATABASE_URL = process.env.DATABASE_URL;

const app = express();
app.use(cors());

// Database Connection Setup
let client;
let div = '';
div = ENV;
if (div == 'div') {
    client = new pg.Client({
        connectionString: DATABASE_URL,
    });
} else {
    client['ssl'] = { rejectUnauthorized: false };
}

// routes
app.get('/', (request, response) => { response.status(200).send('ok'); });
// app.get('/location', handleLocationRequest);
app.get('/movies', handleMoviesRequest);
app.get('/yelp', handleYelpRequest);



function handleMoviesRequest(req, res) {
    const searchQuery = req.query.location;
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_CODE_API_KEY}&query=${searchQuery}&page=3&sort_by=popularity.desc&include_adult=false`;

    if (!searchQuery) {
        res.status(404).send('no search query was provided');
    }

    superagent.get(url).then(resData => {
        const moviesData = resData.body.results.map(movie => {
            return new Movie(movie);
        });
        res.status(200).send(moviesData);
    }).catch(error => {
        res.status(500).send('Error!');
    });
}

function handleYelpRequest(req, res) {
    const searchQuery = req.query.location;
    const offset = req.query.page * 5 - 5;
    const url = `https://api.yelp.com/v3/businesses/search?term=restaurants&location=${searchQuery}&limit=5&offset=${offset}`;

    if (!searchQuery) {
        res.status(404).send('no search query was provided');
    }

    superagent.get(url).set(`Authorization`, `Bearer ${YELP_CODE_API_KEY}`).then(resData => {
        const yelpData = resData.body.businesses.map(business => {
            return new Yelp(business);
        });
        res.status(200).send(yelpData);
    }).catch(error => {
        res.status(500).send('Error, No data!');
    });
}

function Movie(data) {
    this.title = data.title;
    this.overview = data.overview;
    this.average_votes = data.vote_average;
    this.total_votes = data.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500/${data.poster_path}`;
    this.popularity = data.popularity;
    this.released_on = data.release_date;
}

function Yelp(data) {
    this.name = data.name;
    this.image_url = data.image_url;
    this.price = data.price;
    this.rating = data.rating;
    this.url = data.url;
}
// Connect to DB and Start the Web Server
client.connect().then(() => {
        app.listen(PORT, () => {
            console.log("Connected to database:", client.connectionParameters.database) //show what database we connected to
            console.log('Server up on', PORT);
        });
    })
    // // constructors
    // function Location(data, query) {
    //     this.search_query = query;
    //     this.formatted_query = data.display_name;
    //     this.latitude = data.lat;
    //     this.longitude = data.lon;
    // }
    // function handleLocationRequest(req, res) {
    //     const cityName = req.query.city;
    //     const url = 'https://us1.locationiq.com/v1/search.php?';
    //     if (!cityName) {
    //         res.status(404).send('no search query was provided');
    //     }

//     // check if the city is exist in the city database
//     const safeValues = [cityName];
//     const sqlQuery = `SELECT * FROM location WHERE search_query=$1`;

//     // query the database
//     client.query(sqlQuery, safeValues).then(result => {
//         if (result.rows.length === 0) {
//             throw error;
//         }
//         res.status(200).json(result.rows[0]);
//     }).catch((error) => {
//         const cityQueryParam = {
//             key: GEO_CODE_API_KEY,
//             city: cityName,
//             format: 'json'
//         };

//         superagent.get(url).query(cityQueryParam).then(resData => {
//             const location = new Location(resData.body[0], cityName);
//             const safeValues = [cityName, location.formatted_query, location.latitude, location.longitude];
//             const sqlQuery = `INSERT INTO location(search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4)`;
//             client.query(sqlQuery, safeValues);

//             res.status(200).send(location);
//         }).catch((error) => {
//             res.status(500).send('Sorry, something went wrong');
//         });
//     });

// }