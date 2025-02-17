// This file should be used before the first run of the app. It sets up all neccessary tables for shopper approved feeds in db by one click.

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

const merchantsTable = `CREATE TABLE merchants(
	id INT,
	name VARCHAR(100),
	merchant_url VARCHAR(200),
	rating_url VARCHAR(200),
	merchant_rating FLOAT(2),
	review_count INT,
	create_timestamp TIMESTAMP,
	last_update_timestamp TIMESTAMP,
	PRIMARY KEY(id)
);`;

const reviewsTable = `CREATE TABLE reviews( 
	id INT, 
	merchant_id INT, 
	reviewer_name VARCHAR(50), 
	create_timestamp TIMESTAMP, 
	last_update_timestamp TIMESTAMP, 
	country_code CHAR(2), 
	content TEXT, 
	merchant_response TEXT, 
	ratings FLOAT(2), 
	collection_method VARCHAR(30), 
	verified_purchase BOOL, 
	PRIMARY KEY(id),
	FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);`;

const deletedMerchants = `CREATE TABLE deleted_merchants(
	merchant_id INT,
	last_update_timestamp TIMESTAMP,
	PRIMARY KEY(merchant_id)
)`;

const deletedReviews = `CREATE TABLE deleted_reviews(
	merchant_id INT,
	review_id INT,
	last_update_timestamp TIMESTAMP,
	PRIMARY KEY(review_id)
)`;

function setUpTable(tableConfig) {
	db.query(tableConfig, (err) => {
	if (err) {
		console.error(err);
	} else {
		console.log('Table is created');
	}
});
}

setUpTable(merchantsTable);
setUpTable(reviewsTable);
setUpTable(deletedMerchants);
setUpTable(deletedReviews);
db.end();