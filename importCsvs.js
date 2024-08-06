require('dotenv').config();
const mysql = require('mysql2/promise');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Set up MySQL connection using environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Mapping CSV fields to DB fields
const fieldMapping = {
  Feedbackid: 'id',
  Siteid: 'merchant_id',
  Rating: 'rating',
  DisplayName: 'author_name',
  Comment: 'content',
  Fulfillment: 'collection_method',
  ReviewDate: 'review_date',
  Removed: 'removed'
};

// Variables to track the last successful import and counts
let lastFile = '';
let lastRow = 0;
let totalSkipped = 0; // Counter for skipped records
let totalProcessed = 0; // Counter for processed records

// Function to process a batch of records and insert or update them in the database
async function processBatch(records, connection) {
  if (records.length === 0) return;

  const queries = records.map(record => connection.execute(
    `INSERT INTO reviews (id, merchant_id, rating, author_name, content, collection_method, review_date, removed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      merchant_id = VALUES(merchant_id),
      rating = VALUES(rating),
      author_name = VALUES(author_name),
      content = VALUES(content),
      collection_method = VALUES(collection_method),
      review_date = VALUES(review_date),
      removed = VALUES(removed)`,
    [
      record.id,
      record.merchant_id,
      record.rating,
      record.author_name,
      record.content,
      record.collection_method,
      record.review_date,
      record.removed
    ]
  ));

  // Execute all queries in parallel
  await Promise.all(queries);
}

// Function to process a single CSV file and insert or update data in the database
async function importCSV(filePath, connection, startRow = 0) {
  const batchSize = 1000; // Adjust batch size based on performance testing
  const records = [];
  let rowNumber = 0;
  let startProcessing = false;
  let skippedRecords = 0; // Counter for skipped records in this file
  let processedRecords = 0; // Counter for processed records in this file

  try {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath)
        .pipe(csv());

      stream.on('data', (row) => {
        rowNumber++;
        if (rowNumber <= startRow && !startProcessing) return; // Skip rows until startRow is reached

        startProcessing = true;
        const record = {};
        for (const csvField in fieldMapping) {
          if (fieldMapping.hasOwnProperty(csvField)) {
            const dbField = fieldMapping[csvField];
            let value = row[csvField]?.trim();

            // Convert empty strings to null for non-numeric fields
            if (value === '') {
              value = null;
            } else if (value === undefined || value === null) {
              value = null;
            }

            record[dbField] = value;
          }
        }

        // Skip records with empty rating
        if (record.rating === null || record.rating === '') {
          skippedRecords++;
          return; // Skip this record
        }

        records.push(record);
        processedRecords++; // Increment processed records counter
        totalProcessed++; // Increment total processed records counter

        // Process batch if it reaches the batch size
        if (records.length >= batchSize) {
          stream.pause();
          processBatch(records, connection)
            .then(() => {
              records.length = 0; // Clear the records array
              lastFile = filePath; // Update last successful file
              lastRow = rowNumber; // Update last successful row
              stream.resume();
            })
            .catch(reject);
        }
      });

      stream.on('end', async () => {
        if (records.length > 0) {
          await processBatch(records, connection);
        }
        console.log(`CSV file successfully processed: ${filePath}`);
        console.log(`Records processed in this file: ${processedRecords}`);
        console.log(`Records skipped due to empty rating in this file: ${skippedRecords}`);
        console.log(`Total rows processed: ${totalProcessed}`);
        totalSkipped += skippedRecords; // Update total skipped records
        lastFile = filePath; // Update last successful file
        lastRow = rowNumber; // Update last successful row
        resolve();
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Error during processing:', error);
    throw error;
  }
}

// Function to process all CSV files in a directory sequentially
async function importAllCSVs(directoryPath, startFile = '', startRow = 0) {
  let connection;
  try {
    // Create MySQL connection
    connection = await mysql.createConnection(dbConfig);

    // Check if the path is a directory
    if (!fs.existsSync(directoryPath) || !fs.lstatSync(directoryPath).isDirectory()) {
      throw new Error(`Path is not a directory: ${directoryPath}`);
    }

    // Read all files in the directory
    const files = fs.readdirSync(directoryPath);

    // Filter for CSV files and sort them in ascending order
    const csvFiles = files
      .filter(file => path.extname(file).toLowerCase() === '.csv')
      .sort();

    let startProcessing = (resumeFile === '');

    // Process each CSV file sequentially
    for (const file of csvFiles) {
      const filePath = path.join(directoryPath, file);

      if (!startProcessing && file !== path.basename(startFile)) {
        continue; // Skip files until startFile is reached
      }

      startProcessing = true;

      try {
        await importCSV(filePath, connection, file === path.basename(startFile) ? startRow : 0);
      } catch (error) {
        console.error('Error during file processing:', error);
        console.log(`Last successful import was from file: ${lastFile}, row: ${lastRow}`);
        console.log(`Total records skipped due to empty rating: ${totalSkipped}`);
        console.log(`Total rows processed: ${totalProcessed}`);
        throw error;
      }
    }

    console.log('All CSV files processed successfully');
    console.log(`Total records skipped due to empty rating: ${totalSkipped}`);
    console.log(`Total rows processed: ${totalProcessed}`);
  } catch (error) {
    console.error('Error during directory processing:', error);
    console.log(`Last successful import was from file: ${lastFile}, row: ${lastRow}`);
    console.log(`Total records skipped due to empty rating: ${totalSkipped}`);
    console.log(`Total rows processed: ${totalProcessed}`);
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (endError) {
        console.error('Error closing the database connection:', endError);
      }
    }
  }
}

// Command-line arguments
const args = process.argv.slice(2);
const directoryPath = args[0];
const resumeFile = args[1] || '';
const resumeRow = parseInt(args[2], 10) || 0;

// Import the CSV data from the directory, with optional resumption
importAllCSVs(directoryPath, resumeFile, resumeRow);
