// src/pages/FormManagement.test.js
import React from 'react';

// Global mock BEFORE importing component
jest.mock('../api/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn((url) => {
      if (url === '/forms/') {
        return Promise.resolve({ data: [{
          id: 1,
          title: 'Test Form 1',
          description: 'A test form',
          is_active: true,
          form_fields: [],
        }] });
      }
      return Promise.resolve({ data: [] });
    }),
  },
  usersAPI: {
    getUsers: jest.fn(() => Promise.resolve({ data: [] })),
  },
  seasonsAPI: {
    getSeasons: jest.fn(() => Promise.resolve({ data: [] })),
  },
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormManagement from './FormManagement';
import { AuthContext } from '../context/AuthContext';

// Helper to render with AuthContext
const renderWithAuth = (ui, { currentUser = {}, isAdmin = true } = {}) => {
  return render(
    <AuthContext.Provider value={{ currentUser, isAdmin, loading: false }}>
      {ui}
    </AuthContext.Provider>
  );
};

describe('FormManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders No Forms Available when no forms exist', async () => {
    renderWithAuth(<FormManagement />);

    const noFormsText = await screen.findByText(/No Forms Available/i);
    expect(noFormsText).toBeInTheDocument();
  });

  test('opens Create Form dialog when Create Form button is clicked', async () => {
    renderWithAuth(<FormManagement />, { isAdmin: true });

    const createButton = await screen.findByRole('button', { name: /Create Form/i });
    expect(createButton).toBeInTheDocument();

    await userEvent.click(createButton);

    const dialogTitle = await screen.findByText(/Create New Form/i);
    expect(dialogTitle).toBeInTheDocument();
  });

  test('renders the Form Management page title', async () => {
    renderWithAuth(<FormManagement />, { isAdmin: true });

    const pageTitle = await screen.findByText(/Form Management/i);
    expect(pageTitle).toBeInTheDocument();
  });

  test('Create Form button opens dialog', async () => {
    renderWithAuth(<FormManagement />, { isAdmin: true });
  
    const createButton = await screen.findByRole('button', { name: /Create Form/i });
    expect(createButton).toBeInTheDocument();
  
    await userEvent.click(createButton);
  
    const dialogTitle = await screen.findByText(/Create New Form/i);
    expect(dialogTitle).toBeInTheDocument();
  });
  test('does not close dialog when submitting form without a title', async () => {
    renderWithAuth(<FormManagement />, { isAdmin: true });
  
    // Open Create Form dialog
    const createButton = await screen.findByRole('button', { name: /Create Form/i });
    await userEvent.click(createButton);
  
    const dialogTitle = await screen.getByText(/Create New Form/i);
    expect(dialogTitle).toBeInTheDocument();
  
    // Do NOT fill Title
  
    // Submit the form
    const submitButton = await screen.findByRole('button', { name: /Create/i });
    await userEvent.click(submitButton);
  
    // ✅ After clicking, just confirm dialog is STILL there immediately
    const stillOpenDialog = screen.getByText(/Create New Form/i);
    expect(stillOpenDialog).toBeInTheDocument();
  });
  test('allows adding multiple fields dynamically', async () => {
    renderWithAuth(<FormManagement />, { isAdmin: true });
  
    // Open Create Form dialog
    const createButton = await screen.findByRole('button', { name: /Create Form/i });
    await userEvent.click(createButton);
  
    const dialogTitle = await screen.getByText(/Create New Form/i);
    expect(dialogTitle).toBeInTheDocument();
  
    // Fill in title
    const titleInput = await screen.findByLabelText(/Title/i);
    await userEvent.type(titleInput, 'Multi-Field Form');
  
    // Add first field
    const addFieldButton = await screen.findByRole('button', { name: /Add Field/i });
    await userEvent.click(addFieldButton);
  
    const firstFieldLabelInput = await screen.getAllByLabelText(/Field Label/i)[0];
    await userEvent.type(firstFieldLabelInput, 'First Name');
  
    // Add second field
    await userEvent.click(addFieldButton);
  
    const allFieldLabelInputs = await screen.getAllByLabelText(/Field Label/i);
    const secondFieldLabelInput = allFieldLabelInputs[1];
    await userEvent.type(secondFieldLabelInput, 'Last Name');
  
    // Verify that both fields exist
    expect(allFieldLabelInputs.length).toBe(2);
    expect(allFieldLabelInputs[0]).toHaveValue('First Name');
    expect(allFieldLabelInputs[1]).toHaveValue('Last Name');
  });
  
});
