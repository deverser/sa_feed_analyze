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
		const merchantsData = [];
		if (typeof (result.feed.merchants[0]['merchant']) == 'object') {
			result.feed.merchants[0]['merchant'].forEach((merchant) => {
				const merchantsSaFeed = {
					merchant_id: parseInt(merchant['$']['id']),
					name: merchant.name[0],
					merchant_url: merchant.merchant_url[0],
					rating_url: merchant.rating_url[0],
					merchant_rating: parseFloat(merchant.merchant_rating),
					review_count: parseInt(merchant.review_count, 10),
					removed: false,
					create_timestamp: new Date(merchant.create_timestamp[0]),
					last_update_timestamp: new Date(merchant.last_update_timestamp[0]),
				};
				result.feed.deleted_merchants[0]['deleted_merchant'].forEach((deleted) => {
					if (merchantsSaFeed.merchant_id === parseInt(deleted['$'].id)) {
						merchantsSaFeed.removed = true;
					}
				});
				//console.log('SA_feed:', merchantsSaFeed);
				merchantsData.push(merchantsSaFeed);
			});
		}

		const delMerchantsData = [];
		if (typeof (result.feed.deleted_merchants[0]['deleted_merchant']) == 'object') {
			result.feed.deleted_merchants[0]['deleted_merchant'].forEach((deleted) => {
				const delMerchantsFeed = {
					merchant_id: parseInt(deleted['$'].id),
					last_update_timestamp: new Date(deleted.last_update_timestamp[0]),
					removed: true,
				};
				//console.log('del_merchant', delMerchantsFeed);
				delMerchantsData.push(delMerchantsFeed);
			});
		}

		 const reviewsData = [];
		 if (typeof (result.feed.reviews[0]['review']) == 'object') {
			 result.feed.reviews[0]['review'].forEach((review) => {
				 let ratings;
				 if (review.ratings[0]['overall'][0]['_'] === undefined) {
					 ratings = null;
				 } else {
					 ratings = parseFloat(review.ratings[0]['overall'][0]['_']);
				 }
				 const reviewsSaFeed = {
					 review_id: parseInt(review['$'].id),
					 merchant_id: parseInt(review['$'].mid),
					 reviewer_name: review.reviewer_name[0],
					 create_timestamp: new Date(review.create_timestamp[0]),
					 last_update_timestamp: new Date(review.last_update_timestamp[0]),
					 removed: false,
					 country_code: review.country_code[0],
					 content: review.content[0],
					 merchant_response: review.merchant_response[0],
					 ratings: ratings,
					 collection_method: review.collection_method[0],
					 verified_purchase: parseInt(review.verified_purchase[0])
				 };
				 result.feed.deleted_merchants[0]['deleted_merchant'].forEach((deleted) => {
					 if (reviewsSaFeed.merchant_id === parseInt(deleted['$'].id)) {
						 reviewsSaFeed.removed = true;
					 }
				 });
				 reviewsData.push(reviewsSaFeed);
			 });
		 }
		//console.log('reviews: ', reviewsData);

		const delReviewsData = [];
		if (typeof(result.feed.deleted_reviews[0]['deleted_review']) == 'object') {
			result.feed.deleted_reviews[0]['deleted_review'].forEach((deleted) => {
				const delReviewsFeed = {
					merchant_id: parseInt(deleted['$'].mid),
					review_id: parseInt(deleted['$'].id),
					last_update_timestamp: new Date(deleted.last_update_timestamp[0]),
					removed: true,
				};
				//console.log('del_review', delReviewsFeed);
				delReviewsData.push(delReviewsFeed);
			});
		}

		console.log('Data extracted.');
		storeData(merchantsData, 'sa_merchants_feed');
		storeData(reviewsData, 'sa_reviews_feed');
		storeData(delMerchantsData, 'deleted_merchants');
		storeData(delReviewsData, 'deleted_reviews');
 	});
	db.end();
	console.log('DB connection is closed.');
 });

// Store data in MySQL database
 function storeData(data, table) {
	 data.forEach((merchantData) => {
		 db.query(`INSERT INTO ${table} SET ?`, merchantData, (err) => {
			 if (err) {
				 console.error(err);
			 }
		 });
	 });
	 console.log(`Data stored to ${table} table successfully!`);
 }
