// =============================================================================
// Backend Development Fundamentals - Lab 1
// File: server.js
// Purpose: Entry point to start the Express Server
// Student Name: J Harshini
// Section: 207 AI ML - 2B
// =============================================================================

// Step 1: Import the configured Express app from app.js
const app = require('./app');

// Step 2: Define the port number (uses process.env.PORT on Render, or defaults to 3000 locally)
const PORT = process.env.PORT || 3000;

// Step 3: Start listening for incoming connections
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Express Server is running successfully!`);
    console.log(` Listening on: http://localhost:${PORT}`);
    console.log(` Endpoints available:`);
    console.log(`   - GET  http://localhost:${PORT}/`);
    console.log(`   - GET  http://localhost:${PORT}/about`);
    console.log(`   - GET  http://localhost:${PORT}/time`);
    console.log(`   - Any other route returns HTTP 404 Not Found`);
    console.log(`====================================================`);
});
