// This file should be used before the first run of the app. It sets up all neccessary tables for shopper approved feeds in db by one click.

const mysql = require('mysql2');


// Set up MySQL connection
const dbConfig = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'sa_analyze'
};

const db = mysql.createConnection(dbConfig);

const shopperApprovedFeed = `CREATE TABLE sa_merchants_feed(
	id INT AUTO_INCREMENT,
	merchant_id INT,
	name VARCHAR(100),
	merchant_url VARCHAR(200),
	rating_url VARCHAR(200),
	merchant_rating FLOAT(2),
	review_count INT,
	removed BOOL,
	create_timestamp TIMESTAMP,
	last_update_timestamp TIMESTAMP,
	PRIMARY KEY(id)
);`;

const saReviewsFeed = `CREATE TABLE sa_reviews_feed( 
	id INT AUTO_INCREMENT, 
	review_id INT, 
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
	removed BOOL,
	PRIMARY KEY(id) 
);`;

const deletedMerchants = `CREATE TABLE deleted_merchants(
	id INT AUTO_INCREMENT,
	merchant_id INT,
	removed BOOL,
	last_update_timestamp TIMESTAMP,
	PRIMARY KEY(id)
)`;

const deletedReviews = `CREATE TABLE deleted_reviews(
	id INT AUTO_INCREMENT,
	merchant_id INT,
	review_id INT,
	removed BOOL,
	last_update_timestamp TIMESTAMP,
	PRIMARY KEY(id)
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

setUpTable(shopperApprovedFeed);
setUpTable(saReviewsFeed);
setUpTable(deletedMerchants);
setUpTable(deletedReviews);
db.end();