const csvProcessor = require('../src/utils/csvProcessor');
const fs = require('fs');
const path = require('path');

describe('CSVProcessor', () => {
  const sampleStringsCSV = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
1,Tech,AI,Machine Learning,ML,1,Test prompt,Low,ai ml
2,Finance,Banking,Loans,BL,2,Another prompt,Medium,bank loan`;

  const sampleClassificationsCSV = `Topic,SubTopic,Industry,Classification
AI,Machine Learning,Tech,Technical
Banking,Loans,Finance,Financial`;

  const invalidStringsCSV = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
1,Tech,AI,Deep Learning,ML,1,Test prompt,Low,ai ml
2,Finance,Banking,Credits,BL,2,Another prompt,Medium,bank loan`;

  describe('parseCSV', () => {
    test('should parse valid strings CSV', async () => {
      const buffer = Buffer.from(sampleStringsCSV);
      const result = await csvProcessor.parseCSV(buffer, 'strings');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('Tier', '1');
      expect(result[0]).toHaveProperty('Industry', 'Tech');
      expect(result[0]).toHaveProperty('Topic', 'AI');
      expect(result[0]).toHaveProperty('_rowIndex', 0);
    });

    test('should parse valid classifications CSV', async () => {
      const buffer = Buffer.from(sampleClassificationsCSV);
      const result = await csvProcessor.parseCSV(buffer, 'classifications');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('Topic', 'AI');
      expect(result[0]).toHaveProperty('SubTopic', 'Machine Learning');
      expect(result[0]).toHaveProperty('Industry', 'Tech');
      expect(result[0]).toHaveProperty('_rowIndex', 0);
    });

    test('should reject CSV with invalid headers', async () => {
      const invalidCSV = `Wrong,Headers,Here
1,2,3`;
      const buffer = Buffer.from(invalidCSV);
      
      await expect(csvProcessor.parseCSV(buffer, 'strings'))
        .rejects.toThrow('Invalid CSV headers');
    });

    test('should handle empty CSV', async () => {
      const emptyCSV = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords`;
      const buffer = Buffer.from(emptyCSV);
      const result = await csvProcessor.parseCSV(buffer, 'strings');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('validateDataIntegrity', () => {
    test('should pass validation for valid data', async () => {
      const stringsBuffer = Buffer.from(sampleStringsCSV);
      const classificationsBuffer = Buffer.from(sampleClassificationsCSV);
      
      const stringsData = await csvProcessor.parseCSV(stringsBuffer, 'strings');
      const classificationsData = await csvProcessor.parseCSV(classificationsBuffer, 'classifications');
      
      const result = csvProcessor.validateDataIntegrity(stringsData, classificationsData);
      
      expect(result.isValid).toBe(true);
      expect(result.validRows).toBe(2);
      expect(result.invalidRows).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail validation for invalid data', async () => {
      const stringsBuffer = Buffer.from(invalidStringsCSV);
      const classificationsBuffer = Buffer.from(sampleClassificationsCSV);
      
      const stringsData = await csvProcessor.parseCSV(stringsBuffer, 'strings');
      const classificationsData = await csvProcessor.parseCSV(classificationsBuffer, 'classifications');
      
      const result = csvProcessor.validateDataIntegrity(stringsData, classificationsData);
      
      expect(result.isValid).toBe(false);
      expect(result.validRows).toBe(1);
      expect(result.invalidRows).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('No matching classification found');
    });

    test('should handle empty classifications data', () => {
      const stringsData = [
        { Topic: 'AI', Subtopic: 'ML', Industry: 'Tech', _rowIndex: 0 }
      ];
      const classificationsData = [];
      
      const result = csvProcessor.validateDataIntegrity(stringsData, classificationsData);
      
      expect(result.isValid).toBe(false);
      expect(result.invalidRows).toBe(1);
    });

    test('should be case insensitive', async () => {
      const caseInsensitiveClassifications = `Topic,SubTopic,Industry,Classification
ai,machine learning,tech,Technical`;
      
      const stringsBuffer = Buffer.from(sampleStringsCSV);
      const classificationsBuffer = Buffer.from(caseInsensitiveClassifications);
      
      const stringsData = await csvProcessor.parseCSV(stringsBuffer, 'strings');
      const classificationsData = await csvProcessor.parseCSV(classificationsBuffer, 'classifications');
      
      const result = csvProcessor.validateDataIntegrity(stringsData, classificationsData);
      
      expect(result.validRows).toBe(1); // Only the first row should match
    });
  });

  describe('validateRowData', () => {
    test('should validate valid strings row', () => {
      const validRow = {
        Tier: '1',
        Industry: 'Tech',
        Topic: 'AI',
        Subtopic: 'ML',
        Prefix: 'ML',
        'Fuzzing-Idx': '1',
        Prompt: 'Test',
        Risks: 'Low',
        Keywords: 'ai'
      };
      
      const result = csvProcessor.validateRowData(validRow, 'strings');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate valid classifications row', () => {
      const validRow = {
        Topic: 'AI',
        SubTopic: 'ML',
        Industry: 'Tech',
        Classification: 'Technical'
      };
      
      const result = csvProcessor.validateRowData(validRow, 'classifications');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject row with missing fields', () => {
      const invalidRow = {
        Tier: '1',
        Industry: 'Tech'
        // Missing other required fields
      };
      
      const result = csvProcessor.validateRowData(invalidRow, 'strings');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate Fuzzing-Idx as number', () => {
      const invalidRow = {
        Tier: '1',
        Industry: 'Tech',
        Topic: 'AI',
        Subtopic: 'ML',
        Prefix: 'ML',
        'Fuzzing-Idx': 'not-a-number',
        Prompt: 'Test',
        Risks: 'Low',
        Keywords: 'ai'
      };
      
      const result = csvProcessor.validateRowData(invalidRow, 'strings');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Fuzzing-Idx must be a number');
    });
  });

  describe('generateCSV', () => {
    test('should generate CSV file', async () => {
      const testData = [
        {
          Tier: '1',
          Industry: 'Tech',
          Topic: 'AI',
          Subtopic: 'ML',
          Prefix: 'ML',
          'Fuzzing-Idx': '1',
          Prompt: 'Test',
          Risks: 'Low',
          Keywords: 'ai',
          _rowIndex: 0
        }
      ];
      
      const outputPath = path.join(__dirname, 'test-output.csv');
      
      try {
        const result = await csvProcessor.generateCSV(testData, 'strings', outputPath);
        expect(result).toBe(outputPath);
        
        // Verify file exists
        const fileExists = fs.existsSync(outputPath);
        expect(fileExists).toBe(true);
        
        // Verify file content
        const content = fs.readFileSync(outputPath, 'utf8');
        expect(content).toContain('Tier,Industry,Topic,Subtopic');
        expect(content).toContain('1,Tech,AI,ML');
        
      } finally {
        // Clean up
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }
    });

    test('should clean internal fields from data', async () => {
      const testData = [
        {
          Topic: 'AI',
          SubTopic: 'ML',
          Industry: 'Tech',
          Classification: 'Technical',
          _rowIndex: 0,
          _validationError: 'Some error'
        }
      ];
      
      const outputPath = path.join(__dirname, 'test-output-clean.csv');
      
      try {
        await csvProcessor.generateCSV(testData, 'classifications', outputPath);
        
        const content = fs.readFileSync(outputPath, 'utf8');
        expect(content).not.toContain('_rowIndex');
        expect(content).not.toContain('_validationError');
        expect(content).toContain('Topic,SubTopic,Industry,Classification');
        
      } finally {
        // Clean up
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }
    });
  });
});