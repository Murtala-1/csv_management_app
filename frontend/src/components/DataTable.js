import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import clsx from 'clsx';

const DataTable = ({ 
  data, 
  type, 
  onUpdateCell, 
  onAddRow, 
  onDeleteRow, 
  validationResults,
  editedCells,
  loading 
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Get headers based on table type
  const headers = useMemo(() => {
    if (type === 'strings') {
      return ['Tier', 'Industry', 'Topic', 'Subtopic', 'Prefix', 'Fuzzing-Idx', 'Prompt', 'Risks', 'Keywords'];
    } else {
      return ['Topic', 'SubTopic', 'Industry', 'Classification'];
    }
  }, [type]);

  // Get validation errors for specific rows
  const getRowValidationError = useCallback((rowIndex) => {
    if (!validationResults || type !== 'strings') return null;
    
    const error = validationResults.errors?.find(err => err.rowIndex === rowIndex);
    return error?.error || null;
  }, [validationResults, type]);

  // Check if a cell has been edited
  const isCellEdited = useCallback((rowIndex, columnKey) => {
    const cellKey = `${type}-${rowIndex}-${columnKey}`;
    return editedCells.has(cellKey);
  }, [editedCells, type]);

  // Start editing a cell
  const startEditing = useCallback((rowIndex, columnKey, currentValue) => {
    setEditingCell({ rowIndex, columnKey });
    setEditValue(currentValue || '');
  }, []);

  // Save cell edit
  const saveEdit = useCallback(() => {
    if (editingCell) {
      onUpdateCell(type, editingCell.rowIndex, editingCell.columnKey, editValue);
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, editValue, onUpdateCell, type]);

  // Cancel cell edit
  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Handle key press in edit mode
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  }, [saveEdit, cancelEdit]);

  // Handle add row
  const handleAddRow = useCallback(() => {
    onAddRow(type);
  }, [onAddRow, type]);

  // Handle delete row
  const handleDeleteRow = useCallback((rowIndex) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
      onDeleteRow(type, rowIndex);
    }
  }, [onDeleteRow, type]);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 loading-spinner" />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {type} Data
          </h3>
          <button
            onClick={handleAddRow}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Row</span>
          </button>
        </div>
        
        <div className="text-center py-12">
          <p className="text-gray-500">No {type} data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Upload a CSV file or add a new row to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 capitalize">
            {type} Data
          </h3>
          <p className="text-sm text-gray-500">
            {data.length} row{data.length !== 1 ? 's' : ''}
            {validationResults && type === 'strings' && (
              <span className={clsx(
                'ml-2 px-2 py-1 rounded-full text-xs font-medium',
                {
                  'bg-success-100 text-success-800': validationResults.isValid,
                  'bg-error-100 text-error-800': !validationResults.isValid,
                }
              )}>
                {validationResults.isValid ? 'All Valid' : `${validationResults.invalidRows} Invalid`}
              </span>
            )}
          </p>
        </div>
        
        <button
          onClick={handleAddRow}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Row</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-cell font-medium text-gray-900 text-left">#</th>
              {headers.map(header => (
                <th key={header} className="table-cell font-medium text-gray-900 text-left">
                  {header}
                </th>
              ))}
              <th className="table-cell font-medium text-gray-900 text-center">Actions</th>
            </tr>
          </thead>
          
          <tbody>
            {data.map((row, rowIndex) => {
              const validationError = getRowValidationError(rowIndex);
              const hasError = !!validationError;
              
              return (
                <tr 
                  key={rowIndex}
                  className={clsx(
                    'hover:bg-gray-50 transition-colors',
                    {
                      'bg-error-50': hasError,
                    }
                  )}
                  title={hasError ? validationError : undefined}
                >
                  {/* Row number */}
                  <td className={clsx(
                    'table-cell font-medium',
                    {
                      'text-error-700': hasError,
                      'text-gray-500': !hasError,
                    }
                  )}>
                    {rowIndex + 1}
                  </td>
                  
                  {/* Data cells */}
                  {headers.map(header => {
                    const cellValue = row[header] || '';
                    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === header;
                    const isEdited = isCellEdited(rowIndex, header);
                    
                    return (
                      <td 
                        key={header}
                        className={clsx(
                          'table-cell relative',
                          {
                            'table-cell-editable': !isEditing,
                            'table-cell-invalid': hasError,
                            'bg-blue-50': isEdited && !hasError,
                          }
                        )}
                        onClick={() => !isEditing && startEditing(rowIndex, header, cellValue)}
                      >
                        {isEditing ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyPress}
                              onBlur={saveEdit}
                              className="input text-sm py-1 px-2 min-w-0 flex-1"
                              autoFocus
                            />
                            <button
                              onClick={saveEdit}
                              className="p-1 text-success-600 hover:text-success-700"
                            >
                              <Save className="w-3 h-3" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between group">
                            <span className="truncate pr-2">
                              {cellValue || (
                                <span className="text-gray-400 italic">Empty</span>
                              )}
                            </span>
                            {isEdited && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                            <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Actions */}
                  <td className="table-cell text-center">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="p-1 text-error-600 hover:text-error-700 transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Validation errors summary for strings table */}
      {type === 'strings' && validationResults && !validationResults.isValid && (
        <div className="p-4 bg-error-50 border-t border-error-200">
          <h4 className="font-medium text-error-900 mb-2">
            Validation Errors ({validationResults.errors.length})
          </h4>
          <div className="max-h-32 overflow-y-auto scrollbar-thin">
            {validationResults.errors.slice(0, 5).map((error, index) => (
              <p key={index} className="text-sm text-error-700 mb-1">
                Row {error.rowIndex + 1}: {error.error}
              </p>
            ))}
            {validationResults.errors.length > 5 && (
              <p className="text-sm text-error-600 italic">
                ... and {validationResults.errors.length - 5} more errors
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;