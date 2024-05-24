const mysql = require('mysql2');


// Set up MySQL connection
const dbConfig = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'sa_analyze'
};

const db = mysql.createConnection(dbConfig);

// Connect to MySQL
db.connect((err) => {
	if (err) throw err;
	console.log('Connected to MySQL database');
});

db.query(`DELETE FROM shopper_approved_feed;`, (err) => {
	if (err) {
		console.error(err);
	} else {
		console.log('shopper_approved_feed table is cleared!');
	}
});

db.end();
console.log('DB connection is closed.');