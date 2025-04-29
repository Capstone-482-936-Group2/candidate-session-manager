// FormField.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FormField from './FormField';

describe('FormField', () => {
  const basicOnChange = jest.fn();

  it('renders text input correctly', () => {
    render(
      <FormField
        field={{ id: 'text1', type: 'text', label: 'Text Input' }}
        value="hello"
        onChange={basicOnChange}
        error={null}
      />
    );
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument();
  });

  it('renders textarea correctly', () => {
    render(
      <FormField
        field={{ id: 'textarea1', type: 'textarea', label: 'Textarea Input' }}
        value="multiline"
        onChange={basicOnChange}
        error={null}
      />
    );
    expect(screen.getByDisplayValue('multiline')).toBeInTheDocument();
  });

  it('renders select input correctly', () => {
    render(
      <FormField
        field={{
          id: 'select1',
          type: 'select',
          label: 'Select Input',
          options: [{ label: 'Option 1' }, { label: 'Option 2' }]
        }}
        value="Option 1"
        onChange={basicOnChange}
        error={null}
      />
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('renders radio input correctly', () => {
    render(
      <FormField
        field={{
          id: 'radio1',
          type: 'radio',
          label: 'Radio Input',
          options: [{ label: 'A' }, { label: 'B' }]
        }}
        value="A"
        onChange={basicOnChange}
        error={null}
      />
    );
    expect(screen.getByDisplayValue('A')).toBeInTheDocument();
  });

  it('renders checkbox input correctly', () => {
    render(
      <FormField
        field={{
          id: 'checkbox1',
          type: 'checkbox',
          label: 'Checkbox Input',
          options: [{ label: 'X' }, { label: 'Y' }]
        }}
        value={["X"]}
        onChange={basicOnChange}
        error={null}
      />
    );
    expect(screen.getByLabelText('X')).toBeChecked();
    expect(screen.getByLabelText('Y')).not.toBeChecked();
  });

  it('renders date input correctly', () => {
    render(
      <FormField
        field={{ id: 'date1', type: 'date', label: 'Date Input' }}
        value="2025-04-28"
        onChange={basicOnChange}
        error={null}
      />
    );
    expect(screen.getByDisplayValue('2025-04-28')).toBeInTheDocument();
  });

  it('renders date range input correctly', () => {
    render(
      <FormField
        field={{ id: 'daterange1', type: 'date_range', label: 'Date Range Input' }}
        value={{ startDate: '2025-04-01', endDate: '2025-04-30' }}
        onChange={basicOnChange}
        error={null}
      />
    );
    expect(screen.getByDisplayValue('2025-04-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-04-30')).toBeInTheDocument();
  });

  it('handles unknown field type gracefully', () => {
    render(
      <FormField
        field={{ id: 'unknown', type: 'unknown', label: 'Unknown Field' }}
        value={null}
        onChange={basicOnChange}
        error={null}
      />
    );
    
    // Label should still render
    expect(screen.getByText('Unknown Field')).toBeInTheDocument();
  
    // But there should be no input, select, or textarea
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
  });
  it('displays error message when error prop is provided', () => {
    render(
      <FormField
        field={{ id: 'text-error', type: 'text', label: 'Error Field' }}
        value=""
        onChange={basicOnChange}
        error="This field is required."
      />
    );
  
    // Check the error text is displayed
    expect(screen.getByText('This field is required.')).toBeInTheDocument();
  });
  it('calls onChange correctly when select value changes', () => {
    const handleChange = jest.fn();
  
    render(
      <FormField
        field={{
          id: 'select2',
          type: 'select',
          label: 'Select Field',
          options: [{ label: 'Option A' }, { label: 'Option B' }]
        }}
        value=""
        onChange={handleChange}
        error={null}
      />
    );
  
    // Correct way: use role="combobox" to find the Select
    fireEvent.mouseDown(screen.getByRole('combobox'));
  
    // Now click on Option B
    fireEvent.click(screen.getByText('Option B'));
  
    expect(handleChange).toHaveBeenCalledWith('select2', 'Option B');
  });
  
  it('updates checkbox group correctly when selecting and deselecting options', () => {
    const handleChange = jest.fn();
  
    render(
      <FormField
        field={{
          id: 'checkbox2',
          type: 'checkbox',
          label: 'Checkbox Group',
          options: [{ label: 'Item 1' }, { label: 'Item 2' }]
        }}
        value={['Item 1']}
        onChange={handleChange}
        error={null}
      />
    );
  
    // Deselect 'Item 1' (it was selected initially)
    fireEvent.click(screen.getByLabelText('Item 1'));
    expect(handleChange).toHaveBeenCalledWith('checkbox2', []);
  
    // Select 'Item 2'
    fireEvent.click(screen.getByLabelText('Item 2'));
    expect(handleChange).toHaveBeenCalledWith('checkbox2', ['Item 1', 'Item 2']); // Note: based on your logic, could be [Item 2] if starting from scratch
  });
  it('updates date range correctly when start and end dates change', () => {
    const handleChange = jest.fn();
  
    render(
      <FormField
        field={{
          id: 'dateRangeField',
          type: 'date_range',
          label: 'Date Range',
        }}
        value={{ startDate: '2025-04-01', endDate: '2025-04-30' }}
        onChange={handleChange}
        error={null}
      />
    );
  
    // Change start date
    fireEvent.change(screen.getByLabelText('Start Date'), {
      target: { value: '2025-04-05' },
    });
  
    expect(handleChange).toHaveBeenCalledWith('dateRangeField', {
      startDate: '2025-04-05',
      endDate: '2025-04-30',
    });
  
    // Now, simulate changing the end date
    fireEvent.change(screen.getByLabelText('End Date'), {
      target: { value: '2025-05-10' },
    });
  
    expect(handleChange).toHaveBeenCalledWith('dateRangeField', {
      startDate: '2025-04-01', // Start date remains from original props, because no rerender
      endDate: '2025-05-10',
    });
  });
  it('calls onChange correctly when text input value changes', () => {
    const handleChange = jest.fn();
  
    render(
      <FormField
        field={{ id: 'text2', type: 'text', label: 'Text Input' }}
        value=""
        onChange={handleChange}
        error={null}
      />
    );
  
    // Simulate user typing into the input
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'new value' },
    });
  
    // onChange should be called with field id and new value
    expect(handleChange).toHaveBeenCalledWith('text2', 'new value');
  });
  it('calls onChange correctly when selecting a radio button option', () => {
    const handleChange = jest.fn();
  
    render(
      <FormField
        field={{
          id: 'radio2',
          type: 'radio',
          label: 'Radio Group',
          options: [{ label: 'Option 1' }, { label: 'Option 2' }],
        }}
        value=""
        onChange={handleChange}
        error={null}
      />
    );
  
    // Simulate user selecting "Option 2"
    fireEvent.click(screen.getByLabelText('Option 2'));
  
    // Expect onChange to be called correctly
    expect(handleChange).toHaveBeenCalledWith('radio2', 'Option 2');
  });
      
  
});
