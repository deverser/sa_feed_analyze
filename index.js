const fs = require('fs');
const xml2js = require('xml2js');
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


// Set up XML parser
const parser = new xml2js.Parser();

// Read XML file
const xmlFile = 'feeds/20201103-0_2-21101.xml';
fs.readFile(xmlFile, (err, data) => {
	if (err) {
		console.error('Error opening file:', err);
		return;
	}

	// Parse XML data
	parser.parseString(data, (err, result) => {
		if (err) {
			console.error('Error reading XML data:', err);
			return;
		}

		// Extract relevant data from XML
		const dataToStore = [];
		
		result.feed.merchants[0]['merchant'].forEach((merchant) => {
			const shopperApprovedFeed = {
				merchant_id: merchant['$']['id'],
				name: merchant.name[0],
				merchant_url: merchant.merchant_url[0],
				rating_url: merchant.rating_url[0],
				merchant_rating: parseFloat(merchant.merchant_rating),
				review_count: parseInt(merchant.review_count, 10),
				create_timestamp: new Date(merchant.create_timestamp[0]),
				last_update_timestamp: new Date(merchant.last_update_timestamp[0]),
			};
			console.log('SA_feed:', shopperApprovedFeed);
			dataToStore.push(shopperApprovedFeed);
		 });
		console.log('Data extracted.');
		// Store data in MySQL database
		dataToStore.forEach((merchantData) => {
			db.query(`INSERT INTO shopper_approved_feed SET ?`, merchantData, (err, results) => {
				if (err) {
					console.error(err);
				} else {
					return;
				}
			});
		})
		console.log('Data stored successfully!');
 	});
 });