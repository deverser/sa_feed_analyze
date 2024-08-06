require('dotenv').config();
const mysql = require('mysql2');

// Set up MySQL connection using environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const db = mysql.createConnection(dbConfig);

const renameReviewsTable = `
  RENAME TABLE reviews TO old_reviews;
`;

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    merchant_id INT NOT NULL,
    sj_id INT DEFAULT NULL,
    rating INT,
    author_name VARCHAR(100),
    content TEXT,
    collection_method VARCHAR(30),
    review_date DATE,
    removed INT DEFAULT 0
  );
`;

function queryDatabase(query, callback) {
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error:', err);
      db.end();
    } else {
      callback(results);
    }
  });
}

function updateOrCreateReviewsTable() {
  // Check if the reviews table exists
  queryDatabase('SHOW TABLES LIKE "reviews";', (results) => {
    if (results.length > 0) {
      // Rename the existing reviews table
      queryDatabase(renameReviewsTable, () => {
        console.log('Existing reviews table renamed to old_reviews.');
        // Create the new reviews table
        createNewReviewsTable();
      });
    } else {
      // Create the reviews table as it does not exist
      createNewReviewsTable();
    }
  });
}

function createNewReviewsTable() {
  queryDatabase(createTableQuery, () => {
    console.log('New reviews table created or already exists.');
    db.end();
  });
}

// Execute the function to update or create the reviews table
updateOrCreateReviewsTable();
