import { useState, useCallback, useEffect } from 'react';
import { csvAPI } from '../utils/api';
import toast from 'react-hot-toast';

export const useCSVData = () => {
  const [data, setData] = useState({
    strings: [],
    classifications: [],
    validationResults: null,
    lastUpdated: null
  });
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [editedCells, setEditedCells] = useState(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await csvAPI.getData();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload files
  const uploadFiles = useCallback(async (files) => {
    setUploading(true);
    try {
      const formData = new FormData();
      
      if (files.stringsFile) {
        formData.append('stringsFile', files.stringsFile);
      }
      
      if (files.classificationsFile) {
        formData.append('classificationsFile', files.classificationsFile);
      }

      const response = await csvAPI.uploadFiles(formData);
      
      if (response.success) {
        // Reload data to get the updated state
        await loadData();
        
        // Show success message
        const uploadedFiles = [];
        if (response.results.strings?.success) {
          uploadedFiles.push(`Strings (${response.results.strings.rowCount} rows)`);
        }
        if (response.results.classifications?.success) {
          uploadedFiles.push(`Classifications (${response.results.classifications.rowCount} rows)`);
        }
        
        toast.success(`Successfully uploaded: ${uploadedFiles.join(', ')}`);
        
        // Show validation results if available
        if (response.results.validation) {
          const { validRows, invalidRows, totalRows } = response.results.validation;
          if (invalidRows > 0) {
            toast.error(`Validation failed: ${invalidRows}/${totalRows} rows have errors`);
          } else {
            toast.success(`Validation passed: All ${totalRows} rows are valid`);
          }
        }
        
        return response;
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  }, [loadData]);

  // Update cell value
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
    
    // Track edited cell
    const cellKey = `${tableType}-${rowIndex}-${columnKey}`;
    setEditedCells(prev => new Set([...prev, cellKey]));
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
      newRow._rowIndex = tableData.length;
      
      tableData.push(newRow);
      newData[tableType] = tableData;
      
      return newData;
    });
    
    setHasUnsavedChanges(true);
    toast.success(`New row added to ${tableType}`);
  }, []);

  // Delete row
  const deleteRow = useCallback((tableType, rowIndex) => {
    setData(prevData => {
      const newData = { ...prevData };
      const tableData = [...newData[tableType]];
      
      if (rowIndex >= 0 && rowIndex < tableData.length) {
        tableData.splice(rowIndex, 1);
        
        // Update row indices
        tableData.forEach((row, index) => {
          row._rowIndex = index;
        });
        
        newData[tableType] = tableData;
      }
      
      return newData;
    });
    
    setHasUnsavedChanges(true);
    toast.success(`Row deleted from ${tableType}`);
  }, []);

  // Save changes
  const saveChanges = useCallback(async () => {
    setLoading(true);
    try {
      const response = await csvAPI.updateData({
        strings: data.strings,
        classifications: data.classifications
      });
      
      if (response.success) {
        setData(response.data);
        setEditedCells(new Set());
        setHasUnsavedChanges(false);
        toast.success('Changes saved successfully');
        return response;
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [data]);

  // Validate data
  const validateData = useCallback(async () => {
    setValidating(true);
    try {
      const response = await csvAPI.validateData();
      
      if (response.success) {
        setData(prevData => ({
          ...prevData,
          validationResults: response.validationResults
        }));
        
        const { validRows, invalidRows, totalRows } = response.validationResults;
        if (invalidRows > 0) {
          toast.error(`Validation failed: ${invalidRows}/${totalRows} rows have errors`);
        } else {
          toast.success(`Validation passed: All ${totalRows} rows are valid`);
        }
        
        return response.validationResults;
      }
    } catch (error) {
      console.error('Error validating data:', error);
      throw error;
    } finally {
      setValidating(false);
    }
  }, []);

  // Export data
  const exportData = useCallback(async (type = 'both') => {
    setExporting(true);
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
      
      toast.success(`${type === 'both' ? 'Files' : 'File'} exported successfully`);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    } finally {
      setExporting(false);
    }
  }, []);

  // Clear all data
  const clearData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await csvAPI.clearData();
      
      if (response.success) {
        setData({
          strings: [],
          classifications: [],
          validationResults: null,
          lastUpdated: null
        });
        setEditedCells(new Set());
        setHasUnsavedChanges(false);
        toast.success('All data cleared');
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // Data
    data,
    editedCells,
    hasUnsavedChanges,
    
    // Loading states
    loading,
    uploading,
    validating,
    exporting,
    
    // Actions
    loadData,
    uploadFiles,
    updateCell,
    addRow,
    deleteRow,
    saveChanges,
    validateData,
    exportData,
    clearData,
  };
};