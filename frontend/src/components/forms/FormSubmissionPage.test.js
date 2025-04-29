// src/components/forms/FormSubmissionPage.test.js
import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FormSubmissionPage from './FormSubmissionPage';

// Create mock navigate function
const mockNavigate = jest.fn();

// Mock the API
jest.mock('../../api/api', () => ({
  get: jest.fn(),
}));

// Mock useNavigate BEFORE everything else
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Create mock FormSubmission component SEPARATELY
function MockFormSubmission({ onSubmitted }) {
  useEffect(() => {
    onSubmitted();
  }, [onSubmitted]);
  return <div>Mock FormSubmission</div>;
}

// THEN mock FormSubmission module
jest.mock('./FormSubmission', () => ({
  __esModule: true,
  default: MockFormSubmission,
}));

// Test suite
describe('FormSubmissionPage', () => {
  it('shows loading spinner while fetching form', () => {
    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message when form fails to load', async () => {
    const api = require('../../api/api');
    api.get.mockRejectedValueOnce(new Error('Failed to load form'));

    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );

    const errorAlert = await screen.findByText(/failed to load form/i);
    expect(errorAlert).toBeInTheDocument();
  });

  it('renders form title and description when form loads successfully', async () => {
    const api = require('../../api/api');
    api.get.mockResolvedValueOnce({
      data: {
        title: 'Test Form',
        description: 'This is a test form description.',
      },
    });

    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );

    expect(await screen.findByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('This is a test form description.')).toBeInTheDocument();
  });

  it('shows "Form not found" message if form is null after loading', async () => {
    const api = require('../../api/api');
    api.get.mockResolvedValueOnce({ data: null });

    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );

    const notFoundAlert = await screen.findByText(/form not found/i);
    expect(notFoundAlert).toBeInTheDocument();
  });

  it('navigates to /forms after successful form submission', async () => {
    const api = require('../../api/api');
    api.get.mockResolvedValueOnce({
      data: {
        title: 'Submit Test Form',
        description: '',
      },
    });

    render(
      <BrowserRouter>
        <FormSubmissionPage />
      </BrowserRouter>
    );

    expect(await screen.findByText('Submit Test Form')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/forms');
  });
});
