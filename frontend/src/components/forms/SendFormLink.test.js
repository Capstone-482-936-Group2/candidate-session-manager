// SendFormLink.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'; // ✅ Separate correct import
import '@testing-library/jest-dom';
import SendFormLink from './SendFormLink';


// MOCK usersAPI before importing component
jest.mock('../../api/api', () => ({
  usersAPI: {
    sendFormLink: jest.fn(), // Mock it as a function
  },
}));

describe('SendFormLink', () => {
    beforeEach(() => {
        jest.useFakeTimers();
      });
      
      afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
      });
  it('renders the dialog with form fields when open', () => {
    render(
      <SendFormLink
        open={true}
        onClose={jest.fn()}
        forms={[{ id: '1', title: 'Test Form' }]}
      />
    );

    expect(screen.getByText(/send form link to candidate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/candidate email/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send link/i })).toBeInTheDocument();
  });
  it('fills out the form and submits successfully', async () => {
    const mockOnClose = jest.fn();
  
    render(
      <SendFormLink
        open={true}
        onClose={mockOnClose}
        forms={[{ id: '1', title: 'Test Form' }]}
      />
    );
  
    const comboBox = screen.getByRole('combobox');
    userEvent.click(comboBox);
    const formOption = await screen.findByText('Test Form');
    userEvent.click(formOption);
  
    const emailInput = screen.getByLabelText(/candidate email/i);
    userEvent.type(emailInput, 'test@example.com');
  
    const messageInput = screen.getByLabelText(/message/i);
    userEvent.type(messageInput, 'Hello candidate!');
  
    const submitButton = screen.getByRole('button', { name: /send link/i });
    userEvent.click(submitButton);
  
    expect(await screen.findByText(/form link sent successfully/i)).toBeInTheDocument();
  
    // Simulate the 2 second timeout
    jest.advanceTimersByTime(2000);
  
    expect(mockOnClose).toHaveBeenCalled();
  });
  it('shows an error message if the API call fails', async () => {
    const mockOnClose = jest.fn();
  
    // Make sendFormLink reject with an error
    const errorMessage = 'Something went wrong';
    const { usersAPI } = require('../../api/api');
    usersAPI.sendFormLink.mockRejectedValueOnce({
      response: { data: { error: errorMessage } }
    });
  
    render(
      <SendFormLink
        open={true}
        onClose={mockOnClose}
        forms={[{ id: '1', title: 'Test Form' }]}
      />
    );
  
    // Fill form fields
    const comboBox = screen.getByRole('combobox');
    userEvent.click(comboBox);
    const formOption = await screen.findByText('Test Form');
    userEvent.click(formOption);
  
    const emailInput = screen.getByLabelText(/candidate email/i);
    userEvent.type(emailInput, 'test@example.com');
  
    const messageInput = screen.getByLabelText(/message/i);
    userEvent.type(messageInput, 'This should fail');
  
    const submitButton = screen.getByRole('button', { name: /send link/i });
    userEvent.click(submitButton);
  
    // Check that error message appears
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  
    // Ensure dialog was NOT closed
    expect(mockOnClose).not.toHaveBeenCalled();
  });
  it('calls onClose when the Cancel button is clicked', () => {
    const mockOnClose = jest.fn();
  
    render(
      <SendFormLink
        open={true}
        onClose={mockOnClose}
        forms={[{ id: '1', title: 'Test Form' }]}
      />
    );
  
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    userEvent.click(cancelButton);
  
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  
});
