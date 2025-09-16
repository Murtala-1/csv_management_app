import React, { useState, useCallback } from 'react';
import { csvAPI } from './utils/api';

const CSVManagementApp = () => {
  const [data, setData] = useState({
    strings: [],
    classifications: [],
    validationResults: null
  });
  
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [files, setFiles] = useState({
    stringsFile: null,
    classificationsFile: null
  });

  const handleFileChange = (event, fileType) => {
    const file = event.target.files[0];
    if (file) {
      setFiles(prev => ({ ...prev, [fileType]: file }));
    }
  };

  // Edit cell value
  const updateCell = useCallback((tableType, rowIndex, columnKey, newValue) => {
    setData(prevData => {
      const newData = { ...prevData };
      const tableData = [...newData[tableType]];
      
      if (tableData[rowIndex]) {
        tableData[rowIndex] = {
          ...tableData[rowIndex],
          [columnKey]: newValue
        };
        newData[tableType] = tableData;
      }
      
      return newData;
    });
    
    setHasUnsavedChanges(true);
  }, []);

  // Add new row
  const addRow = useCallback((tableType) => {
    setData(prevData => {
      const newData = { ...prevData };
      const tableData = [...newData[tableType]];
      
      // Create empty row with correct structure
      const headers = tableType === 'strings' 
        ? ['Tier', 'Industry', 'Topic', 'Subtopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords']
        : ['Topic', 'SubTopic', 'Industry', 'Classification'];
      
      const newRow = {};
      headers.forEach(header => {
        newRow[header] = '';
      });
      
      tableData.push(newRow);
      newData[tableType] = tableData;
      
      return newData;
    });
    
    setHasUnsavedChanges(true);
    alert(`New row added to ${tableType}`);
  }, []);

  // Delete row
  const deleteRow = useCallback((tableType, rowIndex) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
      setData(prevData => {
        const newData = { ...prevData };
        const tableData = [...newData[tableType]];
        
        if (rowIndex >= 0 && rowIndex < tableData.length) {
          tableData.splice(rowIndex, 1);
          newData[tableType] = tableData;
        }
        
        return newData;
      });
      
      setHasUnsavedChanges(true);
      alert(`Row deleted from ${tableType}`);
    }
  }, []);

  // Save changes with validation
  const saveChanges = useCallback(async () => {
    // First validate the data before saving
    if (data.strings.length > 0 && data.classifications.length > 0) {
      setValidating(true);
      try {
        const validationResponse = await csvAPI.validateData();
        
        if (validationResponse.success) {
          setData(prev => ({
            ...prev,
            validationResults: validationResponse.validationResults
          }));
          
          // Check if validation failed
          if (!validationResponse.validationResults.isValid) {
            alert(`Cannot save: ${validationResponse.validationResults.invalidRows} rows have validation errors. Please fix the highlighted errors before saving.`);
            setValidating(false);
            return;
          }
        }
      } catch (error) {
        console.error('Validation error:', error);
        alert('Validation failed: ' + (error.message || 'Unknown error'));
        setValidating(false);
        return;
      } finally {
        setValidating(false);
      }
    }
    
    // If validation passed or no data to validate, proceed with save
    setSaving(true);
    try {
      const response = await csvAPI.updateData({
        strings: data.strings,
        classifications: data.classifications
      });
      
      if (response.success) {
        setData(response.data);
        setHasUnsavedChanges(false);
        alert('Changes saved successfully!');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Save failed: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [data]);

  // Handle cell editing
  const handleCellClick = (tableType, rowIndex, columnKey) => {
    setEditingCell(`${tableType}-${rowIndex}-${columnKey}`);
  };

  const handleCellChange = (tableType, rowIndex, columnKey, value) => {
    updateCell(tableType, rowIndex, columnKey, value);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleKeyPress = (event, tableType, rowIndex, columnKey) => {
    if (event.key === 'Enter') {
      setEditingCell(null);
    }
    if (event.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Check if a row is invalid based on validation results
  const isRowInvalid = useCallback((tableType, rowIndex) => {
    if (!data.validationResults || !data.validationResults.errors) {
      return false;
    }
    
    return data.validationResults.errors.some(error => 
      error.rowIndex === rowIndex && tableType === 'strings'
    );
  }, [data.validationResults]);

  // Get error message for a specific row
  const getRowErrorMessage = useCallback((tableType, rowIndex) => {
    if (!data.validationResults || !data.validationResults.errors) {
      return null;
    }
    
    const error = data.validationResults.errors.find(error => 
      error.rowIndex === rowIndex && tableType === 'strings'
    );
    
    return error ? error.message : null;
  }, [data.validationResults]);

  // Download template files
  const downloadTemplate = useCallback((templateType) => {
    const templateUrls = {
      strings: '/templates/strings_template.csv',
      classifications: '/templates/classifications_template.csv'
    };
    
    const link = document.createElement('a');
    link.href = templateUrls[templateType];
    link.download = `${templateType}_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const clearData = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        await csvAPI.clearData();
        setData({
          strings: [],
          classifications: [],
          validationResults: null
        });
        setHasUnsavedChanges(false);
        setFiles({
          stringsFile: null,
          classificationsFile: null
        });
        
        // Reset file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          input.value = '';
        });
        
        alert('All data cleared successfully!');
      } catch (error) {
        console.error('Clear data error:', error);
        alert('Failed to clear data: ' + (error.message || 'Unknown error'));
      }
    }
  }, []);

  const uploadFiles = useCallback(async () => {
    if (!files.stringsFile && !files.classificationsFile) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);
    try {
      // Clear existing data first (both frontend and backend)
      console.log('Clearing existing data...');
      await csvAPI.clearData();
      
      setData({
        strings: [],
        classifications: [],
        validationResults: null
      });
      setHasUnsavedChanges(false);
      
      const formData = new FormData();
      
      if (files.stringsFile) {
        formData.append('stringsFile', files.stringsFile);
        console.log('Uploading strings file:', files.stringsFile.name);
      }
      
      if (files.classificationsFile) {
        formData.append('classificationsFile', files.classificationsFile);
        console.log('Uploading classifications file:', files.classificationsFile.name);
      }

      console.log('Sending upload request...');
      const response = await csvAPI.uploadFiles(formData);
      console.log('Upload response:', response);
      
      if (response.success) {
        // Check for validation errors in the response
        const hasErrors = (response.results.strings && !response.results.strings.success) || 
                         (response.results.classifications && !response.results.classifications.success);
        
        if (hasErrors) {
          // Show detailed error messages for invalid data
          let errorMessage = 'Upload failed - Data does not meet the standard:\n\n';
          
          if (response.results.strings && !response.results.strings.success) {
            errorMessage += `Strings File Error:\n${response.results.strings.error}\n\n`;
          }
          
          if (response.results.classifications && !response.results.classifications.success) {
            errorMessage += `Classifications File Error:\n${response.results.classifications.error}\n\n`;
          }
          
          errorMessage += 'Expected formats:\n';
          errorMessage += '• Strings: Tier, Industry, Topic, Subtopic, Prefix, Fuzzing-Idx, Prompt, Risks, Keywords\n';
          errorMessage += '• Classifications: Topic, SubTopic, Industry, Classification';
          
          alert(errorMessage);
          return;
        }
        
        // Load the updated data
        console.log('Loading updated data...');
        const dataResponse = await csvAPI.getData();
        console.log('Data response:', dataResponse);
        
        if (dataResponse.success) {
          setData(dataResponse.data);
          console.log('Data set successfully:', dataResponse.data);
        }
        
        // Clear file selection after successful upload
        setFiles({
          stringsFile: null,
          classificationsFile: null
        });
        
        // Reset file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
          input.value = '';
        });
        
        // Show success message with details
        let successMessage = 'Files uploaded successfully!\n\n';
        if (response.results.strings && response.results.strings.success) {
          successMessage += `Strings: ${response.results.strings.rowCount} rows loaded\n`;
        }
        if (response.results.classifications && response.results.classifications.success) {
          successMessage += `Classifications: ${response.results.classifications.rowCount} rows loaded\n`;
        }
        
        alert(successMessage);
      } else {
        alert('Upload failed: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  }, [files]);

  const validateData = useCallback(async () => {
    setValidating(true);
    try {
      const response = await csvAPI.validateData();
      
      if (response.success) {
        setData(prev => ({
          ...prev,
          validationResults: response.validationResults
        }));
        
        const { validRows, invalidRows, totalRows } = response.validationResults;
        if (invalidRows > 0) {
          alert(`Validation failed: ${invalidRows}/${totalRows} rows have errors`);
        } else {
          alert(`Validation passed: All ${totalRows} rows are valid`);
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert('Validation failed: ' + (error.message || 'Unknown error'));
    } finally {
      setValidating(false);
    }
  }, []);

  const exportData = useCallback(async (type = 'both') => {
    try {
      const response = await csvAPI.exportData(type);
      
      // Create download
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      
      const filename = type === 'both' ? 'csv-export.zip' : `${type}.csv`;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`${type === 'both' ? 'Files' : 'File'} exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed: ' + (error.message || 'Unknown error'));
    }
  }, []);

  const hasData = data.strings.length > 0 || data.classifications.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
      <header className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              CSV Data Management Application
            </h1>
            <p className="text-gray-600">
              Upload, validate, and manage CSV data files
            </p>
          </div>
          {hasUnsavedChanges && (
            <div className="bg-warning-100 text-warning-800 px-3 py-2 rounded-lg border border-warning-200 text-sm font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>Unsaved Changes</span>
            </div>
          )}
        </div>
      </header>

      {/* File Upload Section */}
      <section className="card p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
            Upload CSV Files
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Upload your CSV files for data management and validation
          </p>
        </div>
        
       
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Strings File */}
          <div className="border border-gray-200 p-5 rounded-xl bg-gray-50 transition-all duration-200 hover:shadow-md">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900 m-0">Strings File</h3>
                <button
                  onClick={() => downloadTemplate('strings')}
                  className="btn-success text-xs px-2 py-1 flex items-center gap-1"
                >
                  <span>⬇️</span>
                  Template
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <p className="mb-2 font-medium">Required columns:</p>
                <p className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1.5 rounded border">
                  Tier, Industry, Topic, Subtopic, Prefix, Fuzzing-Idx, Prompt, Risks, Keywords
                </p>
              </div>
            </div>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => handleFileChange(e, 'stringsFile')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 hover:bg-gray-50">
                <div className="text-2xl mb-2">📄</div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Choose strings file
                </p>
                <p className="text-xs text-gray-500">
                  Click to browse or drag & drop
                </p>
              </div>
            </div>
            
            {files.stringsFile && (
              <div className="mt-3 p-2 bg-success-50 border border-success-200 rounded-md flex items-center gap-2">
                <span className="text-success-600 text-sm">✓</span>
                <span className="text-sm text-success-800 font-medium flex-1 truncate">
                  {files.stringsFile.name}
                </span>
              </div>
            )}
          </div>

          {/* Classifications File */}
          <div className="border border-gray-200 p-5 rounded-xl bg-gray-50 transition-all duration-200 hover:shadow-md">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900 m-0">Classifications File</h3>
                <button
                  onClick={() => downloadTemplate('classifications')}
                  className="btn-success text-xs px-2 py-1 flex items-center gap-1"
                >
                  <span>⬇️</span>
                  Template
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <p className="mb-2 font-medium">Required columns:</p>
                <p className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1.5 rounded border">
                  Topic, SubTopic, Industry, Classification
                </p>
              </div>
            </div>
            
            <div className="relative">
              <input 
                type="file" 
                accept=".csv"
                onChange={(e) => handleFileChange(e, 'classificationsFile')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white cursor-pointer transition-all duration-200 hover:border-gray-400 hover:bg-gray-50">
                <div className="text-2xl mb-2">📈</div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Choose classifications file
                </p>
                <p className="text-xs text-gray-500">
                  Click to browse or drag & drop
                </p>
              </div>
            </div>
            
            {files.classificationsFile && (
              <div className="mt-3 p-2 bg-success-50 border border-success-200 rounded-md flex items-center gap-2">
                <span className="text-success-600 text-sm">✓</span>
                <span className="text-sm text-success-800 font-medium flex-1 truncate">
                  {files.classificationsFile.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={uploadFiles}
            disabled={uploading || (!files.stringsFile && !files.classificationsFile)}
            className={`
              px-8 py-3.5 rounded-lg font-semibold text-white transition-all duration-200 
              flex items-center gap-2 min-w-40 justify-center
              ${uploading || (!files.stringsFile && !files.classificationsFile) 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'btn-primary shadow-lg hover:shadow-xl'
              }
            `}
          >
            {uploading ? (
              <>
                <div className="loading-spinner w-4 h-4" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <span className="text-base">☁️</span>
                <span>Upload Files</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Data Display and Actions */}
      {hasData && (
        <>
          {/* Validation Section */}
          <section style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            marginBottom: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>Data Validation</h2>
            
            {data.validationResults && (
              <div style={{ 
                padding: '15px', 
                marginBottom: '15px',
                borderRadius: '4px',
                backgroundColor: data.validationResults.isValid ? '#d4edda' : '#f8d7da',
                border: `1px solid ${data.validationResults.isValid ? '#c3e6cb' : '#f5c6cb'}`,
                color: data.validationResults.isValid ? '#155724' : '#721c24'
              }}>
                <strong>
                  {data.validationResults.isValid ? '✓ Validation Passed' : '✗ Validation Failed'}
                </strong>
                <p style={{ margin: '5px 0 0 0' }}>
                  {data.validationResults.validRows} valid, {data.validationResults.invalidRows} invalid 
                  out of {data.validationResults.totalRows} total rows
                </p>
                
                {data.validationResults.errors && data.validationResults.errors.length > 0 && (
                  <div style={{ marginTop: '15px' }}>
                    <strong style={{ color: '#721c24' }}>Validation Errors (must be fixed before saving):</strong>
                    <div style={{ 
                      marginTop: '10px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid #f5c6cb',
                      borderRadius: '4px',
                      backgroundColor: '#f8d7da'
                    }}>
                      {data.validationResults.errors.map((error, index) => {
                        const row = data.strings[error.rowIndex];
                        const topic = row?.Topic || 'N/A';
                        const subtopic = row?.Subtopic || 'N/A';
                        const industry = row?.Industry || 'N/A';
                        
                        return (
                          <div 
                            key={index} 
                            style={{ 
                              padding: '8px 12px',
                              borderBottom: index < data.validationResults.errors.length - 1 ? '1px solid #f5c6cb' : 'none',
                              fontSize: '14px'
                            }}
                          >
                            <div style={{ fontWeight: 'bold', color: '#721c24' }}>
                              Row {error.rowIndex + 1}: {error.message}
                            </div>
                            <div style={{ fontSize: '12px', color: '#856404', marginTop: '2px' }}>
                              Topic: "{topic}", SubTopic: "{subtopic}", Industry: "{industry}"
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '8px 12px',
                      backgroundColor: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#856404'
                    }}>
                      <strong>💡 How to fix:</strong> Each Topic + SubTopic + Industry combination in the strings table must exist in the classifications table. 
                      Add missing combinations to classifications or correct the values in strings.
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                onClick={validateData}
                disabled={validating}
                style={{
                  backgroundColor: validating ? '#ccc' : '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: validating ? 'not-allowed' : 'pointer'
                }}
              >
                {validating ? 'Validating...' : 'Validate Data'}
              </button>
              
              {hasUnsavedChanges && (
                <button 
                  onClick={saveChanges}
                  disabled={saving || (data.validationResults && !data.validationResults.isValid)}
                  style={{
                    backgroundColor: saving || (data.validationResults && !data.validationResults.isValid) ? '#ccc' : '#007bff',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: saving || (data.validationResults && !data.validationResults.isValid) ? 'not-allowed' : 'pointer'
                  }}
                  title={data.validationResults && !data.validationResults.isValid ? 'Fix validation errors before saving' : ''}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </section>

          {/* Data Tables */}
          <section style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            marginBottom: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0 }}>Data Tables</h2>
            
            {/* Strings Table */}
            {data.strings.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Strings Data ({data.strings.length} rows)</h3>
                  <button 
                    onClick={() => addRow('strings')}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    + Add Row
                  </button>
                </div>
                <div style={{ 
                  overflowX: 'auto', 
                  overflowY: 'auto', 
                  maxHeight: '400px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Tier</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Industry</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Topic</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Subtopic</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Prefix</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Fuzzing-Idx</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Prompt</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Risks</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Keywords</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', width: '80px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.strings.map((row, index) => {
                        const columns = ['Tier', 'Industry', 'Topic', 'Subtopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'];
                        const isInvalid = isRowInvalid('strings', index);
                        const errorMessage = getRowErrorMessage('strings', index);
                        
                        return (
                          <tr 
                            key={index}
                            style={{
                              backgroundColor: isInvalid ? '#fee' : 'transparent',
                              borderLeft: isInvalid ? '4px solid #dc3545' : 'none'
                            }}
                            title={errorMessage || ''}
                          >
                            {columns.map((column) => {
                              const cellKey = `strings-${index}-${column}`;
                              const isEditing = editingCell === cellKey;
                              const value = row[column] || '';
                              
                              return (
                                <td 
                                  key={column}
                                  style={{ 
                                    padding: '4px', 
                                    border: isInvalid ? '1px solid #dc3545' : '1px solid #ddd',
                                    maxWidth: column === 'Prompt' ? '200px' : column === 'Keywords' ? '150px' : 'auto',
                                    backgroundColor: isInvalid ? '#ffeaea' : 'transparent'
                                  }}
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={value}
                                      onChange={(e) => handleCellChange('strings', index, column, e.target.value)}
                                      onBlur={handleCellBlur}
                                      onKeyPress={(e) => handleKeyPress(e, 'strings', index, column)}
                                      autoFocus
                                      style={{
                                        width: '100%',
                                        border: 'none',
                                        outline: 'none',
                                        padding: '4px',
                                        fontSize: '14px'
                                      }}
                                    />
                                  ) : (
                                    <div
                                      onClick={() => handleCellClick('strings', index, column)}
                                      style={{
                                        cursor: 'pointer',
                                        padding: '4px',
                                        minHeight: '20px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: column === 'Prompt' || column === 'Keywords' ? 'nowrap' : 'normal'
                                      }}
                                      title={value}
                                    >
                                      {value || <span style={{ color: '#ccc' }}>Click to edit</span>}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <button
                                onClick={() => deleteRow('strings', index)}
                                style={{
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Delete row"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Classifications Table */}
            {data.classifications.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0 }}>Classifications Data ({data.classifications.length} rows)</h3>
                  <button 
                    onClick={() => addRow('classifications')}
                    style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    + Add Row
                  </button>
                </div>
                <div style={{ 
                  overflowX: 'auto', 
                  overflowY: 'auto', 
                  maxHeight: '400px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Topic</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>SubTopic</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Industry</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Classification</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left', width: '80px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.classifications.map((row, index) => {
                        const columns = ['Topic', 'SubTopic', 'Industry', 'Classification'];
                        return (
                          <tr key={index}>
                            {columns.map((column) => {
                              const cellKey = `classifications-${index}-${column}`;
                              const isEditing = editingCell === cellKey;
                              const value = row[column] || '';
                              
                              return (
                                <td 
                                  key={column}
                                  style={{ 
                                    padding: '4px', 
                                    border: '1px solid #ddd'
                                  }}
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={value}
                                      onChange={(e) => handleCellChange('classifications', index, column, e.target.value)}
                                      onBlur={handleCellBlur}
                                      onKeyPress={(e) => handleKeyPress(e, 'classifications', index, column)}
                                      autoFocus
                                      style={{
                                        width: '100%',
                                        border: 'none',
                                        outline: 'none',
                                        padding: '4px',
                                        fontSize: '14px'
                                      }}
                                    />
                                  ) : (
                                    <div
                                      onClick={() => handleCellClick('classifications', index, column)}
                                      style={{
                                        cursor: 'pointer',
                                        padding: '4px',
                                        minHeight: '20px'
                                      }}
                                    >
                                      {value || <span style={{ color: '#ccc' }}>Click to edit</span>}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <button
                                onClick={() => deleteRow('classifications', index)}
                                style={{
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '3px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                                title="Delete row"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Export Section */}
          <section style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            marginBottom: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: hasUnsavedChanges ? '15px' : '0' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>Export Data</h2>
              {hasUnsavedChanges && (
                <div style={{ 
                  backgroundColor: '#fff3cd', 
                  color: '#856404', 
                  padding: '6px 12px', 
                  borderRadius: '4px',
                  border: '1px solid #ffeaa7',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ⚠️ Save changes to enable export
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                onClick={() => exportData('strings')}
                disabled={data.strings.length === 0 || hasUnsavedChanges}
                style={{
                  backgroundColor: (data.strings.length === 0 || hasUnsavedChanges) ? '#ccc' : '#17a2b8',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (data.strings.length === 0 || hasUnsavedChanges) ? 'not-allowed' : 'pointer'
                }}
                title={hasUnsavedChanges ? 'Save your changes before exporting' : ''}
              >
                Export Strings CSV
              </button>
              
              <button 
                onClick={() => exportData('classifications')}
                disabled={data.classifications.length === 0 || hasUnsavedChanges}
                style={{
                  backgroundColor: (data.classifications.length === 0 || hasUnsavedChanges) ? '#ccc' : '#17a2b8',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (data.classifications.length === 0 || hasUnsavedChanges) ? 'not-allowed' : 'pointer'
                }}
                title={hasUnsavedChanges ? 'Save your changes before exporting' : ''}
              >
                Export Classifications CSV
              </button>
              
              <button 
                onClick={() => exportData('both')}
                disabled={(data.strings.length === 0 && data.classifications.length === 0) || hasUnsavedChanges}
                style={{
                  backgroundColor: ((data.strings.length === 0 && data.classifications.length === 0) || hasUnsavedChanges) ? '#ccc' : '#28a745',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: ((data.strings.length === 0 && data.classifications.length === 0) || hasUnsavedChanges) ? 'not-allowed' : 'pointer'
                }}
                title={hasUnsavedChanges ? 'Save your changes before exporting' : ''}
              >
                Export Both as ZIP
              </button>
              
              <div style={{ marginLeft: 'auto' }}>
                <button 
                  onClick={clearData}
                  disabled={data.strings.length === 0 && data.classifications.length === 0}
                  style={{
                    backgroundColor: (data.strings.length === 0 && data.classifications.length === 0) ? '#ccc' : '#dc3545',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (data.strings.length === 0 && data.classifications.length === 0) ? 'not-allowed' : 'pointer'
                  }}
                  title="Clear all data and start fresh"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Empty State */}
      {!hasData && (
        <section style={{ 
          backgroundColor: 'white', 
          padding: '40px', 
          textAlign: 'center',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>No Data Loaded</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Upload your CSV files to get started with data management, validation, and export capabilities.
          </p>
          <div style={{ fontSize: '14px', color: '#888' }}>
            <p>• Supports two file types: Strings and Classifications</p>
            <p>• Real-time validation and error detection</p>
            <p>• Export to CSV or ZIP formats</p>
          </div>
        </section>
      )}
      </div>
    </div>
  );
};

export default CSVManagementApp;