// =============================================================================
// Backend Development Fundamentals - Lab 1
// File: http-server.js
// Purpose: Basic HTTP server built using Node.js built-in 'http' module
// Student Name: J Harshini
// Section: 207 AI ML - 2B
// =============================================================================

// Step 1: Import Node's built-in 'http' module using CommonJS require syntax
const http = require('http');

// Step 2: Define the port number on which the server will listen
const PORT = 3000;

// Step 3: Create the HTTP server using http.createServer()
// The callback function receives two objects:
// - req (request): contains information about the incoming client request
// - res (response): used to send back data and headers to the client
const server = http.createServer((req, res) => {
    // Set the HTTP response status code to 200 (OK) and header content-type to text/plain
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    // Send the response body "Hello" and end the response stream
    res.end('Hello');
});

// Step 4: Start the server and listen for incoming HTTP requests on port 3000
server.listen(PORT, () => {
    console.log(`Node.js HTTP Server is running at http://localhost:${PORT}`);
});
