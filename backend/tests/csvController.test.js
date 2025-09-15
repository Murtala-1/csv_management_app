const request = require('supertest');
const app = require('../src/app');

describe('CSV Controller', () => {
  const sampleStringsCSV = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
1,Tech,AI,Machine Learning,ML,1,Test prompt,Low,ai ml
2,Finance,Banking,Loans,BL,2,Another prompt,Medium,bank loan`;

  const sampleClassificationsCSV = `Topic,SubTopic,Industry,Classification
AI,Machine Learning,Tech,Technical
Banking,Loans,Finance,Financial`;

  beforeEach(async () => {
    // Clear data before each test
    await request(app).delete('/api/data');
  });

  describe('POST /api/upload', () => {
    test('should upload strings file successfully', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from(sampleStringsCSV), 'strings.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results.strings.success).toBe(true);
      expect(response.body.results.strings.rowCount).toBe(2);
    });

    test('should upload classifications file successfully', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('classificationsFile', Buffer.from(sampleClassificationsCSV), 'classifications.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results.classifications.success).toBe(true);
      expect(response.body.results.classifications.rowCount).toBe(2);
    });

    test('should upload both files and validate', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from(sampleStringsCSV), 'strings.csv')
        .attach('classificationsFile', Buffer.from(sampleClassificationsCSV), 'classifications.csv')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.results.strings.success).toBe(true);
      expect(response.body.results.classifications.success).toBe(true);
      expect(response.body.results.validation).toBeDefined();
      expect(response.body.results.validation.isValid).toBe(true);
    });

    test('should reject non-CSV files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from('not a csv'), 'test.txt')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle invalid CSV format', async () => {
      const invalidCSV = `Wrong,Headers
1,2`;

      const response = await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from(invalidCSV), 'invalid.csv')
        .expect(200);

      expect(response.body.results.strings.success).toBe(false);
      expect(response.body.results.strings.error).toContain('Invalid CSV headers');
    });

    test('should require at least one file', async () => {
      const response = await request(app)
        .post('/api/upload')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('At least one CSV file is required');
    });
  });

  describe('GET /api/data', () => {
    test('should return empty data initially', async () => {
      const response = await request(app)
        .get('/api/data')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.strings).toEqual([]);
      expect(response.body.data.classifications).toEqual([]);
      expect(response.body.data.validationResults).toBeNull();
    });

    test('should return uploaded data', async () => {
      // Upload data first
      await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from(sampleStringsCSV), 'strings.csv');

      const response = await request(app)
        .get('/api/data')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.strings).toHaveLength(2);
      expect(response.body.data.strings[0]).toHaveProperty('Topic', 'AI');
    });
  });

  describe('PUT /api/data', () => {
    test('should update strings data', async () => {
      const updatedData = {
        strings: [
          {
            Tier: '1',
            Industry: 'Tech',
            Topic: 'AI',
            Subtopic: 'Deep Learning',
            Prefix: 'DL',
            'Fuzzing-Idx': '1',
            Prompt: 'Updated prompt',
            Risks: 'High',
            Keywords: 'ai deep learning'
          }
        ]
      };

      const response = await request(app)
        .put('/api/data')
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.strings).toHaveLength(1);
      expect(response.body.data.strings[0].Subtopic).toBe('Deep Learning');
    });

    test('should validate updated data', async () => {
      const invalidData = {
        strings: [
          {
            // Missing required fields
            Topic: 'AI'
          }
        ]
      };

      const response = await request(app)
        .put('/api/data')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid strings data');
    });

    test('should require at least one data type', async () => {
      const response = await request(app)
        .put('/api/data')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('At least one data type');
    });
  });

  describe('POST /api/validate', () => {
    test('should validate data successfully', async () => {
      // Upload both files first
      await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from(sampleStringsCSV), 'strings.csv')
        .attach('classificationsFile', Buffer.from(sampleClassificationsCSV), 'classifications.csv');

      const response = await request(app)
        .post('/api/validate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.validationResults.isValid).toBe(true);
      expect(response.body.validationResults.totalRows).toBe(2);
    });

    test('should require both data types for validation', async () => {
      // Upload only strings file
      await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from(sampleStringsCSV), 'strings.csv');

      const response = await request(app)
        .post('/api/validate')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Both strings and classifications data are required');
    });
  });

  describe('GET /api/export', () => {
    beforeEach(async () => {
      // Upload test data
      await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from(sampleStringsCSV), 'strings.csv')
        .attach('classificationsFile', Buffer.from(sampleClassificationsCSV), 'classifications.csv');
    });

    test('should export both files as ZIP', async () => {
      const response = await request(app)
        .get('/api/export?type=both')
        .expect(200);

      expect(response.headers['content-type']).toContain('application');
      expect(response.body).toBeDefined();
    });

    test('should export strings file', async () => {
      const response = await request(app)
        .get('/api/export?type=strings')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Tier,Industry,Topic');
    });

    test('should export classifications file', async () => {
      const response = await request(app)
        .get('/api/export?type=classifications')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Topic,SubTopic,Industry');
    });

    test('should reject invalid export type', async () => {
      const response = await request(app)
        .get('/api/export?type=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid export type');
    });

    test('should handle export with no data', async () => {
      // Clear data first
      await request(app).delete('/api/data');

      const response = await request(app)
        .get('/api/export?type=strings')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No strings data available');
    });
  });

  describe('DELETE /api/data', () => {
    test('should clear all data', async () => {
      // Upload data first
      await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from(sampleStringsCSV), 'strings.csv');

      // Clear data
      const response = await request(app)
        .delete('/api/data')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify data is cleared
      const dataResponse = await request(app)
        .get('/api/data')
        .expect(200);

      expect(dataResponse.body.data.strings).toEqual([]);
    });
  });

  describe('GET /api/stats', () => {
    test('should return statistics', async () => {
      // Upload data first
      await request(app)
        .post('/api/upload')
        .attach('stringsFile', Buffer.from(sampleStringsCSV), 'strings.csv')
        .attach('classificationsFile', Buffer.from(sampleClassificationsCSV), 'classifications.csv');

      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats.strings.rowCount).toBe(2);
      expect(response.body.stats.classifications.rowCount).toBe(2);
      expect(response.body.stats.validation).toBeDefined();
    });

    test('should return empty statistics initially', async () => {
      const response = await request(app)
        .get('/api/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats.strings.rowCount).toBe(0);
      expect(response.body.stats.classifications.rowCount).toBe(0);
      expect(response.body.stats.validation).toBeNull();
    });
  });

  describe('Health check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
});