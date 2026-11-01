// =============================================================================
// Course: Backend Development Fundamentals (Year II)
// Lab 2: SQLite Database and CRUD Routes
// Student: J Harshini
// Section: 207 AI ML - 2B
// File: app.js
// Description: Express application setup, database connection, and CRUD routes
// =============================================================================

// Step 1: Import required modules using CommonJS (require) syntax
const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

// Step 2: Initialize Express application
const app = express();

// Step 3: Middleware to parse incoming JSON request bodies
app.use(express.json());

// Step 4: Define path to the SQLite database file
const dbPath = path.join(__dirname, "database.db");

// Database instance variable
let db = null;

// =============================================================================
// Database & Server Initialization
// =============================================================================
const initializeDBAndServer = async () => {
  try {
    // Open connection to the SQLite database file
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log("Connected to SQLite database successfully!");

    // Set port dynamically for local execution (3000) or Render cloud deployment
    const PORT = process.env.PORT || 3000;

    const server = app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}/`);
    });

    return server;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// =============================================================================
// API Routes
// =============================================================================

// Root route: Welcome message & list of available API endpoints
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Backend Development Fundamentals - Lab 2: SQLite Database and CRUD Routes API",
    student: "J Harshini",
    section: "207 AI ML - 2B",
    endpoints: {
      getAllBooks: "GET /books/",
      getOneBook: "GET /books/:bookId/",
      addBook: "POST /books/",
      updateBook: "PUT /books/:bookId/",
      deleteBook: "DELETE /books/:bookId/",
    },
  });
});

// -----------------------------------------------------------------------------
// Route 1: GET /books/
// Retrieve all books from the database
// -----------------------------------------------------------------------------
app.get("/books/", async (req, res) => {
  try {
    const getBooksQuery = `
      SELECT
        *
      FROM
        book
      ORDER BY
        id ASC;
    `;
    // db.all() returns an array of all matching rows
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// -----------------------------------------------------------------------------
// Route 2: GET /books/:bookId/
// Retrieve one book using its ID
// -----------------------------------------------------------------------------
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    // Use parameterized query with ? placeholder to prevent SQL injection
    const getBookQuery = `
      SELECT
        *
      FROM
        book
      WHERE
        id = ?;
    `;
    // db.get() returns a single row or undefined if not found
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// -----------------------------------------------------------------------------
// Route 3: POST /books/
// Insert a new book into the database
// -----------------------------------------------------------------------------
app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate request data
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: "Bad Request: title, author, price, and pages are required fields",
      });
    }

    // Parameterized SQL query with ? placeholders
    const addBookQuery = `
      INSERT INTO
        book (title, author, price, pages)
      VALUES
        (?, ?, ?, ?);
    `;

    // db.run() executes queries that modify data (INSERT, UPDATE, DELETE)
    const result = await db.run(addBookQuery, [title, author, price, pages]);

    res.status(201).json({
      message: "Book Added Successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// -----------------------------------------------------------------------------
// Route 4: PUT /books/:bookId/
// Update the details of an existing book
// -----------------------------------------------------------------------------
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    // Check if the book exists before updating
    const checkBookQuery = `
      SELECT
        *
      FROM
        book
      WHERE
        id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Validate request body
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: "Bad Request: title, author, price, and pages are required fields",
      });
    }

    // Parameterized UPDATE query
    const updateBookQuery = `
      UPDATE
        book
      SET
        title = ?,
        author = ?,
        price = ?,
        pages = ?
      WHERE
        id = ?;
    `;

    await db.run(updateBookQuery, [title, author, price, pages, bookId]);

    res.status(200).json({
      message: "Book Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// -----------------------------------------------------------------------------
// Route 5: DELETE /books/:bookId/
// Delete a book using its ID
// -----------------------------------------------------------------------------
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    // Check if the book exists before deleting
    const checkBookQuery = `
      SELECT
        *
      FROM
        book
      WHERE
        id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Parameterized DELETE query
    const deleteBookQuery = `
      DELETE FROM
        book
      WHERE
        id = ?;
    `;

    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({
      message: "Book Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Catch-all route for undefined URLs
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Export app and initialization function
module.exports = { app, initializeDBAndServer };
