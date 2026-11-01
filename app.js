// =============================================================================
// Backend Development Fundamentals - Lab 1
// File: app.js
// Purpose: Express Application definition and Route Configuration
// Student Name: J Harshini
// Section: 207 AI ML - 2B
// =============================================================================

// Step 1: Import the Express framework using CommonJS syntax
const express = require('express');

// Step 2: Initialize an Express application instance
const app = express();

// Middleware to parse incoming JSON requests (good practice for backend APIs)
app.use(express.json());

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

/**
 * Route 1: GET /
 * Purpose: Root endpoint that returns a friendly welcome message.
 * Response Method: res.status(200).send()
 */
app.get('/', (req, res) => {
    res.status(200).send('Welcome to Backend Development Fundamentals - Lab 1 Express Server!');
});

/**
 * Route 2: GET /about
 * Purpose: Returns student details in JSON format.
 * Response Method: res.status(200).json()
 */
app.get('/about', (req, res) => {
    res.status(200).json({
        name: 'J Harshini',
        section: '207 AI ML - 2B'
    });
});

/**
 * Route 3: GET /time
 * Purpose: Returns current date and time using JavaScript new Date().
 * Response Method: res.status(200).send()
 */
app.get('/time', (req, res) => {
    const currentDateTime = new Date();
    res.status(200).send(`Current Date and Time: ${currentDateTime.toString()}`);
});

/**
 * Route 4: Catch-all 404 Handler for Unknown Routes
 * Purpose: Handles all unknown/unmatched URLs and returns HTTP 404 status.
 * Response Method: res.status(404).send()
 */
app.use((req, res) => {
    res.status(404).send('404 Not Found: The requested URL was not found on this server.');
});

// Step 3: Export the Express application instance using CommonJS
module.exports = app;
