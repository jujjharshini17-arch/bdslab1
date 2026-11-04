// =============================================================================
// Course: Backend Development Fundamentals (Year II)
// Lab 3: REST API, Query Parameters, Validation and Debugging
// Student: J Harshini
// Faculty: Joel Prashanth D
// File: test_api.js
// Description: Automated tests for all five CRUD endpoints plus every query
//              parameter, written with Node.js built-in http module only.
//              Run with: npm test   (server must already be running)
// =============================================================================

const http = require("http");

const HOSTNAME = "localhost";
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------------
// Helper: make one HTTP request and return { statusCode, body }
// ------------------------------------------------------------------
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsedBody;
        try {
          parsedBody = JSON.parse(data);
        } catch (e) {
          parsedBody = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsedBody });
      });
    });

    // A stuck request should fail the test, not hang it forever
    req.setTimeout(10000, () => {
      req.destroy(new Error("Request timed out"));
    });

    req.on("error", reject);

    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

// ------------------------------------------------------------------
// Test bookkeeping: count pass/fail and stop on the first failure so
// we never claim success that did not actually happen.
// ------------------------------------------------------------------
let passed = 0;
let failed = 0;

function check(testNumber, description, condition, details = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  | ${details}`);
  } else {
    failed++;
    console.log(`  FAIL  | ${details}`);
    throw new Error(`Test ${testNumber} (${description}) failed`);
  }
}

function report(testNumber, description, statusCode, expectedStatus, body) {
  console.log(`\n=== Test ${testNumber}: ${description} ===`);
  console.log(`  Expected HTTP status: ${expectedStatus}`);
  console.log(`  Actual HTTP status:   ${statusCode}`);
  console.log(`  Response: ${JSON.stringify(body, null, 2)}`);
}

async function runTests() {
  console.log("=== LAB 3 API TESTS ===");
  console.log(`Testing server at http://${HOSTNAME}:${PORT} (start it with: npm start)`);

  let createdBookId = null;

  try {
    // --------------------------------------------------------------
    // SUCCESS CASES
    // --------------------------------------------------------------

    // 1. GET all books ---------------------------------------------
    let res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/", method: "GET" });
    report(1, "GET all books (default pagination: limit 10, offset 0)", res.statusCode, 200, res.body);
    check(1, "GET all books", res.statusCode === 200 && Array.isArray(res.body) && res.body.length === 10,
      `expected 200 with 10 books, got status ${res.statusCode}, ${Array.isArray(res.body) ? res.body.length : "non-array"} books`);

    // 2. GET one existing book -------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/1/", method: "GET" });
    report(2, "GET one existing book (/books/1/)", res.statusCode, 200, res.body);
    check(2, "GET one book", res.statusCode === 200 && res.body && res.body.id === 1 && typeof res.body.title === "string",
      `got status ${res.statusCode}, title "${res.body && res.body.title}"`);

    // 3. POST a valid book ------------------------------------------
    const newBook = { title: "Clean Architecture", author: "Robert C. Martin", price: 599, pages: 350 };
    res = await makeRequest(
      { hostname: HOSTNAME, port: PORT, path: "/books/", method: "POST", headers: { "Content-Type": "application/json" } },
      newBook
    );
    report(3, "POST a valid book", res.statusCode, 201, res.body);
    check(3, "POST book", res.statusCode === 201 && Number.isInteger(res.body && res.body.bookId),
      `got status ${res.statusCode}, bookId ${res.body && res.body.bookId}`);
    createdBookId = res.body.bookId; // remember the real ID for the next tests

    // 4. GET the created book --------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: `/books/${createdBookId}/`, method: "GET" });
    report(4, "GET the created book", res.statusCode, 200, res.body);
    check(4, "GET created book", res.statusCode === 200 && res.body.id === createdBookId &&
      res.body.title === newBook.title && res.body.author === newBook.author &&
      Number(res.body.price) === newBook.price && res.body.pages === newBook.pages,
      `got status ${res.statusCode}, title "${res.body && res.body.title}"`);

    // 5. PUT the created book ---------------------------------------
    const updatedBook = { title: "Clean Architecture (Lab 3 Test Edition)", author: "Robert C. Martin", price: 649, pages: 360 };
    res = await makeRequest(
      { hostname: HOSTNAME, port: PORT, path: `/books/${createdBookId}/`, method: "PUT", headers: { "Content-Type": "application/json" } },
      updatedBook
    );
    report(5, "PUT (update) the created book", res.statusCode, 200, res.body);
    check(5, "PUT book", res.statusCode === 200, `got status ${res.statusCode}`);

    // 6. Verify the updated book ------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: `/books/${createdBookId}/`, method: "GET" });
    report(6, "Verify the updated book", res.statusCode, 200, res.body);
    check(6, "Verify update", res.statusCode === 200 && res.body.title === updatedBook.title &&
      Number(res.body.price) === updatedBook.price && res.body.pages === updatedBook.pages,
      `got status ${res.statusCode}, title "${res.body && res.body.title}", price ${res.body && res.body.price}`);

    // 7. DELETE the created book ------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: `/books/${createdBookId}/`, method: "DELETE" });
    report(7, "DELETE the created book", res.statusCode, 200, res.body);
    check(7, "DELETE book", res.statusCode === 200, `got status ${res.statusCode}`);

    // 8. Verify the deleted book returns 404 ------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: `/books/${createdBookId}/`, method: "GET" });
    report(8, "Verify deleted book returns 404", res.statusCode, 404, res.body);
    check(8, "Verify deletion", res.statusCode === 404, `got status ${res.statusCode}`);

    // 9. Search using search_q ---------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?search_q=harry", method: "GET" });
    report(9, "Search using search_q=harry", res.statusCode, 200, res.body);
    check(9, "search_q", res.statusCode === 200 && Array.isArray(res.body) && res.body.length === 2 &&
      res.body.every((b) => b.title.toLowerCase().includes("harry")),
      `expected 2 harry books, got ${res.body && res.body.length}`);

    // 10. Sort using order_by and order ------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?order_by=price&order=ASC&limit=10", method: "GET" });
    report(10, "Sort using order_by=price&order=ASC", res.statusCode, 200, res.body);
    const pricesAsc = Array.isArray(res.body) ? res.body.map((b) => Number(b.price)) : [];
    const isAscending = pricesAsc.every((p, i) => i === 0 || p >= pricesAsc[i - 1]);
    check(10, "sorting ASC", res.statusCode === 200 && pricesAsc.length === 10 && isAscending,
      `prices in response: [${pricesAsc.join(", ")}]`);

    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?order_by=price&order=DESC&limit=10", method: "GET" });
    report("10b", "Sort using order_by=price&order=DESC", res.statusCode, 200, res.body);
    const pricesDesc = Array.isArray(res.body) ? res.body.map((b) => Number(b.price)) : [];
    const isDescending = pricesDesc.every((p, i) => i === 0 || p <= pricesDesc[i - 1]);
    check("10b", "sorting DESC", res.statusCode === 200 && pricesDesc.length === 10 && isDescending,
      `prices in response: [${pricesDesc.join(", ")}]`);

    // 11. Pagination using limit and offset ---------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?limit=3&offset=0", method: "GET" });
    report(11, "Pagination: limit=3&offset=0", res.statusCode, 200, res.body);
    check(11, "pagination page 1", res.statusCode === 200 && Array.isArray(res.body) && res.body.length === 3 &&
      res.body[0].id === 1 && res.body[2].id === 3,
      `got ${res.body && res.body.length} books, first id ${res.body && res.body[0] && res.body[0].id}`);

    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?limit=3&offset=3", method: "GET" });
    report("11b", "Pagination: limit=3&offset=3", res.statusCode, 200, res.body);
    check("11b", "pagination page 2", res.statusCode === 200 && Array.isArray(res.body) && res.body.length === 3 &&
      res.body[0].id === 4 && res.body[2].id === 6,
      `got ${res.body && res.body.length} books, first id ${res.body && res.body[0] && res.body[0].id}`);

    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?limit=3&offset=8", method: "GET" });
    report("11c", "Pagination: limit=3&offset=8 (last page has 2 books)", res.statusCode, 200, res.body);
    check("11c", "pagination last page", res.statusCode === 200 && Array.isArray(res.body) && res.body.length === 2,
      `got ${res.body && res.body.length} books`);

    // 12. Price filtering with min_price and max_price ---------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?min_price=100&max_price=700&limit=10", method: "GET" });
    report(12, "Price filter: min_price=100&max_price=700", res.statusCode, 200, res.body);
    check(12, "price range BETWEEN", res.statusCode === 200 && Array.isArray(res.body) && res.body.length === 8 &&
      res.body.every((b) => Number(b.price) >= 100 && Number(b.price) <= 700),
      `expected 8 books priced 100-700, got ${res.body && res.body.length}`);

    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?min_price=800&limit=10", method: "GET" });
    report("12b", "Price filter: min_price only (800)", res.statusCode, 200, res.body);
    check("12b", "min_price only", res.statusCode === 200 && Array.isArray(res.body) && res.body.length === 1 &&
      Number(res.body[0].price) === 899,
      `expected 1 book (Clean Code, 899), got ${res.body && res.body.length}`);

    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?max_price=300&limit=10", method: "GET" });
    report("12c", "Price filter: max_price only (300)", res.statusCode, 200, res.body);
    check("12c", "max_price only", res.statusCode === 200 && Array.isArray(res.body) && res.body.length === 2 &&
      res.body.every((b) => Number(b.price) <= 300),
      `expected 2 books priced <= 300, got ${res.body && res.body.length}`);

    // --------------------------------------------------------------
    // FAILURE CASES
    // --------------------------------------------------------------

    // 13. GET a nonexistent book --------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/9999/", method: "GET" });
    report(13, "GET a nonexistent book (404)", res.statusCode, 404, res.body);
    check(13, "GET nonexistent", res.statusCode === 404, `got status ${res.statusCode}`);

    // 14. POST without title -------------------------------------------
    res = await makeRequest(
      { hostname: HOSTNAME, port: PORT, path: "/books/", method: "POST", headers: { "Content-Type": "application/json" } },
      { author: "No Title Author", price: 100, pages: 100 }
    );
    report(14, "POST without title (400)", res.statusCode, 400, res.body);
    check(14, "POST without title", res.statusCode === 400, `got status ${res.statusCode}`);

    // 15. POST without author ------------------------------------------
    res = await makeRequest(
      { hostname: HOSTNAME, port: PORT, path: "/books/", method: "POST", headers: { "Content-Type": "application/json" } },
      { title: "No Author Book", price: 100, pages: 100 }
    );
    report(15, "POST without author (400)", res.statusCode, 400, res.body);
    check(15, "POST without author", res.statusCode === 400, `got status ${res.statusCode}`);

    // 16. POST with a non-numeric price --------------------------------
    res = await makeRequest(
      { hostname: HOSTNAME, port: PORT, path: "/books/", method: "POST", headers: { "Content-Type": "application/json" } },
      { title: "Bad Price Book", author: "Someone", price: "five hundred", pages: 100 }
    );
    report(16, "POST with a non-numeric price (400)", res.statusCode, 400, res.body);
    check(16, "POST non-numeric price", res.statusCode === 400, `got status ${res.statusCode}`);

    // 17. PUT a nonexistent book ----------------------------------------
    res = await makeRequest(
      { hostname: HOSTNAME, port: PORT, path: "/books/9999/", method: "PUT", headers: { "Content-Type": "application/json" } },
      newBook
    );
    report(17, "PUT a nonexistent book (404)", res.statusCode, 404, res.body);
    check(17, "PUT nonexistent", res.statusCode === 404, `got status ${res.statusCode}`);

    // 18. DELETE a nonexistent book -------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/9999/", method: "DELETE" });
    report(18, "DELETE a nonexistent book (404)", res.statusCode, 404, res.body);
    check(18, "DELETE nonexistent", res.statusCode === 404, `got status ${res.statusCode}`);

    // 19. Invalid sorting column ------------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?order_by=publisher", method: "GET" });
    report(19, "Invalid sorting column order_by=publisher (400)", res.statusCode, 400, res.body);
    check(19, "invalid order_by", res.statusCode === 400, `got status ${res.statusCode}`);

    // 20. Invalid sorting order --------------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?order_by=price&order=UPWARDS", method: "GET" });
    report(20, "Invalid sorting order order=UPWARDS (400)", res.statusCode, 400, res.body);
    check(20, "invalid order", res.statusCode === 400, `got status ${res.statusCode}`);

    // 21. Invalid pagination values ------------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?limit=-5", method: "GET" });
    report(21, "Invalid pagination limit=-5 (400)", res.statusCode, 400, res.body);
    check(21, "invalid limit (-5)", res.statusCode === 400, `got status ${res.statusCode}`);

    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?limit=abc", method: "GET" });
    report("21b", "Invalid pagination limit=abc (400)", res.statusCode, 400, res.body);
    check("21b", "invalid limit (abc)", res.statusCode === 400, `got status ${res.statusCode}`);

    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?offset=-1", method: "GET" });
    report("21c", "Invalid pagination offset=-1 (400)", res.statusCode, 400, res.body);
    check("21c", "invalid offset (-1)", res.statusCode === 400, `got status ${res.statusCode}`);

    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?limit=0", method: "GET" });
    report("21d", "Invalid pagination limit=0 (400)", res.statusCode, 400, res.body);
    check("21d", "invalid limit (0)", res.statusCode === 400, `got status ${res.statusCode}`);

    // --------------------------------------------------------------
    // Original sample records must still be intact -------------------
    // --------------------------------------------------------------
    res = await makeRequest({ hostname: HOSTNAME, port: PORT, path: "/books/?limit=50", method: "GET" });
    report("FINAL", "Verify the 10 original sample records are intact", res.statusCode, 200, res.body);
    const originalBooks = [
      [1, "Harry Potter and the Sorcerer's Stone", "J.K. Rowling", 650, 309],
      [2, "Harry Potter and the Goblet of Fire", "J.K. Rowling", 750, 636],
      [3, "The Hobbit", "J.R.R. Tolkien", 599, 310],
      [4, "Clean Architecture", "Robert C. Martin", 599, 432],
      [5, "Clean Code", "Robert C. Martin", 899, 464],
      [6, "Atomic Habits", "James Clear", 450, 320],
      [7, "1984", "George Orwell", 299, 328],
      [8, "The Great Gatsby", "F. Scott Fitzgerald", 399, 180],
      [9, "To Kill a Mockingbird", "Harper Lee", 499, 281],
      [10, "Pride and Prejudice", "Jane Austen", 250, 279],
    ];
    const samplesAreUnchanged = Array.isArray(res.body) &&
      res.body.length === originalBooks.length &&
      res.body.every((book, index) => {
        const [id, title, author, price, pages] = originalBooks[index];
        return book.id === id && book.title === title && book.author === author &&
          Number(book.price) === price && book.pages === pages;
      });
    check("FINAL", "original records intact", res.statusCode === 200 && samplesAreUnchanged,
      `expected all 10 original books unchanged, got ${res.body && res.body.length} books`);

    // --------------------------------------------------------------
    // Summary --------------------------------------------------------
    // --------------------------------------------------------------
    console.log("\n========================================");
    console.log(`Total checks passed: ${passed}`);
    console.log(`Total checks failed: ${failed}`);
    console.log("========================================");
    console.log("ALL TESTS PASSED");
  } catch (error) {
    // Emergency cleanup: if a failure happened mid-way, remove the
    // temporary book so the database is left exactly as it started.
    if (createdBookId) {
      try {
        await makeRequest({ hostname: HOSTNAME, port: PORT, path: `/books/${createdBookId}/`, method: "DELETE" });
        console.log(`Cleaned up temporary book id ${createdBookId} after failed test`);
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError.message);
      }
    }
    console.error(`\nTest run failed: ${error.message}`);
    console.error(`Passed so far: ${passed}, failed: ${failed}`);
    process.exitCode = 1;
  }
}

runTests();
