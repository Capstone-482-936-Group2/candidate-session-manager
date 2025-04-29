import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddSessionDialog from './AddSessionDialog';

// Wrap the component with LocalizationProvider for date pickers
const AllTheProviders = ({ children }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {children}
    </LocalizationProvider>
  );
};

describe('AddSessionDialog', () => {
  it('should render all form fields and handle submission', async () => {
    // Mock functions for props
    const onCloseMock = jest.fn();
    const onSubmitMock = jest.fn();

    // Render dialog with required props
    render(
      <AddSessionDialog 
        open={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
      />,
      { wrapper: AllTheProviders }
    );

    // Verify all form fields are present
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I need help arranging transportation/i)).toBeInTheDocument();

    // Fill out the form
    await userEvent.type(screen.getByLabelText(/Description/i), 'Test session description');
    await userEvent.type(screen.getByLabelText(/Location/i), 'Test location');
    await userEvent.click(screen.getByLabelText(/I need help arranging transportation/i));

    // Submit the form
    await userEvent.click(screen.getByText('Schedule Session'));

    // Verify submission and dialog close
    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    expect(onSubmitMock).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Test session description',
      location: 'Test location',
      needs_transportation: true
    }));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
  it('renders all form fields when dialog is open', () => {
    render(
      <AddSessionDialog open={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      { wrapper: AllTheProviders }
    );
  
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I need help arranging transportation/i)).toBeInTheDocument();
  });
  it('does not render anything when dialog is closed', () => {
    render(
      <AddSessionDialog open={false} onClose={jest.fn()} onSubmit={jest.fn()} />,
      { wrapper: AllTheProviders }
    );
  
    // Should NOT find any form fields or the dialog
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Description/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Location/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Start Time/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/End Time/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/I need help arranging transportation/i)).not.toBeInTheDocument();
  });
  it('allows typing into the Description field', async () => {
    render(
      <AddSessionDialog open={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      { wrapper: AllTheProviders }
    );
  
    const descriptionField = screen.getByLabelText(/Description/i);
  
    await userEvent.clear(descriptionField);
    await userEvent.type(descriptionField, 'This is a test description');
  
    expect(descriptionField).toHaveValue('This is a test description');
  });
  it('allows typing into the Location field', async () => {
    render(
      <AddSessionDialog open={true} onClose={jest.fn()} onSubmit={jest.fn()} />,
      { wrapper: AllTheProviders }
    );
  
    const locationField = screen.getByLabelText(/Location/i);
  
    await userEvent.clear(locationField);
    await userEvent.type(locationField, 'New York City');
  
    expect(locationField).toHaveValue('New York City');
  });
  
});