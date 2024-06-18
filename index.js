const fs = require('fs').promises;
const xml2js = require('xml2js');
const mysql = require('mysql2/promise');
const path = require('path');

// Set up MySQL connection
const dbConfig = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'sa_analyze'
};

const feedsPath = getFeedsPath();

// Main function
processXmlFiles();

function getFeedsPath() {
  if (process.argv.length < 3) {
    console.error('Please provide a path as an argument.');
    process.exit(1);
  }

  return process.argv[2];
}

// Function to get XML files in ascending order
async function getXmlFilesOrdered(feedsPath) {
  try {
    const files = await fs.readdir(feedsPath);
    const xmlFiles = files
      .filter(file => path.extname(file).toLowerCase() === '.xml')
      .sort((a, b) => a.localeCompare(b)); // Sort files by name ascending
    return xmlFiles;
  } catch (err) {
    throw new Error('Error reading directory: ' + err);
  }
}

async function processFile(db, file) {
	// Set up XML parser
  const parser = new xml2js.Parser();

  try {
    const data = await fs.readFile(path.join(feedsPath, file));
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
					 id: parseInt(review['$'].id),
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

		// console.log('Data extracted.');
		await storeData(db, merchantsData, 'merchants');
		await storeData(db, reviewsData, 'reviews');
		await storeData(db, delMerchantsData, 'deleted_merchants');
		await storeData(db, delReviewsData, 'deleted_reviews');
	} catch (parseErr) {
		console.error('Error reading XML data:', parseErr);
	}
}

// Store data in MySQL database
async function storeData(db, data, table) {
	data.forEach(async (merchantData) => {
		try {
			await db.query(`INSERT INTO ${table} SET ?`, merchantData)
		} catch (err) {
			if (err.code !== 'ER_DUP_ENTRY') {
				console.error(err);
			}
		}
	})
	// console.log(`Data stored to ${table} table successfully!`);
}

// Example usage: Get sorted XML files and process each one
async function processXmlFiles() {
  try {
		const db = await mysql.createConnection(dbConfig);
		console.log('Connected to MySQL database');

    const xmlFiles = await getXmlFilesOrdered(feedsPath);
    console.log('XML files to process:', xmlFiles.length);

    // Process each XML file
    for (const file of xmlFiles) {
      await processFile(db, file);
			console.log('Finished processing:', file);
    }

		await db.end();
		console.log('DB connection is closed.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}
