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

app.listen(PORT, () => console.log(`listening to port ${PORT}`));