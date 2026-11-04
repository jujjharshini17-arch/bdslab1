# Lab 3 — REST API, Query Parameters, Validation and Debugging

## 1. Student Information

| Field | Details |
|---|---|
| Lab | Lab 3 — REST API, Query Parameters, Validation and Debugging |
| Student Name | J Harshini |
| Registration Number | *(to be filled by the student)* |
| Section | *(to be filled by the student)* |
| Course | Backend Development Fundamentals |
| University | Aurora Deemed to be University |
| Year | II – Term II |
| Faculty | Joel Prashanth D |
| GitHub Username | `jujjharshini17-arch` |
| Repository | [bdslab1](https://github.com/jujjharshini17-arch/bdslab1) |

## 2. Objective

To implement a RESTful API in Express.js and SQLite for a `books` resource and to practice:

1. Implementing the five HTTP CRUD operations (GET, GET by id, POST, PUT, DELETE) using REST conventions — nouns for resources, HTTP verbs for actions.
2. Supporting **query parameters** on `GET /books/` — search, sorting, pagination and price filtering.
3. Writing **parameterized SQL queries** so user input can never be interpreted as SQL (protection against SQL injection).
4. Validating request data and returning meaningful **HTTP status codes** with consistent JSON responses.
5. Debugging four common problems — `EADDRINUSE`, wrong import paths, `no such table` SQLite errors, and missing `await` (see `DEBUGGING.md`).

## 3. Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript server runtime |
| Express.js | Web framework for routing and middleware |
| SQLite (+ `sqlite` / `sqlite3` packages) | Lightweight file-based database |
| JavaScript (CommonJS) | Programming language (`require` / `module.exports`) |
| npm | Package manager |

## 4. Installation Instructions

**Prerequisites:** Node.js and npm installed. (The SQLite CLI is optional — see §6.)

1. Clone the repository and go into the Lab 3 folder:

   ```bash
   git clone https://github.com/jujjharshini17-arch/bdslab1.git
   cd bdslab1/lab-03
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. The first time the server starts, it creates `database.db` from `init_db.sql` if the `book` table is missing (10 sample books). If you delete the file or want a fresh copy, you can also run:

   ```bash
   sqlite3 database.db < init_db.sql
   ```

   Or, without the SQLite CLI, run this one-liner from the `lab-03` folder:

   ```bash
   node -e "const fs=require('fs');const{open}=require('sqlite');const sqlite3=require('sqlite3');(async()=>{const db=await open({filename:'database.db',driver:sqlite3.Database});await db.exec(fs.readFileSync('init_db.sql','utf8'));await db.close();console.log('Database initialized');})()"
   ```

4. The `screenshots/` folder is already present. Add your Postman screenshots there (see §14).

## 5. Commands to Run the Project

| Command | What it does |
|---|---|
| `npm start` | Starts the server (`node server.js`) |
| `npm run dev` | Starts the server with nodemon (auto-restarts on code change) |
| `npm test` | Runs the automated tests in `test_api.js` (server must be running) |

Then open:

- Welcome message / API summary: `http://localhost:3000/`
- All books: `http://localhost:3000/books/`

Stop the server with `Ctrl + C`.

## 6. How to Run the Tests

1. Start the server in one terminal:

   ```bash
   npm start
   ```

2. In a second terminal, run the tests:

   ```bash
   npm test
   ```

The test script (`test_api.js`, Node.js built-in `http` only) creates a **temporary book**, tests POST/PUT/DELETE against its real returned ID, **deletes it again**, and finishes by verifying that the original 10 sample records are still intact. Each check prints its expected status, actual status, and PASS/FAIL.

## 7. Environment Variables

| Variable | Required? | Default | Purpose |
|---|---|---|---|
| `PORT` | No | `3000` | Port the server listens on. Render (and other hosts) set this automatically. |

There are **no secrets** used in this project — the database is a local file. Never commit a real `.env` file; `.env` files are already listed in `.gitignore`.

## 8. Database Schema

The project uses its **own** SQLite database (`database.db`) — Lab 2's database is never used or modified.

```sql
CREATE TABLE book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    price REAL,
    pages INTEGER
);
```

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Generated automatically by SQLite |
| `title` | TEXT | Book title |
| `author` | TEXT | Author name |
| `price` | REAL | Price (decimal allowed) |
| `pages` | INTEGER | Number of pages |

The database is seeded with **10 sample books** (see `init_db.sql`), chosen so every query-parameter feature can be demonstrated: e.g. `search_q=harry` matches 2 titles, `min_price=100&max_price=700` matches 8 books, and `min_price=800` matches exactly 1 book.

## 9. API Endpoints

| # | Method | Endpoint | Description | Success Status |
|---|---|---|---|---|
| 1 | GET | `/books/` | Retrieve all books (supports query parameters — §10) | 200 |
| 2 | GET | `/books/:bookId/` | Retrieve one book by its ID | 200 |
| 3 | POST | `/books/` | Create a new book | 201 |
| 4 | PUT | `/books/:bookId/` | Update an existing book | 200 |
| 5 | DELETE | `/books/:bookId/` | Delete a book | 200 |
| — | GET | `/` | Welcome message with a summary of the endpoints | 200 |

Resource names are **nouns** (`books`) and the HTTP **method** itself expresses the action — this is the REST convention.

## 10. Query Parameters for `GET /books/`

| Parameter | Type | Default | Description | Example |
|---|---|---|---|---|
| `search_q` | string | — | Partial match on the book **title** using SQL `LIKE` (`%value%`) | `search_q=harry` |
| `order_by` | string | `id` | Column to sort by. Allowed: `id`, `title`, `author`, `price`, `pages` | `order_by=price` |
| `order` | string | `ASC` | Sort direction: `ASC` or `DESC` | `order=DESC` |
| `limit` | positive integer | `10` | Maximum number of books returned | `limit=5` |
| `offset` | non-negative integer | `0` | Number of books to skip (pagination) | `offset=5` |
| `min_price` | number | — | Only books priced **at or above** this value | `min_price=100` |
| `max_price` | number | — | Only books priced **at or below** this value | `max_price=700` |

Rules:

- When both `min_price` and `max_price` are given, the filter is `price BETWEEN min_price AND max_price`.
- Either price filter can be used **independently** (`price >=` or `price <=`).
- An **invalid** value (unknown `order_by` column, `order` other than `ASC`/`DESC`, non-integer/negative `limit`, negative `offset`, non-numeric price, or `min_price > max_price`) returns **400** with a clear message.
- All user **values** are passed to SQLite as parameterized (`?`) placeholders. `order_by`/`order` cannot be parameterized, so they are checked against an allow-list before being used in SQL.

**Combined example request:**

```http
GET /books/?search_q=harry&order_by=price&order=ASC&limit=5&offset=0&min_price=100&max_price=700
```

## 11. Sample Requests and Responses

### GET all books — `GET /books/?limit=2`

```json
[
  {
    "id": 1,
    "title": "Harry Potter and the Sorcerer's Stone",
    "author": "J.K. Rowling",
    "price": 650,
    "pages": 309
  },
  {
    "id": 2,
    "title": "Harry Potter and the Goblet of Fire",
    "author": "J.K. Rowling",
    "price": 750,
    "pages": 636
  }
]
```

### GET one book — `GET /books/1/`

```json
{
  "id": 1,
  "title": "Harry Potter and the Sorcerer's Stone",
  "author": "J.K. Rowling",
  "price": 650,
  "pages": 309
}
```

### POST a book — `POST /books/`

Request body:

```json
{
  "title": "Clean Architecture",
  "author": "Robert C. Martin",
  "price": 599,
  "pages": 350
}
```

Response (201):

```json
{
  "message": "Book created successfully",
  "bookId": 11
}
```

### PUT a book — `PUT /books/11/`

Request body:

```json
{
  "title": "Clean Architecture (Updated)",
  "author": "Robert C. Martin",
  "price": 649,
  "pages": 360
}
```

Response (200):

```json
{
  "message": "Book updated successfully"
}
```

### DELETE a book — `DELETE /books/11/`

```json
{
  "message": "Book deleted successfully"
}
```

### Error responses

- Not found (404): `{ "message": "Book not found" }`
- Validation failure (400): `{ "message": "title is required" }`
- Invalid query parameter (400): `{ "message": "Invalid order. Allowed values: ASC, DESC" }`

## 12. HTTP Status Codes Used

| Status | Meaning | When it is returned |
|---|---|---|
| 200 | OK | Successful GET, PUT and DELETE |
| 201 | Created | Successful POST (new book inserted) |
| 400 | Bad Request | Missing title/author, non-numeric price, invalid query parameters |
| 404 | Not Found | Book ID does not exist, or undefined URL |
| 500 | Internal Server Error | Unexpected server/database error (details stay in the server log, never in the response) |

## 13. Testing Instructions

The automated test script `test_api.js` covers 21 numbered checks (plus sub-checks):

**Success cases:** (1) GET all books, (2) GET one existing book, (3) POST a valid book, (4) GET the created book, (5) PUT the created book, (6) verify the update, (7) DELETE the created book, (8) verify the deleted book returns 404, (9) search with `search_q`, (10) sorting with `order_by`/`order` (ASC and DESC), (11) pagination with `limit`/`offset` (three pages), (12) price filtering with `min_price`/`max_price` (both bounds, and each bound alone).

**Failure cases:** (13) GET a nonexistent book → 404, (14) POST without title → 400, (15) POST without author → 400, (16) POST with a non-numeric price → 400, (17) PUT a nonexistent book → 404, (18) DELETE a nonexistent book → 404, (19) invalid sorting column → 400, (20) invalid sorting order → 400, (21) invalid pagination values (`limit=-5`, `limit=abc`, `offset=-1`, `limit=0`) → 400.

The script uses only the actual ID returned by POST for the PUT/DELETE checks, deletes its temporary record afterwards, and finally verifies that the 10 original sample records are intact.

## 14. Screenshots

Screenshots of the live API (Postman or browser) should be saved in the `screenshots/` folder with these names:

| Screenshot | File |
|---|---|
| GET all books | ![GET all books](screenshots/get_all_books.png) |
| GET single book | ![GET single book](screenshots/get_one_book.png) |
| POST successful creation | ![POST book](screenshots/post_book.png) |
| PUT successful update | ![PUT book](screenshots/put_book.png) |
| DELETE successful deletion | ![DELETE book](screenshots/delete_book.png) |
| Search result | ![Search result](screenshots/search_result.png) |
| Sorting result | ![Sorting result](screenshots/sorting_result.png) |
| Pagination result | ![Pagination result](screenshots/pagination_result.png) |
| Price filter result | ![Price filter result](screenshots/price_filter_result.png) |
| Validation error | ![Validation error](screenshots/validation_error.png) |
| 404 error | ![404 error](screenshots/not_found_404.png) |

**How to capture them (manually):**

1. Start the server: `npm start`.
2. Open **Postman** (or your browser for GET requests) and send each request:
   - `GET http://localhost:3000/books/` → save as `get_all_books.png`
   - `GET http://localhost:3000/books/1/` → save as `get_one_book.png`
   - `POST http://localhost:3000/books/` with the "Clean Architecture" JSON body above → save as `post_book.png` (note the returned `bookId`)
   - `PUT http://localhost:3000/books/<bookId>/` → save as `put_book.png`
   - `GET http://localhost:3000/books/?search_q=harry` → save as `search_result.png`
   - `GET http://localhost:3000/books/?order_by=price&order=DESC` → save as `sorting_result.png`
   - `GET http://localhost:3000/books/?limit=3&offset=3` → save as `pagination_result.png`
   - `GET http://localhost:3000/books/?min_price=100&max_price=700` → save as `price_filter_result.png`
   - `POST http://localhost:3000/books/` with an invalid body (e.g. no title) → save as `validation_error.png`
   - `GET http://localhost:3000/books/9999/` → save as `not_found_404.png`
   - `DELETE http://localhost:3000/books/<bookId>/` → save as `delete_book.png`
3. Take a screenshot of the request **and** the response body for each, and save it into `screenshots/` with the matching file name above.

## 15. Debugging Problems and Solutions

Full explanations, with broken code and corrected code, are documented in `DEBUGGING.md`. Quick summary:

| # | Problem | Symptoms | Solution |
|---|---|---|---|
| 1 | `EADDRINUSE` — port already in use | Server crashes on start: `address already in use :::3000` | Stop the other server running on that port (or use `PORT=3001`). |
| 2 | Wrong import path | `Cannot find module './apps'` | Use the exact file name: `require("./app")`. |
| 3 | SQLite `no such table` | `no such table: book` when querying | Run `init_db.sql` once against `database.db` to create the table. |
| 4 | Missing `await` | Empty/`{}` response, errors escape `try/catch` | Add `await` before async DB calls (`db.all`, `db.get`, `db.run`). |

## 16. Live Deployment URL

*(To be filled after deploying to Render — replace this placeholder with the public URL.)*

## 17. Viva Questions and Answers

**Q1. What is REST, and how does this API follow it?**
**A.** REST (Representational State Transfer) is an architectural style where resources are identified by nouns in the URL (`/books/`, `/books/:bookId/`) and the HTTP method expresses the action (GET = read, POST = create, PUT = update, DELETE = delete). Data is exchanged as JSON.

**Q2. What is the difference between PUT and PATCH?**
**A.** PUT replaces the whole resource representation, so the client sends all fields. PATCH applies a partial update. This project uses PUT: the client sends title, author and price, and `pages` (optional) — if `pages` is omitted the previously stored value is kept.

**Q3. What are query parameters and where do they come from?**
**A.** They are the `key=value` pairs after the `?` in a URL (e.g. `/books/?limit=5`). Express makes them available as `req.query`. They are used here to search, sort, paginate and filter without creating new endpoints.

**Q4. How does `search_q` implement a partial title search?**
**A.** The route adds a `title LIKE ?` condition and passes the parameter as `%search_q%`. The `%` wildcard matches any characters, so `harry` finds every title *containing* "harry" regardless of position or case (SQLite `LIKE` is case-insensitive for ASCII).

**Q5. Why can't `order_by` simply be passed as a `?` placeholder like the other values?**
**A.** Placeholders represent **data values**; `ORDER BY <column>` needs a **column name**, which is part of the SQL syntax itself and cannot be a parameter. That is why `order_by` is validated against an allow-list (`id, title, author, price, pages`) and `order` is restricted to `ASC`/`DESC` before the SQL string is assembled. Every other user value still goes through a placeholder.

**Q6. What is SQL injection, and how does this project prevent it?**
**A.** SQL injection is when an attacker types SQL code into an input field (e.g. `' OR 1=1 --`) so it executes as a command instead of data. This project never concatenates user input into SQL text — values are bound through `?` placeholders by the database driver, so they can only ever be treated as data.

**Q7. How do `limit` and `offset` implement pagination?**
**A.** `LIMIT n` returns at most `n` rows and `OFFSET m` skips the first `m` rows. Together they slice the full ordered result into pages: page 1 is `limit=3&offset=0`, page 2 is `limit=3&offset=3`, and so on.

**Q8. How does price filtering work when only one bound is provided?**
**A.** The route builds the condition dynamically: with both bounds it uses `price BETWEEN ? AND ?`; with only `min_price` it uses `price >= ?`; with only `max_price` it uses `price <= ?`. A `min_price` greater than `max_price` is rejected with 400.

**Q9. Why validate in the server instead of only in the client?**
**A.** Clients can be bypassed, so validation must happen again on the server. The server guarantees that only valid data (title, author, numeric price) ever reaches the database, and returns 400 with a human-readable message when it does not.

**Q10. What is the exact validation for POST, and what happens on failure?**
**A.** `title` and `author` must be non-empty strings, and `price` must be a number (there is more validation: price cannot be negative, and `pages`, when given, must be a non-negative integer). If any check fails, the server returns `400 {"message": "<reason>"}` and **no** database insert happens — the record is never created.

**Q11. When 200, 201 and 404 are used in this API?**
**A.** 200 for successful GET/PUT/DELETE, 201 only for a successful POST (a resource was created), and 404 when the requested book ID does not exist (or the URL itself is undefined — "Endpoint not found").

**Q12. Why is a 500 returned without database details?**
**A.** Error messages from SQLite can reveal table names or server structure, which is information an attacker can use. The server logs the real error (`console.error`) for debugging, but the client only receives a generic `{"message": "Internal Server Error"}`.

**Q13. How does the single reusable database connection work?**
**A.** `initializeDBAndServer()` opens the SQLite file **once** with `open(...)` and stores it in a module-level `db` variable. All routes share that object. If the connection fails, the process exits before the server ever starts listening, so routes can never run against a dead connection.

**Q14. What is the difference between `db.all()`, `db.get()` and `db.run()`?**
**A.** `db.all()` returns every matching row as an array (used by GET all), `db.get()` returns a single row or `undefined` (used by GET/PUT/DELETE by ID), and `db.run()` executes INSERT/UPDATE/DELETE and reports `lastID`/`changes` (used by POST/PUT/DELETE).

**Q15. What is an entry-point split between `app.js` and `server.js`?**
**A.** `app.js` builds the Express app, opens the database and defines every route, then exports `app` and `initializeDBAndServer`. `server.js` is a tiny file that only calls `initializeDBAndServer()` — this separation keeps the "what the API does" separate from "start the server", and makes the app easy to test or deploy.

**Q16. What is `EADDRINUSE`?**
**A.** "Address already in use" — the port is already occupied by another running process (usually a previous copy of the same server). Fix: stop that process with `Ctrl + C` (or kill its PID), or start this server on a different port via `PORT=3001 npm start` (details in `DEBUGGING.md`).

**Q17. What causes `no such table: book`?**
**A.** The database file exists but the `book` table was never created in it (SQLite creates an empty file lazily on first connection). Fix: run `init_db.sql` once against `database.db` so the table and its 10 sample rows exist.

**Q18. What does `await` do, and what happens without it?**
**A.** Database calls return a Promise ("the result will arrive later"). `await` pauses the function until the result arrives, so the next line sees the real data. Without it, the code keeps the Promise object itself (JSON `{}`, missing `bookId`), and errors from the query are no longer caught by `try/catch`.

**Q19. Why does the server read `process.env.PORT || 3000`?**
**A.** Hosting platforms like Render assign the port dynamically and pass it as the `PORT` environment variable. Using it when present — and defaulting to 3000 locally — makes the same code deployable without changes.

**Q20. How were the tests designed to keep the sample data safe?**
**A.** POST creates a temporary book and its real returned `bookId` is used for the PUT/DELETE checks; the script then deletes it. A final check confirms the 10 original sample records (ids 1–10) are untouched, and on failure an emergency cleanup deletes the temporary record.

## 18. Project Folder Structure

```text
lab-03/
├── app.js            # Express app + SQLite connection + all 5 CRUD routes
├── server.js         # Entry point: initializeDBAndServer()
├── package.json      # Scripts (start / dev / test) and dependencies
├── package-lock.json # Locked dependency versions
├── database.db       # This lab's own SQLite database (10 sample books)
├── init_db.sql       # Table + sample-data creation script
├── test_api.js       # Automated API tests (npm test)
├── DEBUGGING.md      # The four debugging exercises, explained
├── README.md         # This file
├── .gitignore        # Ignores node_modules/, .env, logs
└── screenshots/      # Postman/browser screenshots (see §14)
```
