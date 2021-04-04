DROP TABLE IF EXISTS location;

CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    search_query TEXT,
    formatted_query TEXT,
    latitude TEXT,
    longitude TEXT
);