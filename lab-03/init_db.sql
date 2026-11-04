-- =============================================================================
-- Backend Development Fundamentals - Lab 3
-- Database Initialization Script
-- Table: book (this is Lab 3's OWN database - independent from Lab 2)
-- =============================================================================

-- Step 1: Drop the table if it already exists (ensures a clean setup)
DROP TABLE IF EXISTS book;

-- Step 2: Create the 'book' table exactly as specified in the Lab 3 instructions
CREATE TABLE book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    author TEXT,
    price REAL,
    pages INTEGER
);

-- Step 3: Insert 10 sample book records, chosen so that every query-parameter
-- feature can be tested easily:
--   * search_q "harry"  -> 2 matches (ids 1 and 2)
--   * search_q "clean"  -> 2 matches (ids 4 and 5)
--   * price range 100..700 -> 8 books (ids 1, 3, 4, 6, 7, 8, 9, 10)
--   * sorting by price / title / author gives clearly different orders
INSERT INTO book (title, author, price, pages) VALUES
('Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', 650, 309),
('Harry Potter and the Goblet of Fire', 'J.K. Rowling', 750, 636),
('The Hobbit', 'J.R.R. Tolkien', 599, 310),
('Clean Architecture', 'Robert C. Martin', 599, 432),
('Clean Code', 'Robert C. Martin', 899, 464),
('Atomic Habits', 'James Clear', 450, 320),
('1984', 'George Orwell', 299, 328),
('The Great Gatsby', 'F. Scott Fitzgerald', 399, 180),
('To Kill a Mockingbird', 'Harper Lee', 499, 281),
('Pride and Prejudice', 'Jane Austen', 250, 279);
