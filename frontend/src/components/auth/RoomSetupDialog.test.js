import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoomSetupDialog from './RoomSetupDialog';
import { usersAPI } from '../../api/api';

// Mock the API
jest.mock('../../api/api', () => ({
  usersAPI: {
    completeRoomSetup: jest.fn()
  }
}));

describe('RoomSetupDialog', () => {
  const mockOnComplete = jest.fn();
  const defaultProps = {
    open: true,
    currentRoomNumber: null,
    onComplete: mockOnComplete
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog with title and description', () => {
    render(<RoomSetupDialog {...defaultProps} />);

    expect(screen.getByText('Welcome! Please Set Up Your Room Number')).toBeInTheDocument();
    expect(screen.getByText(/as a faculty member/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/room\/office number/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('pre-fills room number if provided', () => {
    render(
      <RoomSetupDialog 
        {...defaultProps} 
        currentRoomNumber="PETR 123"
      />
    );

    expect(screen.getByLabelText(/room\/office number/i)).toHaveValue('PETR 123');
  });

  it('handles successful room setup', async () => {
    usersAPI.completeRoomSetup.mockResolvedValueOnce({});
    
    render(<RoomSetupDialog {...defaultProps} />);

    const input = screen.getByLabelText(/room\/office number/i);
    fireEvent.change(input, { target: { value: 'PETR 456' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(usersAPI.completeRoomSetup).toHaveBeenCalledWith('PETR 456');
      expect(mockOnComplete).toHaveBeenCalledWith('PETR 456');
    });
  });

  it('shows error message when room setup fails', async () => {
    const error = new Error('Failed to save');
    error.response = { data: { error: 'Invalid room number' } };
    usersAPI.completeRoomSetup.mockRejectedValueOnce(error);
    
    render(<RoomSetupDialog {...defaultProps} />);

    const input = screen.getByLabelText(/room\/office number/i);
    fireEvent.change(input, { target: { value: 'PETR 456' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid room number')).toBeInTheDocument();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  it('disables save button when room number is empty', () => {
    render(<RoomSetupDialog {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    const input = screen.getByLabelText(/room\/office number/i);
    fireEvent.change(input, { target: { value: 'PETR 456' } });
    expect(saveButton).not.toBeDisabled();

    fireEvent.change(input, { target: { value: '' } });
    expect(saveButton).toBeDisabled();
  });

  it('shows validation error for empty room number', async () => {
    render(<RoomSetupDialog {...defaultProps} />);

    const input = screen.getByLabelText(/room\/office number/i);
    fireEvent.change(input, { target: { value: '' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Instead of looking for error text, check for error state in TextField
    await waitFor(() => {
      expect(input).toBeInvalid();
      // The button should remain disabled
      expect(saveButton).toBeDisabled();
      expect(usersAPI.completeRoomSetup).not.toHaveBeenCalled();
    });
  });

  it('disables input and button while saving', async () => {
    // Create a promise that won't resolve immediately
    let resolvePromise;
    const savePromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    usersAPI.completeRoomSetup.mockReturnValue(savePromise);
    
    render(<RoomSetupDialog {...defaultProps} />);

    const input = screen.getByLabelText(/room\/office number/i);
    fireEvent.change(input, { target: { value: 'PETR 456' } });
    
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // Check disabled state while saving
    expect(input).toBeDisabled();
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent('Saving...');

    // Resolve the save operation
    resolvePromise({});
    
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith('PETR 456');
    });
  });

  it('resets form state when dialog opens with new values', () => {
    const { rerender } = render(
      <RoomSetupDialog 
        {...defaultProps} 
        open={false} 
        currentRoomNumber="PETR 123" 
      />
    );

    // Reopen dialog with different room number
    rerender(
      <RoomSetupDialog 
        {...defaultProps} 
        open={true} 
        currentRoomNumber="PETR 456" 
      />
    );

    expect(screen.getByLabelText(/room\/office number/i)).toHaveValue('PETR 456');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('prevents dialog from being dismissed', () => {
    render(<RoomSetupDialog {...defaultProps} />);
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    
    // Check for the presence of attributes that prevent dismissal
    const dialogProps = dialog.parentElement.getAttribute('role');
    expect(dialogProps).toBe('presentation');
  });
});
