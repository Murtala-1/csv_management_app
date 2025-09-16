const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');
const csvProcessor = require('../utils/csvProcessor');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 2 // Maximum 2 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// In-memory storage for current session data
let sessionData = {
  strings: [],
  classifications: [],
  validationResults: null,
  lastUpdated: null
};

/**
 * POST /api/upload - Handle CSV file uploads
 */
router.post('/upload', upload.fields([
  { name: 'stringsFile', maxCount: 1 },
  { name: 'classificationsFile', maxCount: 1 }
]), async (req, res, next) => {
  try {
    const { stringsFile, classificationsFile } = req.files;

    if (!stringsFile && !classificationsFile) {
      return res.status(400).json({
        success: false,
        error: 'At least one CSV file is required'
      });
    }

    const results = {};

    // Process strings file
    if (stringsFile && stringsFile[0]) {
      try {
        const stringsData = await csvProcessor.parseCSV(stringsFile[0].buffer, 'strings');
        sessionData.strings = stringsData;
        results.strings = {
          success: true,
          rowCount: stringsData.length,
          headers: Object.keys(stringsData[0] || {}).filter(key => !key.startsWith('_'))
        };
        logger.info(`Uploaded strings file with ${stringsData.length} rows`);
      } catch (error) {
        results.strings = {
          success: false,
          error: error.message
        };
      }
    }

    // Process classifications file
    if (classificationsFile && classificationsFile[0]) {
      try {
        const classificationsData = await csvProcessor.parseCSV(classificationsFile[0].buffer, 'classifications');
        sessionData.classifications = classificationsData;
        results.classifications = {
          success: true,
          rowCount: classificationsData.length,
          headers: Object.keys(classificationsData[0] || {}).filter(key => !key.startsWith('_'))
        };
        logger.info(`Uploaded classifications file with ${classificationsData.length} rows`);
      } catch (error) {
        results.classifications = {
          success: false,
          error: error.message
        };
      }
    }

    // Perform validation if both files are present
    if (sessionData.strings.length > 0 && sessionData.classifications.length > 0) {
      sessionData.validationResults = csvProcessor.validateDataIntegrity(
        sessionData.strings,
        sessionData.classifications
      );
      results.validation = sessionData.validationResults;
    }

    sessionData.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      results,
      message: 'Files uploaded and processed successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/data - Retrieve current CSV data
 */
router.get('/data', (req, res) => {
  res.json({
    success: true,
    data: {
      strings: sessionData.strings,
      classifications: sessionData.classifications,
      validationResults: sessionData.validationResults,
      lastUpdated: sessionData.lastUpdated
    }
  });
});

/**
 * PUT /api/data - Update CSV data
 */
router.put('/data', async (req, res, next) => {
  try {
    const { strings, classifications } = req.body;

    if (!strings && !classifications) {
      return res.status(400).json({
        success: false,
        error: 'At least one data type (strings or classifications) is required'
      });
    }

    // Validate and update strings data
    if (strings) {
      // Validate each row
      const validationErrors = [];
      strings.forEach((row, index) => {
        const validation = csvProcessor.validateRowData(row, 'strings');
        if (!validation.isValid) {
          validationErrors.push({
            rowIndex: index,
            errors: validation.errors
          });
        }
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid strings data',
          validationErrors
        });
      }

      sessionData.strings = strings;
    }

    // Validate and update classifications data
    if (classifications) {
      const validationErrors = [];
      classifications.forEach((row, index) => {
        const validation = csvProcessor.validateRowData(row, 'classifications');
        if (!validation.isValid) {
          validationErrors.push({
            rowIndex: index,
            errors: validation.errors
          });
        }
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid classifications data',
          validationErrors
        });
      }

      sessionData.classifications = classifications;
    }

    // Re-validate data integrity if both datasets exist
    if (sessionData.strings.length > 0 && sessionData.classifications.length > 0) {
      sessionData.validationResults = csvProcessor.validateDataIntegrity(
        sessionData.strings,
        sessionData.classifications
      );
    }

    sessionData.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      data: {
        strings: sessionData.strings,
        classifications: sessionData.classifications,
        validationResults: sessionData.validationResults
      },
      message: 'Data updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/validate - Validate data integrity
 */
router.post('/validate', (req, res) => {
  if (sessionData.strings.length === 0 || sessionData.classifications.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Both strings and classifications data are required for validation'
    });
  }

  const validationResults = csvProcessor.validateDataIntegrity(
    sessionData.strings,
    sessionData.classifications
  );

  sessionData.validationResults = validationResults;

  res.json({
    success: true,
    validationResults
  });
});

/**
 * GET /api/export - Generate and download CSV files
 */
router.get('/export', async (req, res, next) => {
  try {
    const { type } = req.query; // 'strings', 'classifications', or 'both'

    if (!type || !['strings', 'classifications', 'both'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid export type. Must be "strings", "classifications", or "both"'
      });
    }

    // Create temporary directory for exports
    const tempDir = path.join(__dirname, '../../temp');
    try {
      await fs.mkdir(tempDir, { recursive: true, mode: 0o755 });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        logger.error('Error creating temp directory:', error);
        return res.status(500).json({
          success: false,
          error: 'Unable to create temporary directory for export'
        });
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (type === 'both') {
      // Create ZIP file with both CSV files
      const zipPath = path.join(tempDir, `csv-export-${timestamp}.zip`);
      const tempFiles = []; // Track temporary files for cleanup
      
      try {
        const output = require('fs').createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Handle archiver errors
        archive.on('error', (err) => {
          logger.error('Archiver error:', err);
          throw err;
        });

        archive.pipe(output);

        // Generate strings CSV
        if (sessionData.strings.length > 0) {
          const stringsPath = path.join(tempDir, `strings-${timestamp}.csv`);
          await csvProcessor.generateCSV(sessionData.strings, 'strings', stringsPath);
          archive.file(stringsPath, { name: 'strings.csv' });
          tempFiles.push(stringsPath);
        }

        // Generate classifications CSV
        if (sessionData.classifications.length > 0) {
          const classificationsPath = path.join(tempDir, `classifications-${timestamp}.csv`);
          await csvProcessor.generateCSV(sessionData.classifications, 'classifications', classificationsPath);
          archive.file(classificationsPath, { name: 'classifications.csv' });
          tempFiles.push(classificationsPath);
        }

        // Wait for the archive to finish writing
        await new Promise((resolve, reject) => {
          output.on('close', () => {
            logger.info(`Archive created successfully: ${zipPath}`);
            resolve();
          });
          
          output.on('error', (err) => {
            logger.error('Output stream error:', err);
            reject(err);
          });
          
          archive.on('error', (err) => {
            logger.error('Archive error:', err);
            reject(err);
          });
          
          // Finalize the archive
          archive.finalize();
        });

        // Send ZIP file
        res.download(zipPath, 'csv-export.zip', async (err) => {
          if (err) {
            logger.error('Error sending ZIP file:', err);
          }
          
          // Clean up all temporary files
          const cleanupPromises = [];
          
          // Clean up ZIP file
          cleanupPromises.push(
            fs.unlink(zipPath).catch(cleanupError => {
              logger.error('Error cleaning up ZIP file:', cleanupError);
            })
          );
          
          // Clean up temporary CSV files
          tempFiles.forEach(filePath => {
            cleanupPromises.push(
              fs.unlink(filePath).catch(cleanupError => {
                logger.error(`Error cleaning up temp file ${filePath}:`, cleanupError);
              })
            );
          });
          
          await Promise.all(cleanupPromises);
        });
        
      } catch (error) {
        logger.error('Error creating ZIP file:', error);
        
        // Clean up temporary files on error
        const cleanupPromises = tempFiles.map(filePath => 
          fs.unlink(filePath).catch(cleanupError => {
            logger.error(`Error cleaning up temp file ${filePath}:`, cleanupError);
          })
        );
        
        if (require('fs').existsSync(zipPath)) {
          cleanupPromises.push(
            fs.unlink(zipPath).catch(cleanupError => {
              logger.error('Error cleaning up ZIP file:', cleanupError);
            })
          );
        }
        
        await Promise.all(cleanupPromises);
        
        return res.status(500).json({
          success: false,
          error: 'Failed to create ZIP file'
        });
      }

    } else {
      // Export single file
      const data = sessionData[type];
      if (!data || data.length === 0) {
        return res.status(400).json({
          success: false,
          error: `No ${type} data available for export`
        });
      }

      const csvPath = path.join(tempDir, `${type}-${timestamp}.csv`);
      await csvProcessor.generateCSV(data, type, csvPath);

      res.download(csvPath, `${type}.csv`, async (err) => {
        if (err) {
          logger.error(`Error sending ${type} CSV file:`, err);
        }
        // Clean up temporary file
        try {
          await fs.unlink(csvPath);
        } catch (cleanupError) {
          logger.error(`Error cleaning up ${type} CSV file:`, cleanupError);
        }
      });
    }

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/data - Clear all session data
 */
router.delete('/data', (req, res) => {
  sessionData = {
    strings: [],
    classifications: [],
    validationResults: null,
    lastUpdated: null
  };

  res.json({
    success: true,
    message: 'All data cleared successfully'
  });
});

/**
 * GET /api/stats - Get data statistics
 */
router.get('/stats', (req, res) => {
  const stats = {
    strings: {
      rowCount: sessionData.strings.length,
      hasData: sessionData.strings.length > 0
    },
    classifications: {
      rowCount: sessionData.classifications.length,
      hasData: sessionData.classifications.length > 0
    },
    validation: sessionData.validationResults ? {
      isValid: sessionData.validationResults.isValid,
      totalRows: sessionData.validationResults.totalRows,
      validRows: sessionData.validationResults.validRows,
      invalidRows: sessionData.validationResults.invalidRows,
      errorCount: sessionData.validationResults.errors.length
    } : null,
    lastUpdated: sessionData.lastUpdated
  };

  res.json({
    success: true,
    stats
  });
});

module.exports = router;