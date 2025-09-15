import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataTable from '../../src/components/DataTable';

describe('DataTable Component', () => {
  const mockOnUpdateCell = jest.fn();
  const mockOnAddRow = jest.fn();
  const mockOnDeleteRow = jest.fn();

  const sampleStringsData = [
    {
      Tier: '1',
      Industry: 'Tech',
      Topic: 'AI',
      Subtopic: 'Machine Learning',
      Prefix: 'ML',
      'Fuzzing-Idx': '1',
      Prompt: 'Test prompt',
      Risks: 'Low',
      Keywords: 'ai ml',
      _rowIndex: 0
    },
    {
      Tier: '2',
      Industry: 'Finance',
      Topic: 'Banking',
      Subtopic: 'Loans',
      Prefix: 'BL',
      'Fuzzing-Idx': '2',
      Prompt: 'Another prompt',
      Risks: 'Medium',
      Keywords: 'bank loan',
      _rowIndex: 1
    }
  ];

  const sampleClassificationsData = [
    {
      Topic: 'AI',
      SubTopic: 'Machine Learning',
      Industry: 'Tech',
      Classification: 'Technical',
      _rowIndex: 0
    }
  ];

  const defaultProps = {
    data: sampleStringsData,
    type: 'strings',
    onUpdateCell: mockOnUpdateCell,
    onAddRow: mockOnAddRow,
    onDeleteRow: mockOnDeleteRow,
    validationResults: null,
    editedCells: new Set(),
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders table with data', () => {
    render(<DataTable {...defaultProps} />);
    
    expect(screen.getByText('Strings Data')).toBeInTheDocument();
    expect(screen.getByText('2 rows')).toBeInTheDocument();
    expect(screen.getByText('Add Row')).toBeInTheDocument();
  });

  test('renders correct headers for strings table', () => {
    render(<DataTable {...defaultProps} />);
    
    expect(screen.getByText('Tier')).toBeInTheDocument();
    expect(screen.getByText('Industry')).toBeInTheDocument();
    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.getByText('Subtopic')).toBeInTheDocument();
    expect(screen.getByText('Prefix')).toBeInTheDocument();
    expect(screen.getByText('Fuzzing-Idx')).toBeInTheDocument();
    expect(screen.getByText('Prompt')).toBeInTheDocument();
    expect(screen.getByText('Risks')).toBeInTheDocument();
    expect(screen.getByText('Keywords')).toBeInTheDocument();
  });

  test('renders correct headers for classifications table', () => {
    render(<DataTable 
      {...defaultProps} 
      data={sampleClassificationsData}
      type="classifications"
    />);
    
    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.getByText('SubTopic')).toBeInTheDocument();
    expect(screen.getByText('Industry')).toBeInTheDocument();
    expect(screen.getByText('Classification')).toBeInTheDocument();
  });

  test('displays data in table cells', () => {
    render(<DataTable {...defaultProps} />);
    
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Machine Learning')).toBeInTheDocument();
    expect(screen.getByText('Test prompt')).toBeInTheDocument();
  });

  test('handles add row button click', () => {
    render(<DataTable {...defaultProps} />);
    
    const addButton = screen.getByText('Add Row');
    fireEvent.click(addButton);
    
    expect(mockOnAddRow).toHaveBeenCalledWith('strings');
  });

  test('handles delete row button click', () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    render(<DataTable {...defaultProps} />);
    
    const deleteButtons = screen.getAllByTitle('Delete row');
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this row?');
    expect(mockOnDeleteRow).toHaveBeenCalledWith('strings', 0);
  });

  test('does not delete row when confirmation is cancelled', () => {
    window.confirm = jest.fn(() => false);
    
    render(<DataTable {...defaultProps} />);
    
    const deleteButtons = screen.getAllByTitle('Delete row');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockOnDeleteRow).not.toHaveBeenCalled();
  });

  test('shows loading state', () => {
    render(<DataTable {...defaultProps} loading={true} />);
    
    // Should show loading spinner
    expect(screen.getByRole('generic')).toHaveClass('loading-spinner');
  });

  test('shows empty state when no data', () => {
    render(<DataTable {...defaultProps} data={[]} />);
    
    expect(screen.getByText('No strings data available')).toBeInTheDocument();
    expect(screen.getByText('Upload a CSV file or add a new row to get started')).toBeInTheDocument();
  });

  test('handles cell editing', async () => {
    render(<DataTable {...defaultProps} />);
    
    // Click on a cell to start editing
    const cell = screen.getByText('Tech');
    fireEvent.click(cell);
    
    // Should show input field
    await waitFor(() => {
      expect(screen.getByDisplayValue('Tech')).toBeInTheDocument();
    });
  });

  test('shows validation errors', () => {
    const validationResults = {
      isValid: false,
      errors: [
        {
          rowIndex: 0,
          error: 'Test validation error'
        }
      ],
      invalidRows: 1,
      totalRows: 2
    };

    render(<DataTable 
      {...defaultProps} 
      validationResults={validationResults}
    />);
    
    expect(screen.getByText('1 Invalid')).toBeInTheDocument();
  });

  test('highlights edited cells', () => {
    const editedCells = new Set(['strings-0-Industry']);
    
    render(<DataTable 
      {...defaultProps} 
      editedCells={editedCells}
    />);
    
    // The edited cell should have special styling
    // This would need to be tested based on the actual CSS classes applied
  });

  test('shows row numbers', () => {
    render(<DataTable {...defaultProps} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('handles keyboard navigation in edit mode', async () => {
    render(<DataTable {...defaultProps} />);
    
    // Click on a cell to start editing
    const cell = screen.getByText('Tech');
    fireEvent.click(cell);
    
    await waitFor(() => {
      const input = screen.getByDisplayValue('Tech');
      
      // Test Enter key to save
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(mockOnUpdateCell).toHaveBeenCalled();
    });
  });

  test('handles escape key to cancel edit', async () => {
    render(<DataTable {...defaultProps} />);
    
    const cell = screen.getByText('Tech');
    fireEvent.click(cell);
    
    await waitFor(() => {
      const input = screen.getByDisplayValue('Tech');
      
      // Test Escape key to cancel
      fireEvent.keyDown(input, { key: 'Escape' });
      
      // Input should be gone
      expect(screen.queryByDisplayValue('Tech')).not.toBeInTheDocument();
    });
  });
});