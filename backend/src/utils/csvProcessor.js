const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const logger = require('./logger');

class CSVProcessor {
  constructor() {
    this.stringsHeaders = [
      'Tier', 'Industry', 'Topic', 'Subtopic', 'Prefix', 
      'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'
    ];
    this.classificationsHeaders = [
      'Topic', 'SubTopic', 'Industry', 'Classification'
    ];
  }

  /**
   * Parse CSV buffer and return structured data
   * @param {Buffer} buffer - CSV file buffer
   * @param {string} fileType - 'strings' or 'classifications'
   * @returns {Promise<Array>} Parsed CSV data
   */
  async parseCSV(buffer, fileType) {
    return new Promise((resolve, reject) => {
      const results = [];
      const expectedHeaders = fileType === 'strings' ? this.stringsHeaders : this.classificationsHeaders;
      let headerValidated = false;

      const stream = Readable.from(buffer.toString());
      
      stream
        .pipe(csv({
          skipEmptyLines: true,
          skipLinesWithError: false
        }))
        .on('headers', (headers) => {
          // Validate headers
          const normalizedHeaders = headers.map(h => h.trim());
          const normalizedExpected = expectedHeaders.map(h => h.trim());
          
          const missingHeaders = normalizedExpected.filter(h => !normalizedHeaders.includes(h));
          const extraHeaders = normalizedHeaders.filter(h => !normalizedExpected.includes(h));
          
          if (missingHeaders.length > 0 || extraHeaders.length > 0) {
            const error = new Error(`Invalid CSV headers for ${fileType} file. Expected: [${expectedHeaders.join(', ')}]. Found: [${headers.join(', ')}]`);
            error.name = 'CSVParseError';
            return reject(error);
          }
          
          headerValidated = true;
          logger.info(`CSV headers validated for ${fileType} file`);
        })
        .on('data', (data) => {
          if (!headerValidated) return;
          
          // Clean and validate data
          const cleanedData = {};
          Object.keys(data).forEach(key => {
            const cleanKey = key.trim();
            cleanedData[cleanKey] = data[key] ? data[key].toString().trim() : '';
          });
          
          // Add row index for tracking
          cleanedData._rowIndex = results.length;
          results.push(cleanedData);
        })
        .on('end', () => {
          logger.info(`Successfully parsed ${results.length} rows from ${fileType} CSV`);
          resolve(results);
        })
        .on('error', (error) => {
          logger.error(`Error parsing ${fileType} CSV:`, error);
          error.name = 'CSVParseError';
          reject(error);
        });
    });
  }

  /**
   * Validate data integrity between strings and classifications
   * @param {Array} stringsData - Parsed strings CSV data
   * @param {Array} classificationsData - Parsed classifications CSV data
   * @returns {Object} Validation results
   */
  validateDataIntegrity(stringsData, classificationsData) {
    const validationErrors = [];
    const validRows = [];
    const invalidRows = [];

    // Create lookup set from classifications data
    const classificationLookup = new Set();
    classificationsData.forEach(row => {
      const key = `${row.Topic}|${row.SubTopic}|${row.Industry}`.toLowerCase();
      classificationLookup.add(key);
    });

    logger.info(`Created classification lookup with ${classificationLookup.size} entries`);

    // Validate each row in strings data
    stringsData.forEach((row, index) => {
      const lookupKey = `${row.Topic}|${row.Subtopic}|${row.Industry}`.toLowerCase();
      
      if (!classificationLookup.has(lookupKey)) {
        const error = {
          rowIndex: index,
          row: row,
          error: `No matching classification found for Topic: "${row.Topic}", SubTopic: "${row.Subtopic}", Industry: "${row.Industry}"`
        };
        validationErrors.push(error);
        invalidRows.push({ ...row, _validationError: error.error });
      } else {
        validRows.push(row);
      }
    });

    const result = {
      isValid: validationErrors.length === 0,
      totalRows: stringsData.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      errors: validationErrors,
      validRowsData: validRows,
      invalidRowsData: invalidRows
    };

    logger.info(`Validation completed: ${result.validRows}/${result.totalRows} rows valid`);
    return result;
  }

  /**
   * Generate CSV file from data
   * @param {Array} data - Data to convert to CSV
   * @param {string} fileType - 'strings' or 'classifications'
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>} Path to generated file
   */
  async generateCSV(data, fileType, outputPath) {
    const headers = fileType === 'strings' ? this.stringsHeaders : this.classificationsHeaders;
    
    // Clean data - remove internal fields
    const cleanData = data.map(row => {
      const cleanRow = {};
      headers.forEach(header => {
        cleanRow[header] = row[header] || '';
      });
      return cleanRow;
    });

    return new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(outputPath);
      
      fastcsv
        .write(cleanData, { headers: headers })
        .pipe(writeStream)
        .on('finish', () => {
          logger.info(`Generated ${fileType} CSV file: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (error) => {
          logger.error(`Error generating ${fileType} CSV:`, error);
          reject(error);
        });
    });
  }

  /**
   * Validate individual row data
   * @param {Object} rowData - Row data to validate
   * @param {string} fileType - 'strings' or 'classifications'
   * @returns {Object} Validation result
   */
  validateRowData(rowData, fileType) {
    const headers = fileType === 'strings' ? this.stringsHeaders : this.classificationsHeaders;
    const errors = [];

    headers.forEach(header => {
      if (!rowData.hasOwnProperty(header)) {
        errors.push(`Missing required field: ${header}`);
      }
    });

    // Additional validation rules can be added here
    if (fileType === 'strings') {
      if (rowData['Fuzzing-Idx'] && isNaN(parseInt(rowData['Fuzzing-Idx']))) {
        errors.push('Fuzzing-Idx must be a number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = new CSVProcessor();