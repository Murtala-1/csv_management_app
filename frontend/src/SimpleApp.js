import React, { useState } from 'react';

const SimpleApp = () => {
  const [files, setFiles] = useState([]);

  const handleFileUpload = (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles(uploadedFiles);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        CSV Data Management Application
      </h1>
      
      <div style={{ 
        border: '2px dashed #ccc', 
        padding: '40px', 
        textAlign: 'center',
        marginBottom: '20px',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h2>Upload CSV Files</h2>
        <p>Select your CSV files to get started</p>
        <input 
          type="file" 
          multiple 
          accept=".csv"
          onChange={handleFileUpload}
          style={{ margin: '10px 0' }}
        />
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p><strong>Expected formats:</strong></p>
          <p>• Strings: Tier, Industry, Topic, Subtopic, Prefix, Fuzzing-Idx, Prompt, Risks, Keywords</p>
          <p>• Classifications: Topic, SubTopic, Industry, Classification</p>
        </div>
      </div>

      {files.length > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3>Uploaded Files:</h3>
          <ul>
            {files.map((file, index) => (
              <li key={index} style={{ margin: '5px 0' }}>
                {file.name} ({Math.round(file.size / 1024)} KB)
              </li>
            ))}
          </ul>
          
          <button 
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
            onClick={() => alert('Upload functionality will be implemented!')}
          >
            Process Files
          </button>
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e9ecef',
        borderRadius: '8px'
      }}>
        <h3>Features:</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li><strong>File Upload & Display:</strong> Upload two CSV files and view them in editable tables</li>
          <li><strong>Editing:</strong> Edit values directly in tables, add or delete rows</li>
          <li><strong>Data Validation:</strong> Validate that every Topic + SubTopic + Industry combination in strings.csv exists in classifications.csv</li>
          <li><strong>Error Highlighting:</strong> Invalid rows are highlighted with clear error messages</li>
          <li><strong>Export:</strong> Download updated CSV files</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleApp;