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

function cleanTable(tableName) {
	db.query(`DELETE FROM ${tableName};`, (err) => {
		if (err) {
			console.error(err);
		} else {
			console.log(`${tableName} table is cleared!`);
		}
	});
}

// Connect to MySQL
db.connect((err) => {
	if (err) throw err;
	console.log('Connected to MySQL database');
});

cleanTable('merchants');
cleanTable('reviews');
cleanTable('deleted_merchants');
cleanTable('deleted_reviews');

db.end();
console.log('DB connection is closed.');