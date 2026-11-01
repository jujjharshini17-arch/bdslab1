-- =============================================================================
-- Backend Development Fundamentals - Lab 2
-- Database Initialization Script
-- Table: book
-- =============================================================================

-- Step 1: Drop table if it already exists (ensures a clean setup)
DROP TABLE IF EXISTS book;

-- Step 2: Create the 'book' table with exact columns specified in lab instructions
CREATE TABLE book (
    id INTEGER PRIMARY KEY,
    title TEXT,
    author TEXT,
    price INTEGER,
    pages INTEGER
);

-- Step 3: Insert 10 sample book records using SQLite CLI
INSERT INTO book (id, title, author, price, pages) VALUES
(1, 'The Great Gatsby', 'F. Scott Fitzgerald', 399, 180),
(2, 'To Kill a Mockingbird', 'Harper Lee', 499, 281),
(3, '1984', 'George Orwell', 299, 328),
(4, 'Pride and Prejudice', 'Jane Austen', 250, 279),
(5, 'The Catcher in the Rye', 'J.D. Salinger', 350, 214),
(6, 'The Hobbit', 'J.R.R. Tolkien', 599, 310),
(7, 'Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling', 650, 309),
(8, 'The Alchemist', 'Paulo Coelho', 299, 208),
(9, 'Clean Code', 'Robert C. Martin', 899, 464),
(10, 'Atomic Habits', 'James Clear', 450, 320);
