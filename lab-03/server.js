// =============================================================================
// Course: Backend Development Fundamentals (Year II)
// Lab 3: REST API, Query Parameters, Validation and Debugging
// Student: J Harshini
// Faculty: Joel Prashanth D
// File: server.js
// Description: Server entry point. Opens the database first, then starts
//              listening for HTTP requests. Run with: node server.js
// =============================================================================

// Import the startup function from app.js (the "./app" path must match the
// file name exactly - see DEBUGGING.md Exercise 2)
const { initializeDBAndServer } = require("./app");

// Open the SQLite database, then start the Express server
initializeDBAndServer();
