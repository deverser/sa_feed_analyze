const mysql = require('mysql2');


// Set up MySQL connection
const dbConfig = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'sa_analyze'
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

cleanTable('shopper_approved_feed');
cleanTable('sa_reviews_feed');

db.end();
console.log('DB connection is closed.');