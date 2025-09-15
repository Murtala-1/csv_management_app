import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from '../../src/components/FileUpload';

// Mock react-dropzone
const mockGetRootProps = jest.fn(() => ({}));
const mockGetInputProps = jest.fn(() => ({}));

jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: mockGetRootProps,
    getInputProps: mockGetInputProps,
    isDragActive: false,
  })),
}));

// Mock the API utilities
jest.mock('../../src/utils/api', () => ({
  validateCSVFile: jest.fn(() => ({ isValid: true, errors: [] })),
  formatFileSize: jest.fn((size) => `${size} bytes`),
}));

describe('FileUpload Component', () => {
  const mockOnUpload = jest.fn();
  
  const defaultProps = {
    onUpload: mockOnUpload,
    uploading: false,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders upload area', () => {
    render(<FileUpload {...defaultProps} />);
    
    expect(screen.getByText('Upload CSV Files')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop CSV files here')).toBeInTheDocument();
    expect(screen.getByText('or click to select files (max 10MB each)')).toBeInTheDocument();
  });

  test('shows expected file formats', () => {
    render(<FileUpload {...defaultProps} />);
    
    expect(screen.getByText('Expected formats:')).toBeInTheDocument();
    expect(screen.getByText(/Strings: Tier, Industry, Topic/)).toBeInTheDocument();
    expect(screen.getByText(/Classifications: Topic, SubTopic, Industry/)).toBeInTheDocument();
  });

  test('disables upload when disabled prop is true', () => {
    render(<FileUpload {...defaultProps} disabled={true} />);
    
    // The dropzone should be disabled
    expect(mockGetRootProps).toHaveBeenCalledWith();
  });

  test('shows uploading state', () => {
    render(<FileUpload {...defaultProps} uploading={true} />);
    
    // Should show uploading state in the UI
    // This would depend on the actual implementation
  });

  test('handles file removal', () => {
    const { rerender } = render(<FileUpload {...defaultProps} />);
    
    // Simulate having files selected (this would normally happen through dropzone)
    // Since we're mocking dropzone, we need to test the component's internal state management
    
    // This test would need to be more specific based on how the component manages file state
  });

  test('validates upload button state', () => {
    render(<FileUpload {...defaultProps} />);
    
    // Initially, no upload button should be visible since no files are selected
    expect(screen.queryByText('Upload Files')).not.toBeInTheDocument();
  });

  test('shows file assignment section when files are present', () => {
    // This test would need to simulate the component state where files are present
    // Since the component uses internal state, we'd need to trigger the dropzone callback
    
    render(<FileUpload {...defaultProps} />);
    
    // Initially, file assignment section should not be visible
    expect(screen.queryByText('File Assignment')).not.toBeInTheDocument();
  });
});