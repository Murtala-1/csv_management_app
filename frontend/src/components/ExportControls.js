import React from 'react';
import { Download, FileText, Archive, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const ExportControls = ({ 
  onExport, 
  onClear, 
  exporting, 
  hasData, 
  validationResults,
  hasUnsavedChanges,
  onSave,
  saving 
}) => {
  const canExport = (hasData.strings || hasData.classifications) && !exporting;
  const hasValidationErrors = validationResults && !validationResults.isValid;

  const handleExport = (type) => {
    if (hasValidationErrors && type !== 'classifications') {
      const proceed = window.confirm(
        'Your data has validation errors. Do you want to export anyway? ' +
        'Invalid rows may cause issues when importing the data elsewhere.'
      );
      if (!proceed) return;
    }
    
    onExport(type);
  };

  const handleClear = () => {
    const message = hasUnsavedChanges 
      ? 'You have unsaved changes. Are you sure you want to clear all data? This action cannot be undone.'
      : 'Are you sure you want to clear all data? This action cannot be undone.';
      
    if (window.confirm(message)) {
      onClear();
    }
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Export & Actions
      </h3>

      {/* Save Changes */}
      {hasUnsavedChanges && (
        <div className="mb-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-warning-900">Unsaved Changes</h4>
              <p className="text-sm text-warning-700">
                You have unsaved changes. Save them before exporting.
              </p>
            </div>
            <button
              onClick={onSave}
              disabled={saving}
              className={clsx(
                'btn flex items-center space-x-2',
                {
                  'btn-warning': !saving,
                  'bg-gray-300 text-gray-500 cursor-not-allowed': saving,
                }
              )}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 loading-spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Validation Warning */}
      {hasValidationErrors && (
        <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg">
          <h4 className="font-medium text-error-900 mb-1">Validation Errors</h4>
          <p className="text-sm text-error-700">
            Your data has {validationResults.invalidRows} validation errors. 
            Consider fixing them before exporting.
          </p>
        </div>
      )}

      {/* Export Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Export Options</h4>
        
        {/* Export Both Files */}
        <button
          onClick={() => handleExport('both')}
          disabled={!canExport || (!hasData.strings && !hasData.classifications)}
          className={clsx(
            'w-full btn flex items-center justify-center space-x-2',
            {
              'btn-primary': canExport && (hasData.strings || hasData.classifications),
              'bg-gray-300 text-gray-500 cursor-not-allowed': !canExport || (!hasData.strings && !hasData.classifications),
            }
          )}
        >
          {exporting ? (
            <>
              <div className="w-4 h-4 loading-spinner" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Archive className="w-4 h-4" />
              <span>Export Both Files (ZIP)</span>
            </>
          )}
        </button>

        {/* Export Individual Files */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleExport('strings')}
            disabled={!canExport || !hasData.strings}
            className={clsx(
              'btn flex items-center justify-center space-x-2',
              {
                'btn-secondary': canExport && hasData.strings,
                'bg-gray-200 text-gray-400 cursor-not-allowed': !canExport || !hasData.strings,
              }
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Export Strings</span>
          </button>

          <button
            onClick={() => handleExport('classifications')}
            disabled={!canExport || !hasData.classifications}
            className={clsx(
              'btn flex items-center justify-center space-x-2',
              {
                'btn-secondary': canExport && hasData.classifications,
                'bg-gray-200 text-gray-400 cursor-not-allowed': !canExport || !hasData.classifications,
              }
            )}
          >
            <FileText className="w-4 h-4" />
            <span>Export Classifications</span>
          </button>
        </div>
      </div>

      {/* Data Summary */}
      {(hasData.strings || hasData.classifications) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Data Summary</h4>
          <div className="space-y-2 text-sm">
            {hasData.strings && (
              <div className="flex justify-between">
                <span className="text-gray-600">Strings rows:</span>
                <span className="font-medium text-gray-900">{hasData.strings}</span>
              </div>
            )}
            {hasData.classifications && (
              <div className="flex justify-between">
                <span className="text-gray-600">Classifications rows:</span>
                <span className="font-medium text-gray-900">{hasData.classifications}</span>
              </div>
            )}
            {validationResults && (
              <div className="flex justify-between">
                <span className="text-gray-600">Validation status:</span>
                <span className={clsx(
                  'font-medium',
                  {
                    'text-success-600': validationResults.isValid,
                    'text-error-600': !validationResults.isValid,
                  }
                )}>
                  {validationResults.isValid ? 'All Valid' : `${validationResults.invalidRows} Errors`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clear Data */}
      {(hasData.strings || hasData.classifications) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleClear}
            className="w-full btn-error flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Data</span>
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            This will remove all uploaded data and cannot be undone
          </p>
        </div>
      )}

      {/* No Data Message */}
      {!hasData.strings && !hasData.classifications && (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No data available for export</p>
          <p className="text-sm text-gray-400">Upload CSV files to enable export options</p>
        </div>
      )}
    </div>
  );
};

export default ExportControls;