# Lab 3 — Debugging Exercises

**Course:** Backend Development Fundamentals (Year II)
**Student:** J Harshini
**Faculty:** Joel Prashanth D

This document explains four common debugging exercises from the faculty instructions. Each section shows the **broken code**, explains **why the error occurs**, and gives the **correct solution** with corrected code.

> **Note:** These are teaching examples only. The actual working project (`app.js`, `server.js`) is correct and has **not** been intentionally broken.

General viva tip: when something fails, first read the **last line of the error message**, then check these four areas in order — port, path, table, `await`.

---

## Exercise 1 — EADDRINUSE: Port Already in Use

### Example of the broken situation

You start the server once (`npm start`), then — without stopping it — open a second terminal and run `npm start` again. Or you run the server while Postman / another app is already using port 3000.

### Why the error occurs

```text
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1865:18)
    at listenInCluster (node:net:1922:12)
```

A port number can only be used by **one** listening program at a time. When the first server is running, it "owns" port 3000. The second server tries to listen on the same port, the operating system refuses, and Node crashes with an `EADDRINUSE` error. It is the network equivalent of two people trying to sit in the same chair.

### Correct solution

Stop the old server first (press `Ctrl + C` in the terminal where it is running), or change the port.

**Option A — stop the old process (recommended):**

Press `Ctrl + C` in the terminal that is running the server. If that does not work because the terminal is closed, find and kill the process:

```bash
# Windows PowerShell / Command Prompt — see what is using port 3000
netstat -ano | findstr :3000
# The last column is the PID. Kill it:
taskkill /PID <PID> /F
```

**Option B — run this project on a different port:**

On Windows (PowerShell):

```bash
$env:PORT=3001; npm start
```

On Windows (Command Prompt) or macOS / Linux:

```bash
PORT=3001 npm start
```

### Corrected code / how the project already handles it

In `app.js` the port is read from an environment variable with a safe default — this is exactly what makes Option B possible and is also how Render deploys the app:

```javascript
// process.env.PORT lets the hosting platform choose the port.
// On our own machine we fall back to 3000.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`);
});
```

**Rule:** before running `npm start`, make sure no other copy of the server is already running.

---

## Exercise 2 — Wrong Import Path (`Cannot find module`)

### Example of the broken code

In `server.js` the require path is typed incorrectly:

```javascript
// BROKEN — file ./app.js exists, but "./apps" does not
const { initializeDBAndServer } = require("./apps");

initializeDBAndServer();
```

Running `node server.js` gives:

```text
Error: Cannot find module './apps'
Require stack:
- C:\...\lab-03\server.js
```

Other common typos of the same kind: `require("./App")` (wrong case), `require("app")` (missing `./`, so Node looks inside `node_modules` instead of the current folder), or `require("../app")` (points one folder too high).

### Why the error occurs

Node.js resolves the string passed to `require()` as a **file path**. The `.` at the start means "relative to this file's folder"; `./app` looks for a file named `app.js` in the same folder. If the name (or its spelling/case) does not match an actual file, Node cannot find the module and the program never starts.

### Correct solution

Use the exact file name, with the `./` prefix for files in the same folder:

```javascript
// CORRECT — matches the actual file name app.js
const { initializeDBAndServer } = require("./app");

initializeDBAndServer();
```

Checklist for viva: (1) does `./` come first for a local file? (2) does the spelling and capitalisation match the file on disk exactly? (3) is the file really in the same folder as the file doing the requiring?

---

## Exercise 3 — SQLite Error: `no such table: book`

### Example of the broken situation

The database file was deleted or recreated empty, or the app was pointed at a **fresh** database file before the table was created. The application code itself is unchanged:

```javascript
const books = await db.all(`SELECT * FROM book;`);
```

Running the server and calling `GET /books/` produces:

```text
Error: no such table: book
```

By default SQLite creates an empty database file the first time you connect to it. An empty file has **no tables**, so any query against `book` fails with `no such table`.

### Why the error occurs

SQLite does not create your tables for you. The table must be created first using the DDL (Data Definition Language) statements in `init_db.sql`. If those statements have never run against the database file the app is using, the table simply does not exist — no matter how correct the SELECT query is.

### Correct solution

Run the initialization script **once** against the database file:

1. Open the SQLite CLI for this project's database:

```bash
sqlite3 database.db
```

2. Run `init_db.sql`:

```sql
.read init_db.sql
```

3. Verify the table exists and contains the 10 sample records:

```sql
.tables
SELECT * FROM book;
```

4. Exit the CLI with `.exit`, then start the server normally:

```bash
npm start
```

If `sqlite3` is not installed, the same SQL can be executed from a short Node script using `db.exec(...)` with the contents of `init_db.sql`.

### Corrected code (`init_db.sql` used by this project)

```sql
-- Drop and recreate so re-running this script always gives a clean database
DROP TABLE IF EXISTS book;

CREATE TABLE book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    price REAL,
    pages INTEGER
);
```

> **Important:** `init_db.sql` drops and recreates the table. That is safe for a fresh setup, but it would delete existing data — never re-run it casually on a database you care about. Lab 3's database is a separate file (`lab-03/database.db`), so Lab 2's data is never affected.

---

## Exercise 4 — Missing `await` in an Asynchronous Operation

### Example of the broken code

```javascript
app.get("/books/", async (req, res) => {
  try {
    // BROKEN - no await: db.all() returns a Promise, not the rows
    const books = db.all(`SELECT * FROM book;`);
    res.json(books);   // res.json() receives a pending Promise
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
```

### Why the error occurs

Database calls such as `db.all()`, `db.get()` and `db.run()` in the `sqlite` library are **asynchronous**: they do not return the result immediately. They return a **Promise** — an object representing "the answer will come later".

Without `await`, `books` holds the Promise object, not an array of books. Serializing a Promise to JSON gives `{}` (or an empty response), so the client never sees the real data. Worse, the logic "runs ahead" of the database: later code executes before the query finishes, and any error from the query escapes the `try/catch` block entirely (because the `catch` can only catch errors from code that is properly awaited), making the real failure silent and confusing to debug.

### Correct solution

Add `await` before every asynchronous database call inside an `async` function:

```javascript
app.get("/books/", async (req, res) => {
  try {
    // CORRECT - await pauses this function until the query finishes,
    // and books is now the actual array of rows
    const books = await db.all(`SELECT * FROM book;`);
    res.json(books);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});
```

In this project every database call is correctly awaited, for example in the POST route:

```javascript
const result = await db.run(addBookQuery, [title.trim(), author.trim(), priceValue, pagesValue]);
return res.status(201).json({ message: "Book created successfully", bookId: result.lastID });
```

Note that `result.lastID` only has the right value because `await` waited for the INSERT to finish first — without it, `lastID` could be `undefined` and the API would return no `bookId`.

**Rule of thumb for viva:** if a function is declared `async`, every database (or network) call inside it that produces a value you need must be preceded by `await`.

---

## Quick-Reference Summary

| Error | Typical message | One-line fix |
|---|---|---|
| EADDRINUSE | `listen EADDRINUSE: address already in use :::3000` | Stop the other server, or use a different `PORT` |
| Wrong import path | `Cannot find module './apps'` | Use `require("./app")` with the exact file name |
| No such table | `no such table: book` | Run `init_db.sql` once against `database.db` |
| Missing `await` | Empty/`{}` response, errors not caught | Add `await` before async DB calls in `async` functions |
