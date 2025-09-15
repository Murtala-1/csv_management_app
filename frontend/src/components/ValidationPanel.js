import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import clsx from 'clsx';

const ValidationPanel = ({ 
  validationResults, 
  onValidate, 
  validating, 
  hasData 
}) => {
  if (!hasData.strings || !hasData.classifications) {
    return (
      <div className="card p-6">
        <div className="flex items-center space-x-3">
          <Info className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-medium text-gray-900">Data Validation</h3>
            <p className="text-sm text-gray-500">
              Upload both strings and classifications files to enable validation
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getValidationIcon = () => {
    if (!validationResults) {
      return <AlertTriangle className="w-5 h-5 text-warning-500" />;
    }
    
    return validationResults.isValid 
      ? <CheckCircle className="w-5 h-5 text-success-500" />
      : <XCircle className="w-5 h-5 text-error-500" />;
  };

  const getValidationStatus = () => {
    if (!validationResults) {
      return {
        title: 'Validation Required',
        description: 'Click validate to check data integrity',
        color: 'warning'
      };
    }
    
    if (validationResults.isValid) {
      return {
        title: 'Validation Passed',
        description: `All ${validationResults.totalRows} rows are valid`,
        color: 'success'
      };
    }
    
    return {
      title: 'Validation Failed',
      description: `${validationResults.invalidRows} of ${validationResults.totalRows} rows have errors`,
      color: 'error'
    };
  };

  const status = getValidationStatus();

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getValidationIcon()}
          <div>
            <h3 className="font-medium text-gray-900">{status.title}</h3>
            <p className="text-sm text-gray-500">{status.description}</p>
          </div>
        </div>
        
        <button
          onClick={onValidate}
          disabled={validating}
          className={clsx(
            'btn flex items-center space-x-2',
            {
              'btn-primary': !validating,
              'bg-gray-300 text-gray-500 cursor-not-allowed': validating,
            }
          )}
        >
          {validating ? (
            <>
              <div className="w-4 h-4 loading-spinner" />
              <span>Validating...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Validate</span>
            </>
          )}
        </button>
      </div>

      {/* Validation Statistics */}
      {validationResults && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {validationResults.totalRows}
            </div>
            <div className="text-sm text-gray-500">Total Rows</div>
          </div>
          
          <div className="bg-success-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-success-700">
              {validationResults.validRows}
            </div>
            <div className="text-sm text-success-600">Valid Rows</div>
          </div>
          
          <div className="bg-error-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-error-700">
              {validationResults.invalidRows}
            </div>
            <div className="text-sm text-error-600">Invalid Rows</div>
          </div>
        </div>
      )}

      {/* Validation Rules */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-blue-900 mb-2">Validation Rules</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Every Topic + SubTopic + Industry combination in Strings must exist in Classifications</li>
          <li>• All required fields must be present and non-empty</li>
          <li>• Data types must match expected formats</li>
        </ul>
      </div>

      {/* Error Details */}
      {validationResults && !validationResults.isValid && (
        <div className="border border-error-200 rounded-lg">
          <div className="bg-error-50 px-4 py-3 border-b border-error-200">
            <h4 className="font-medium text-error-900">
              Validation Errors ({validationResults.errors.length})
            </h4>
          </div>
          
          <div className="max-h-64 overflow-y-auto scrollbar-thin">
            {validationResults.errors.map((error, index) => (
              <div 
                key={index}
                className="px-4 py-3 border-b border-error-100 last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-error-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-error-700">
                      {error.rowIndex + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-error-900 font-medium">
                      Row {error.rowIndex + 1}
                    </p>
                    <p className="text-sm text-error-700 mt-1">
                      {error.error}
                    </p>
                    {error.row && (
                      <div className="mt-2 text-xs text-error-600">
                        <span className="font-medium">Data:</span> 
                        Topic: "{error.row.Topic}", 
                        SubTopic: "{error.row.Subtopic}", 
                        Industry: "{error.row.Industry}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {validationResults.errors.length > 10 && (
            <div className="px-4 py-3 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">
                Showing first 10 errors. Fix these and re-validate to see more.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {validationResults && validationResults.isValid && (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <div>
              <h4 className="font-medium text-success-900">All Data Valid!</h4>
              <p className="text-sm text-success-700">
                All {validationResults.totalRows} rows passed validation. 
                Your data is ready for export.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationPanel;