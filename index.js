const fs = require('fs');
const xml2js = require('xml2js');
const mysql = require('mysql2/promise');

// Set up MySQL connection
const dbConfig = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'sa_analyze'
};

// List of XML filenames located in 'feeds/' directory.
const xmlFile = [	'20190101-0_2-25321.xml',
				 	'20201003-0_2-12954.xml',
				 	'20201103-0_2-21101.xml'
				 								];

async function main(file) {
	const db = await mysql.createConnection(dbConfig);

	console.log('Connected to MySQL database');

	// Set up XML parser
	const parser = new xml2js.Parser();

	// Read XML file
	fs.readFile('feeds/' + file, async (err, data) => {
		if (err) {
			console.error('Error opening file:', err);
			return;
		}

		// Parse XML data
		try {
			const result = await parser.parseStringPromise(data);

		// Extract relevant data from XML
		const merchantsData = [];
		if (typeof (result.feed.merchants[0]['merchant']) == 'object') {
			result.feed.merchants[0]['merchant'].forEach((merchant) => {
				const merchantsSaFeed = {
					id: parseInt(merchant['$']['id']),
					name: merchant.name[0],
					merchant_url: merchant.merchant_url[0],
					rating_url: merchant.rating_url[0],
					merchant_rating: parseFloat(merchant.merchant_rating),
					review_count: parseInt(merchant.review_count, 10),
					create_timestamp: new Date(merchant.create_timestamp[0]),
					last_update_timestamp: new Date(merchant.last_update_timestamp[0]),
				};
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
					 country_code: review.country_code[0],
					 content: review.content[0],
					 merchant_response: review.merchant_response[0],
					 ratings: ratings,
					 collection_method: review.collection_method[0],
					 verified_purchase: parseInt(review.verified_purchase[0])
				 };
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
				};
				//console.log('del_review', delReviewsFeed);
				delReviewsData.push(delReviewsFeed);
			});
		}

		console.log('Data extracted.');
		await storeData(db, merchantsData, 'merchants');
		await storeData(db, reviewsData, 'reviews');
		await storeData(db, delMerchantsData, 'deleted_merchants');
		await storeData(db, delReviewsData, 'deleted_reviews');
	} catch (parseErr) {
		console.error('Error reading XML data:', parseErr);
	}
	await db.end();
	console.log('DB connection is closed.');
 });
}

// Store data in MySQL database
 async function storeData(db, data, table) {
	 data.forEach(async (merchantData) => {
	            try {
					await db.query(`INSERT INTO ${table} SET ?`, merchantData)
				} catch (err) {
							console.error(err);
					}
	 })
	console.log(`Data stored to ${table} table successfully!`);
 }



 xmlFile.forEach((file) => main(file).catch(err => {
	console.error('Error in main function:', err);
 }));
