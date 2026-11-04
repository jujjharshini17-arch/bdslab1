// =============================================================================
// Course: Backend Development Fundamentals (Year II)
// Lab 3: REST API, Query Parameters, Validation and Debugging
// Student: J Harshini
// Faculty: Joel Prashanth D
// File: app.js
// Description: Express application setup, SQLite connection, 5 CRUD routes
//              with query-parameter support (search, sort, paginate, filter)
//              and request-body validation.
// =============================================================================

// Step 1: Import required modules using CommonJS (require) syntax
const express = require("express");
const fs = require("fs");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

// Step 2: Initialize the Express application
const app = express();

// Step 3: Middleware to parse incoming JSON request bodies
app.use(express.json());
// Pretty-print JSON in the browser/Postman so responses are easy to read
app.set("json spaces", 2);

// Step 4: Path to THIS LAB's own SQLite database file (independent from Lab 2)
const dbPath = path.join(__dirname, "database.db");

// One reusable database connection, shared by all routes
let db = null;

// =============================================================================
// Database & Server Initialization
// =============================================================================
// The database is opened BEFORE the Express server starts listening.
// If the connection fails, we stop the program instead of serving broken APIs.
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // If this Lab 3 database is empty (no book table yet), create it
    // from init_db.sql. This keeps the project independent from Lab 2
    // and also works on first run / Render.
    const bookTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'book';"
    );
    if (!bookTable) {
      const initSql = fs.readFileSync(path.join(__dirname, "init_db.sql"), "utf8");
      await db.exec(initSql);
      console.log("Created the book table from init_db.sql (10 sample books).");
    }

    console.log("Connected to SQLite database successfully!");

    // process.env.PORT lets Render (and any host) choose the port for us.
    // On our own machine, we default to 3000.
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
// Validation helpers
// =============================================================================

// Columns the user is allowed to sort by.
// IMPORTANT for viva: column names CANNOT be sent as parameterized values
// (the ? placeholders only work for data). So we keep an allow-list and only
// ever put a value from THIS list into the ORDER BY clause. Any other
// order_by value is rejected with 400 before the SQL is even built.
const ALLOWED_ORDER_COLUMNS = ["id", "title", "author", "price", "pages"];

// Checks a POST/PUT request body.
// Returns an error message string when invalid, or null when it is valid.
// Rules (Lab 3): title required, author required, price must be numeric.
// pages is optional, but when given it must be a non-negative integer.
const validateBookBody = (body) => {
  if (!body || typeof body !== "object") {
    return "Request body is required";
  }

  const { title, author, price, pages } = body;

  if (typeof title !== "string" || title.trim() === "") {
    return "title is required";
  }

  if (typeof author !== "string" || author.trim() === "") {
    return "author is required";
  }

  // price must be present and numeric. Note: Number("") is 0 and
  // Number(true) is 1, so empty strings and booleans are rejected explicitly.
  if (
    price === undefined ||
    price === null ||
    price === "" ||
    typeof price === "boolean" ||
    Number.isNaN(Number(price))
  ) {
    return "price must be a number";
  }

  if (Number(price) < 0) {
    return "price must not be negative";
  }

  if (
    pages !== undefined &&
    pages !== null &&
    (typeof pages === "boolean" ||
      Number.isNaN(Number(pages)) ||
      !Number.isInteger(Number(pages)) ||
      Number(pages) < 0)
  ) {
    return "pages must be a non-negative integer";
  }

  return null;
};

// =============================================================================
// API Routes
// =============================================================================

// Root route: welcome message + a hint of the supported endpoints/parameters
app.get("/", (req, res) => {
  res.status(200).json({
    message:
      "Welcome to Backend Development Fundamentals - Lab 3: REST API, Query Parameters, Validation and Debugging",
    student: "J Harshini",
    endpoints: {
      getAllBooks: "GET /books/",
      getOneBook: "GET /books/:bookId/",
      addBook: "POST /books/",
      updateBook: "PUT /books/:bookId/",
      deleteBook: "DELETE /books/:bookId/",
    },
    queryParameters: {
      search_q: "partial book-title search, e.g. /books/?search_q=harry",
      order_by: "one of: id, title, author, price, pages (default: id)",
      order: "ASC or DESC (default: ASC)",
      limit: "positive integer (default: 10)",
      offset: "non-negative integer (default: 0)",
      min_price: "minimum price filter (optional)",
      max_price: "maximum price filter (optional)",
    },
  });
});

// -----------------------------------------------------------------------------
// Route 1: GET /books/
// Retrieve books, with optional search, sorting, pagination and price filtering.
//
// Example:
//   GET /books/?search_q=harry&order_by=price&order=ASC&limit=5&offset=0&min_price=100&max_price=700
// -----------------------------------------------------------------------------
app.get("/books/", async (req, res) => {
  try {
    const { search_q, order_by, order, limit, offset, min_price, max_price } =
      req.query;

    // ---- Validate order_by and order (the only values placed directly in SQL,
    // because placeholders cannot represent column names / ASC / DESC) ----
    const orderBy = order_by !== undefined ? order_by : "id";
    if (!ALLOWED_ORDER_COLUMNS.includes(orderBy)) {
      return res.status(400).json({
        message:
          "Invalid order_by column. Allowed columns: id, title, author, price, pages",
      });
    }

    const orderDir = (order !== undefined ? String(order) : "ASC").toUpperCase();
    if (orderDir !== "ASC" && orderDir !== "DESC") {
      return res.status(400).json({
        message: "Invalid order. Allowed values: ASC, DESC",
      });
    }

    // ---- Validate limit and offset (both must be integers) ----
    const limitValue = limit !== undefined ? Number(limit) : 10;
    if (!Number.isInteger(limitValue) || limitValue <= 0) {
      return res.status(400).json({
        message: "Invalid limit. Limit must be a positive integer",
      });
    }

    const offsetValue = offset !== undefined ? Number(offset) : 0;
    if (!Number.isInteger(offsetValue) || offsetValue < 0) {
      return res.status(400).json({
        message: "Invalid offset. Offset must be a non-negative integer",
      });
    }

    // ---- Validate price filters (each one is optional on its own) ----
    let minPrice = null;
    let maxPrice = null;

    if (min_price !== undefined) {
      if (String(min_price).trim() === "" || Number.isNaN(Number(min_price))) {
        return res
          .status(400)
          .json({ message: "Invalid min_price. It must be a number" });
      }
      minPrice = Number(min_price);
    }

    if (max_price !== undefined) {
      if (String(max_price).trim() === "" || Number.isNaN(Number(max_price))) {
        return res
          .status(400)
          .json({ message: "Invalid max_price. It must be a number" });
      }
      maxPrice = Number(max_price);
    }

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return res.status(400).json({
        message: "Invalid price range. min_price cannot be greater than max_price",
      });
    }

    // ---- Build the WHERE clause dynamically, but keep every user VALUE as a
    // parameterized (?) placeholder so nothing user-typed is concatenated
    // into the SQL text (this is what prevents SQL injection). ----
    const conditions = [];
    const values = [];

    // A. Search: partial match on the title using SQL LIKE
    if (search_q !== undefined && String(search_q) !== "") {
      conditions.push("title LIKE ?");
      values.push(`%${search_q}%`); // % = matches any text before/after
    }

    // D. Price filtering: BETWEEN when both bounds exist, otherwise a single
    //    bound (>= or <=) so each filter works independently.
    if (minPrice !== null && maxPrice !== null) {
      conditions.push("price BETWEEN ? AND ?");
      values.push(minPrice, maxPrice);
    } else if (minPrice !== null) {
      conditions.push("price >= ?");
      values.push(minPrice);
    } else if (maxPrice !== null) {
      conditions.push("price <= ?");
      values.push(maxPrice);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // B. Sorting (orderBy/orderDir are already allow-list validated above)
    // C. Pagination (limit/offset values are passed as parameters too)
    const getBooksQuery = `
      SELECT * FROM book
      ${whereClause}
      ORDER BY ${orderBy} ${orderDir}
      LIMIT ? OFFSET ?;
    `;
    values.push(limitValue, offsetValue);

    // db.all() returns an array of all matching rows
    const books = await db.all(getBooksQuery, values);
    return res.status(200).json(books);
  } catch (error) {
    // Log the real error on the server; never leak database details to clients
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// -----------------------------------------------------------------------------
// Route 2: GET /books/:bookId/
// Retrieve one book using its ID
// -----------------------------------------------------------------------------
app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    // Parameterized query with ? placeholder to prevent SQL injection
    const getBookQuery = `SELECT * FROM book WHERE id = ?;`;
    const book = await db.get(getBookQuery, [bookId]); // single row, or undefined

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json(book);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// -----------------------------------------------------------------------------
// Route 3: POST /books/
// Insert a new book. Validates title, author and a numeric price first.
// -----------------------------------------------------------------------------
app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body || {};

    // Validate BEFORE touching the database - invalid data is never inserted
    const validationError = validateBookBody(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const priceValue = Number(price);
    const pagesValue =
      pages === undefined || pages === null ? null : Number(pages);

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;

    // db.run() executes queries that modify data (INSERT, UPDATE, DELETE)
    const result = await db.run(addBookQuery, [
      title.trim(),
      author.trim(),
      priceValue,
      pagesValue,
    ]);

    return res.status(201).json({
      message: "Book created successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// -----------------------------------------------------------------------------
// Route 4: PUT /books/:bookId/
// Update an existing book. Same validation as POST (pages optional; when
// omitted, the existing page count is kept).
// -----------------------------------------------------------------------------
app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body || {};

    // First confirm the book exists
    const existingBook = await db.get(
      `SELECT * FROM book WHERE id = ?;`,
      [bookId]
    );
    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Then validate the new values
    const validationError = validateBookBody(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const priceValue = Number(price);
    const pagesValue =
      pages === undefined || pages === null
        ? existingBook.pages
        : Number(pages);

    const updateBookQuery = `
      UPDATE book
      SET title = ?, author = ?, price = ?, pages = ?
      WHERE id = ?;
    `;

    await db.run(updateBookQuery, [
      title.trim(),
      author.trim(),
      priceValue,
      pagesValue,
      bookId,
    ]);

    return res.status(200).json({ message: "Book updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// -----------------------------------------------------------------------------
// Route 5: DELETE /books/:bookId/
// Delete a book using its ID
// -----------------------------------------------------------------------------
app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    // First confirm the book exists
    const existingBook = await db.get(
      `SELECT * FROM book WHERE id = ?;`,
      [bookId]
    );
    if (!existingBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    await db.run(`DELETE FROM book WHERE id = ?;`, [bookId]);

    return res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Catch-all route for undefined URLs
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

// Export the app and the startup function (server.js uses these)
module.exports = { app, initializeDBAndServer };
