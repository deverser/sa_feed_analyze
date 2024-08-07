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

// Function to update sj_id in the database using batch updates
async function updateSJID(records, connection) {
  if (records.length === 0) return 0;

  const ids = records.map(record => record.id);
  const cases = records.map(record => `WHEN id = '${record.id}' THEN '${record.sj_id}'`).join(' ');
  const query = `
    UPDATE reviews
    SET sj_id = CASE ${cases} END
    WHERE id IN (${ids.map(id => `'${id}'`).join(', ')})
  `;

  const [result] = await connection.execute(query);

  return result.affectedRows;
}

// Function to process a single CSV file and update sj_id in the database
async function processCSV(filePath, connection, startRow = 0) {
  const batchSize = 1000; // Adjust batch size based on performance testing
  const records = [];
  let totalRowsProcessed = startRow;
  let totalUpdates = 0;
  let lastRowProcessed = startRow;

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(csv());

    stream.on('data', async (row) => {
      totalRowsProcessed++;
      if (totalRowsProcessed <= startRow) return;

      const record = {
        id: row.Feedbackid?.trim(),
        sj_id: row.SJID?.trim()
      };

      if (record.id && record.sj_id) {
        records.push(record);
      }

      if (records.length >= batchSize) {
        stream.pause();
        try {
          const updateCount = await updateSJID(records, connection);
          totalUpdates += updateCount;
          records.length = 0; // Clear the records array
          lastRowProcessed = totalRowsProcessed;
        } catch (error) {
          console.error(`Error at row ${totalRowsProcessed}:`, error);
          reject({ error, lastRowProcessed });
          return;
        }
        stream.resume();
      }
    });

    stream.on('end', async () => {
      try {
        if (records.length > 0) {
          const updateCount = await updateSJID(records, connection);
          totalUpdates += updateCount;
        }
        console.log(`CSV file successfully processed: ${filePath}`);
        console.log(`Total rows processed: ${totalRowsProcessed}`);
        console.log(`Total actual updates in the database: ${totalUpdates}`);
        resolve();
      } catch (error) {
        console.error(`Error at row ${totalRowsProcessed}:`, error);
        reject({ error, lastRowProcessed });
      }
    });

    stream.on('error', (error) => {
      console.error(`Error at row ${totalRowsProcessed}:`, error);
      reject({ error, lastRowProcessed });
    });
  });
}

// Function to process the CSV file
async function updateReviewsFromCSV(filePath, startRow = 0) {
  let connection;
  try {
    // Create MySQL connection
    connection = await mysql.createConnection(dbConfig);

    // Check if the path is a file
    if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    // Process the CSV file
    await processCSV(filePath, connection, startRow);
    console.log('CSV file processed and database updated successfully');
  } catch (error) {
    if (error.lastRowProcessed !== undefined) {
      console.error(`Error during processing at row ${error.lastRowProcessed}:`, error.error);
      console.log(`To resume processing, use row ${error.lastRowProcessed + 1}`);
    } else {
      console.error('Error during processing:', error);
    }
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
const filePath = args[0];
const startRow = parseInt(args[1], 10) || 0;

if (!filePath) {
  console.error('Please provide the path to the CSV file.');
  process.exit(1);
}

// Update reviews from the CSV file
updateReviewsFromCSV(filePath, startRow);
