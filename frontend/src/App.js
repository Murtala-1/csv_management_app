import React from 'react';
import { Database, FileSpreadsheet } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import ValidationPanel from './components/ValidationPanel';
import ExportControls from './components/ExportControls';
import { useCSVData } from './hooks/useCSVData';


function App() {
  const {
    data,
    editedCells,
    hasUnsavedChanges,
    loading,
    uploading,
    validating,
    exporting,
    uploadFiles,
    updateCell,
    addRow,
    deleteRow,
    saveChanges,
    validateData,
    exportData,
    clearData,
  } = useCSVData();

  const hasData = {
    strings: data.strings.length,
    classifications: data.classifications.length,
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    CSV Data Management
                  </h1>
                  <p className="text-sm text-gray-500">
                    Upload, validate, and manage CSV data files
                  </p>
                </div>
              </div>
              
              {/* Status Indicators */}
              <div className="flex items-center space-x-4">
                {hasUnsavedChanges && (
                  <div className="flex items-center space-x-2 text-warning-600">
                    <div className="w-2 h-2 bg-warning-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Unsaved Changes</span>
                  </div>
                )}
                
                {data.validationResults && (
                  <div className={`flex items-center space-x-2 ${
                    data.validationResults.isValid ? 'text-success-600' : 'text-error-600'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      data.validationResults.isValid ? 'bg-success-500' : 'bg-error-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {data.validationResults.isValid ? 'Valid' : 'Has Errors'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* File Upload Section */}
            <section>
              <FileUpload
                onUpload={uploadFiles}
                uploading={uploading}
                disabled={loading}
              />
            </section>

            {/* Data Management Section */}
            {(hasData.strings > 0 || hasData.classifications > 0) && (
              <>
                {/* Validation Panel */}
                <section>
                  <ValidationPanel
                    validationResults={data.validationResults}
                    onValidate={validateData}
                    validating={validating}
                    hasData={hasData}
                  />
                </section>

                {/* Data Tables and Export Controls */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                  {/* Data Tables */}
                  <div className="xl:col-span-3 space-y-8">
                    {/* Strings Table */}
                    {hasData.strings > 0 && (
                      <section>
                        <DataTable
                          data={data.strings}
                          type="strings"
                          onUpdateCell={updateCell}
                          onAddRow={addRow}
                          onDeleteRow={deleteRow}
                          validationResults={data.validationResults}
                          editedCells={editedCells}
                          loading={loading}
                        />
                      </section>
                    )}

                    {/* Classifications Table */}
                    {hasData.classifications > 0 && (
                      <section>
                        <DataTable
                          data={data.classifications}
                          type="classifications"
                          onUpdateCell={updateCell}
                          onAddRow={addRow}
                          onDeleteRow={deleteRow}
                          validationResults={null}
                          editedCells={editedCells}
                          loading={loading}
                        />
                      </section>
                    )}
                  </div>

                  {/* Export Controls Sidebar */}
                  <div className="xl:col-span-1">
                    <div className="sticky top-8">
                      <ExportControls
                        onExport={exportData}
                        onClear={clearData}
                        onSave={saveChanges}
                        exporting={exporting}
                        saving={loading}
                        hasData={hasData}
                        validationResults={data.validationResults}
                        hasUnsavedChanges={hasUnsavedChanges}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Empty State */}
            {!hasData.strings && !hasData.classifications && !uploading && (
              <section className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    No Data Loaded
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Upload your CSV files to get started with data management, 
                    validation, and export capabilities.
                  </p>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>• Supports two file types: Strings and Classifications</p>
                    <p>• Real-time validation and error detection</p>
                    <p>• Inline editing with auto-save</p>
                    <p>• Export to CSV or ZIP formats</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                CSV Data Management Application
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Built with React & Node.js</span>
                {data.lastUpdated && (
                  <span>
                    Last updated: {new Date(data.lastUpdated).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;