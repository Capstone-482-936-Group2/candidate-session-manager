
jest.mock('../../api/api', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { user_type: 'user' }
  })
}));
import React from 'react';
import { render, screen, fireEvent , waitFor} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserForms from './UserForms';
import { act } from 'react-dom/test-utils';
describe('UserForms', () => {
  it('renders the page header', () => {
    render(
      <BrowserRouter>
        <UserForms />
      </BrowserRouter>
    );
    expect(screen.getByText(/Your Forms/i)).toBeInTheDocument();
  });

  it('shows message when no forms are available', async () => {
    const api = require('../../api/api').default;
    api.get.mockResolvedValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <UserForms />
      </BrowserRouter>
    );

    expect(await screen.findByText(/No forms are available for you at this time/i)).toBeInTheDocument();
  });

  it('renders form cards when forms are available', async () => {
    const api = require('../../api/api').default;
    api.get.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Test Form 1', description: 'Form description 1' },
        { id: 2, title: 'Test Form 2', description: 'Form description 2' },
      ]
    });
  
    render(
      <BrowserRouter>
        <UserForms />
      </BrowserRouter>
    );
  
    expect(await screen.findByText('Test Form 1')).toBeInTheDocument();
    expect(await screen.findByText('Test Form 2')).toBeInTheDocument();
  });
  it('shows error and redirects if API returns 403', async () => {
    const api = require('../../api/api').default;
    api.get.mockRejectedValueOnce({
      response: { status: 403 }
    });
  
    render(
      <BrowserRouter>
        <UserForms />
      </BrowserRouter>
    );
  
    // Check if error message appears
    expect(await screen.findByText(/You do not have permission to view these forms/i)).toBeInTheDocument();
  });
  it('navigates to form submission page when pending form is clicked', async () => {
    const api = require('../../api/api').default;
    api.get.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Test Form Pending', description: 'Fill this out' }
      ]
    });
  
    const { container } = render(
      <BrowserRouter>
        <UserForms />
      </BrowserRouter>
    );
  
    // Wait for form card to appear
    expect(await screen.findByText('Test Form Pending')).toBeInTheDocument();
  
    // Find the "Complete Form" button
    const completeButton = screen.getByRole('button', { name: /Complete Form/i });
  
    // Click the button
    fireEvent.click(completeButton);
  
    // Expect URL to change to `/forms/1`
    expect(window.location.pathname).toContain('/forms/1');
  });
  it('opens view submission dialog when clicking on a completed form', async () => {
    const api = require('../../api/api').default;
    
    // First API call: forms
    api.get.mockResolvedValueOnce({
      data: [
        { id: 2, title: 'Completed Form', description: 'Already filled out' }
      ]
    });
  
    // Second API call: form submissions (for the form)
    api.get.mockResolvedValueOnce({
      data: [
        { id: 100, is_completed: true } // Mock a completed submission
      ]
    });
  
    render(
      <BrowserRouter>
        <UserForms />
      </BrowserRouter>
    );
  
    expect(await screen.findByText('Completed Form')).toBeInTheDocument();
  
    const viewButton = await screen.findByRole('button', { name: /View Submission/i });
  
    fireEvent.click(viewButton);
  
    expect(await screen.findByText(/View Submission/i)).toBeInTheDocument();
  });
  it('shows error alert if form submission fetch fails after clicking Complete Form', async () => {
    const api = require('../../api/api').default;
  
    // Mock initial forms fetch
    api.get.mockResolvedValueOnce({
      data: [
        { id: 1, title: 'Test Form', description: 'Form description' }
      ]
    });
  
    // Mock second API call (fetch form submission) to fail
    api.get.mockRejectedValueOnce(new Error('Network Error'));
  
    render(
      <BrowserRouter>
        <UserForms />
      </BrowserRouter>
    );
  
    // Wait for form to appear
    expect(await screen.findByText('Test Form')).toBeInTheDocument();
  
    // Click "Complete Form"
    const completeButton = screen.getByRole('button', { name: /Complete Form/i });
    fireEvent.click(completeButton);
  
    // After failed API call, check if error alert appears
    expect(await screen.findByText(/Failed to load form/i)).toBeInTheDocument();
  });

});


