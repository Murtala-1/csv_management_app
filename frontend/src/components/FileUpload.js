import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { validateCSVFile, formatFileSize } from '../utils/api';
import clsx from 'clsx';

const FileUpload = ({ onUpload, uploading, disabled }) => {
  const [files, setFiles] = useState({
    stringsFile: null,
    classificationsFile: null
  });
  
  const [fileErrors, setFileErrors] = useState({});

  const onDrop = useCallback((acceptedFiles, rejectedFiles, event) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = {};
      rejectedFiles.forEach(({ file, errors: fileErrors }) => {
        errors[file.name] = fileErrors.map(e => e.message);
      });
      setFileErrors(errors);
      return;
    }

    // Clear previous errors
    setFileErrors({});

    // Process accepted files
    acceptedFiles.forEach(file => {
      const validation = validateCSVFile(file);
      
      if (!validation.isValid) {
        setFileErrors(prev => ({
          ...prev,
          [file.name]: validation.errors
        }));
        return;
      }

      // Determine file type based on user selection or content analysis
      // For now, we'll let the user specify which file is which
      // This could be enhanced with content-based detection
      
      // If we only have one file slot empty, use that
      if (!files.stringsFile && files.classificationsFile) {
        setFiles(prev => ({ ...prev, stringsFile: file }));
      } else if (!files.classificationsFile && files.stringsFile) {
        setFiles(prev => ({ ...prev, classificationsFile: file }));
      } else {
        // If both slots are empty or full, default to strings
        setFiles(prev => ({ ...prev, stringsFile: file }));
      }
    });
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 2,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: disabled || uploading
  });

  const removeFile = (fileType) => {
    setFiles(prev => ({ ...prev, [fileType]: null }));
    setFileErrors(prev => {
      const newErrors = { ...prev };
      if (files[fileType]) {
        delete newErrors[files[fileType].name];
      }
      return newErrors;
    });
  };

  const swapFiles = () => {
    setFiles(prev => ({
      stringsFile: prev.classificationsFile,
      classificationsFile: prev.stringsFile
    }));
  };

  const handleUpload = () => {
    if (!files.stringsFile && !files.classificationsFile) {
      return;
    }

    const uploadFiles = {};
    if (files.stringsFile) uploadFiles.stringsFile = files.stringsFile;
    if (files.classificationsFile) uploadFiles.classificationsFile = files.classificationsFile;

    onUpload(uploadFiles);
  };

  const hasFiles = files.stringsFile || files.classificationsFile;
  const hasErrors = Object.keys(fileErrors).length > 0;
  const canUpload = hasFiles && !hasErrors && !uploading;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Upload CSV Files
      </h2>
      
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          {
            'border-primary-300 bg-primary-50': isDragActive,
            'border-gray-300 hover:border-gray-400': !isDragActive && !disabled,
            'border-gray-200 bg-gray-50 cursor-not-allowed': disabled || uploading,
          }
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center">
          <Upload className={clsx(
            'w-12 h-12 mb-4',
            {
              'text-primary-500': isDragActive,
              'text-gray-400': !isDragActive && !disabled,
              'text-gray-300': disabled || uploading,
            }
          )} />
          
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop files here' : 'Drag & drop CSV files here'}
          </p>
          
          <p className="text-sm text-gray-500 mb-4">
            or click to select files (max 10MB each)
          </p>
          
          <div className="text-xs text-gray-400">
            <p>Expected formats:</p>
            <p>• Strings: Tier, Industry, Topic, Subtopic, Prefix, Fuzzing-Idx, Prompt, Risks, Keywords</p>
            <p>• Classifications: Topic, SubTopic, Industry, Classification</p>
          </div>
        </div>
      </div>

      {/* File Assignment */}
      {hasFiles && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">File Assignment</h3>
            {files.stringsFile && files.classificationsFile && (
              <button
                onClick={swapFiles}
                className="text-sm text-primary-600 hover:text-primary-700"
                disabled={uploading}
              >
                Swap Files
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strings File */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Strings File</h4>
                {files.stringsFile && (
                  <button
                    onClick={() => removeFile('stringsFile')}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {files.stringsFile ? (
                <div className="flex items-center space-x-2">
                  <File className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {files.stringsFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(files.stringsFile.size)}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-success-500" />
                </div>
              ) : (
                <p className="text-sm text-gray-500">No file selected</p>
              )}
            </div>

            {/* Classifications File */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Classifications File</h4>
                {files.classificationsFile && (
                  <button
                    onClick={() => removeFile('classificationsFile')}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {files.classificationsFile ? (
                <div className="flex items-center space-x-2">
                  <File className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {files.classificationsFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(files.classificationsFile.size)}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-success-500" />
                </div>
              ) : (
                <p className="text-sm text-gray-500">No file selected</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {hasErrors && (
        <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-4 h-4 text-error-600 mr-2" />
            <h4 className="font-medium text-error-900">File Errors</h4>
          </div>
          {Object.entries(fileErrors).map(([fileName, errors]) => (
            <div key={fileName} className="mb-2 last:mb-0">
              <p className="font-medium text-error-900">{fileName}:</p>
              <ul className="list-disc list-inside text-sm text-error-700">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {hasFiles && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!canUpload}
            className={clsx(
              'btn flex items-center space-x-2',
              {
                'btn-primary': canUpload,
                'bg-gray-300 text-gray-500 cursor-not-allowed': !canUpload,
              }
            )}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 loading-spinner" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Files</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;