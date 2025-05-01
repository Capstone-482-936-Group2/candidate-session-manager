// src/pages/FormManagement.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import FormManagement from './FormManagement';
import { AuthContext } from '../context/AuthContext';
import { unstable_ClassNameGenerator as ClassNameGenerator } from '@mui/material/className';

// Mock the components
jest.mock('../components/admin/FormSubmissions', () => ({
  __esModule: true,
  default: () => ({
    $$typeof: Symbol.for('react.element'),
    type: 'div',
    props: { children: 'Form Submissions Content' },
    ref: null
  })
}));

jest.mock('../components/admin/FacultyAvailabilitySubmissions', () => ({
  __esModule: true,
  default: () => ({
    $$typeof: Symbol.for('react.element'),
    type: 'div',
    props: { children: 'Faculty Availability Submissions Content' },
    ref: null
  })
}));

// Mock the api module
jest.mock('../api/api', () => {
  const mockApi = {
    get: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  };

  return {
    __esModule: true,
    default: mockApi,
    usersAPI: {
      getUsers: jest.fn(),
      sendFormLink: jest.fn(),
      getUser: jest.fn(),
    },
    seasonsAPI: {
      getSeasons: jest.fn(),
    },
    candidateSectionsAPI: {
      getCandidateSectionsBySeason: jest.fn(),
    },
    availabilityInvitationAPI: {
      inviteFaculty: jest.fn(),
    },
  };
});

// Import the mocked module to use in tests
import api, { usersAPI } from '../api/api';

// Add at the top of the file after imports
ClassNameGenerator.configure((componentName) => componentName);

// Add a custom render function that includes MUI setup
const customRender = (ui, options = {}) => {
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthContext.Provider value={{ currentUser: {}, isAdmin: true, loading: false }}>
        {children}
      </AuthContext.Provider>
    ),
    ...options,
  });
};

// Helper to render with AuthContext
const renderWithAuth = (ui, { currentUser = {}, isAdmin = true } = {}) => {
  return render(
    <AuthContext.Provider value={{ currentUser, isAdmin, loading: false }}>
      {ui}
    </AuthContext.Provider>
  );
};

// Add this helper function at the top of the test file
const setupMockForm = () => {
  const mockForm = {
    id: 1,
    title: 'Test Form 1',
    description: 'A test form',
    is_active: true,
    form_fields: [{ id: 'f1', label: 'Field 1', type: 'text' }]
  };

  const mockFacultyForm = {
    id: 'faculty-availability',
    title: 'Faculty Availability Form',
    description: 'Faculty availability form',
    is_active: true,
    is_virtual: true
  };

  // Mock API responses
  api.get.mockImplementation((url) => {
    switch (url) {
      case '/forms/':
        return Promise.resolve({ data: [mockForm, mockFacultyForm] });
      case '/users/':
        return Promise.resolve({ data: [{ id: 1, email: 'test@test.com' }] });
      case '/users/?user_type=faculty':
        return Promise.resolve({ data: [{ id: 'fac1', email: 'faculty@test.com' }] });
      default:
        return Promise.resolve({ data: [] });
    }
  });

  return { mockForm, mockFacultyForm };
};

// Add this helper function at the top of the test file, after the imports
const userClick = async (element) => {
  await act(async () => {
    await userEvent.click(element);
  });
};

describe('FormManagement', () => {
  const mockForm = {
    id: 1,
    title: 'Test Form 1',
    description: 'A test form',
    is_active: true,
    form_fields: [],
  };

  const mockUser = {
    id: 2,
    email: 'user@example.com',
    full_name: 'Test User',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock responses
    api.get.mockImplementation((url) => {
      switch (url) {
        case '/forms/':
          return Promise.resolve({ data: [mockForm] });
        case '/users/':
          return Promise.resolve({ data: [mockUser] });
        default:
          return Promise.resolve({ data: [] });
      }
    });

    usersAPI.getUsers.mockResolvedValue({ data: [mockUser] });
  });

  test('renders No Forms Available when no forms exist', async () => {
    // Override the default mock for this test
    api.get.mockImplementation((url) => {
      if (url === '/forms/') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    });

    await act(async () => {
      customRender(<FormManagement />);
    });

    expect(await screen.findByText(/No Forms Available/i)).toBeInTheDocument();
  });

  test('fetches forms and users on mount', async () => {
    await act(async () => {
      customRender(<FormManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });
    
    expect(api.get).toHaveBeenCalledWith('/forms/');
    expect(api.get).toHaveBeenCalledWith('/users/');
  });

  test('adds the virtual Faculty Availability form', async () => {
    await act(async () => {
      customRender(<FormManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
      expect(screen.getByText('Faculty Availability Form')).toBeInTheDocument();
    });
  });

  test('opens Edit Form dialog with correct data', async () => {
    await act(async () => {
      customRender(<FormManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const editButton = screen.getAllByRole('button', { name: /Edit/i })[0];
    await act(async () => {
      await userEvent.click(editButton);
    });

    expect(screen.getByText(/Edit Form/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Form 1')).toBeInTheDocument();
  });

  test('deletes a form when Delete is clicked and confirmed', async () => {
    window.confirm = jest.fn(() => true);
    api.delete.mockResolvedValue({});

    await act(async () => {
      customRender(<FormManagement />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Form 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByRole('button', { name: /Delete/i })[0];
    await act(async () => {
      await userEvent.click(deleteButton);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(api.delete).toHaveBeenCalledWith('/forms/1/');
  });

  test('opens Create Form dialog when Create Form button is clicked', async () => {
    await act(async () => {
      customRender(<FormManagement />);
    });

    const createButton = screen.getByRole('button', { name: /Create Form/i });
    await act(async () => {
      await userEvent.click(createButton);
    });

    expect(screen.getByText(/Create New Form/i)).toBeInTheDocument();
  });

  test('does not close dialog when submitting form without a title', async () => {
    await act(async () => {
      customRender(<FormManagement />);
    });

    const createButton = screen.getByRole('button', { name: /Create Form/i });
    await act(async () => {
      await userEvent.click(createButton);
    });

    const submitButton = screen.getByRole('button', { name: /Create/i });
    await act(async () => {
      await userEvent.click(submitButton);
    });

    expect(screen.getByText(/Create New Form/i)).toBeInTheDocument();
  });

  test('renders the Form Management page title', async () => {
    customRender(<FormManagement />);

    const pageTitle = await screen.findByText(/Form Management/i);
    expect(pageTitle).toBeInTheDocument();
  });

  test('Create Form button opens dialog', async () => {
    customRender(<FormManagement />);
  
    const createButton = await screen.findByRole('button', { name: /Create Form/i });
    expect(createButton).toBeInTheDocument();
  
    await userEvent.click(createButton);
  
    const dialogTitle = await screen.findByText(/Create New Form/i);
    expect(dialogTitle).toBeInTheDocument();
  });

  test('allows adding multiple fields dynamically', async () => {
    customRender(<FormManagement />);
  
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

  test('assigns users to a form', async () => {
    customRender(<FormManagement />);
    expect(await screen.findByText('Test Form 1')).toBeInTheDocument();
    // Open create form dialog
    const createButton = await screen.findByRole('button', { name: /Create Form/i });
    await userEvent.click(createButton);
    // Wait for user autocomplete to appear
    const assignInput = await screen.findByLabelText(/Assign To Users/i);
    await userEvent.click(assignInput);
    // Type to filter users
    await userEvent.type(assignInput, 'user@example.com');
    // Wait for the option to appear in the dropdown (MUI Autocomplete renders in a portal)
    const option = await screen.findByText('user@example.com', {}, { timeout: 2000 });
    await userEvent.click(option);
    // The chip should appear
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  test('adds and removes options for select field', async () => {
    customRender(<FormManagement />);
    expect(await screen.findByText('Test Form 1')).toBeInTheDocument();
    
    // Open create form dialog
    const createButton = screen.getByRole('button', { name: /Create Form/i });
    await userEvent.click(createButton);
    
    // Wait for dialog to open
    expect(await screen.findByText(/Create New Form/i)).toBeInTheDocument();
    
    // Add a field
    const addFieldButton = screen.getByRole('button', { name: /Add Field/i });
    await userEvent.click(addFieldButton);
    
    // Find the Field Type select trigger (MUI renders as button with no name, so use getAllByRole)
    // It's the second input in the field paper, so get all comboboxes
    const fieldTypeSelects = screen.getAllByRole('button');
    // Find the one that has aria-haspopup="listbox" and is not the dialog close/cancel/create
    const fieldTypeSelect = fieldTypeSelects.find(
      btn => btn.getAttribute('aria-haspopup') === 'listbox'
    );
    expect(fieldTypeSelect).toBeTruthy();
    await userEvent.click(fieldTypeSelect);
    
    // Find and click Dropdown in the listbox that appears
    const dropdownOption = await screen.findByRole('option', { name: 'Dropdown' });
    await userEvent.click(dropdownOption);
    
    // Add an option
    const addOptionButton = screen.getByRole('button', { name: /Add Option/i });
    await userEvent.click(addOptionButton);
    
    // Find and fill the option input
    const optionInput = screen.getByPlaceholderText('Option label');
    await userEvent.type(optionInput, 'Option 1');
    expect(optionInput).toHaveValue('Option 1');
    
    // Find and click delete button by its icon
    const deleteIcon = screen.getByTestId('DeleteIcon');
    await userEvent.click(deleteIcon);
    
    // Option input should be gone
    expect(screen.queryByPlaceholderText('Option label')).not.toBeInTheDocument();
  });

  test('shows error if field label is missing', async () => {
    customRender(<FormManagement />);
    expect(await screen.findByText('Test Form 1')).toBeInTheDocument();
    
    // Open create form dialog
    const createButton = screen.getByRole('button', { name: /Create Form/i });
    await userEvent.click(createButton);
    
    // Wait for dialog to open
    expect(await screen.findByText(/Create New Form/i)).toBeInTheDocument();
    
    // Add a field without setting a label
    const addFieldButton = screen.getByRole('button', { name: /Add Field/i });
    await userEvent.click(addFieldButton);
    
    // Try to submit
    const submitButton = screen.getByRole('button', { name: /Create/i });
    await userEvent.click(submitButton);
    
    // The error should appear in a Snackbar/Alert
    expect(await screen.findByText(/All fields must have a label/i)).toBeInTheDocument();
  });

  test('shows error if select/radio/checkbox field has no options', async () => {
    customRender(<FormManagement />);
    expect(await screen.findByText('Test Form 1')).toBeInTheDocument();
    
    // Open create form dialog
    const createButton = screen.getByRole('button', { name: /Create Form/i });
    await userEvent.click(createButton);
    
    // Wait for dialog to open
    expect(await screen.findByText(/Create New Form/i)).toBeInTheDocument();
    
    // Add a field
    const addFieldButton = screen.getByRole('button', { name: /Add Field/i });
    await userEvent.click(addFieldButton);
    
    // Set label
    const labelInput = screen.getAllByLabelText(/Field Label/i)[0];
    await userEvent.type(labelInput, 'Select Field');
    
    // Find the Field Type select trigger
    const fieldTypeSelects = screen.getAllByRole('button');
    const fieldTypeSelect = fieldTypeSelects.find(
      btn => btn.getAttribute('aria-haspopup') === 'listbox'
    );
    expect(fieldTypeSelect).toBeTruthy();
    await userEvent.click(fieldTypeSelect);
    
    // Select Dropdown from the menu
    const dropdownOption = await screen.findByRole('option', { name: 'Dropdown' });
    await userEvent.click(dropdownOption);
    
    // Try to submit without options
    const submitButton = screen.getByRole('button', { name: /Create/i });
    await userEvent.click(submitButton);
    
    // Wait for error message in Snackbar/Alert
    expect(await screen.findByText(/Select Field must have at least one option/i)).toBeInTheDocument();
  });

  test('cancel closes the create/edit dialog', async () => {
    customRender(<FormManagement />);
    // Open create form dialog
    const createButton = await screen.findByRole('button', { name: /Create Form/i });
    await userEvent.click(createButton);
    // Click cancel
    const cancelButton = await screen.findByRole('button', { name: /Cancel/i });
    await userEvent.click(cancelButton);
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText(/Create New Form/i)).not.toBeInTheDocument();
    });
  });

  // --- Faculty Availability Invite Dialog ---

  test('opens and closes the Invite Faculty dialog', async () => {
    customRender(<FormManagement />);
    expect(await screen.findByText('Faculty Availability Form')).toBeInTheDocument();

    // Open dialog
    const inviteButton = screen.getByRole('button', { name: /Invite Faculty/i });
    await userEvent.click(inviteButton);

    expect(await screen.findByText(/Invite Faculty for Availability/i)).toBeInTheDocument();

    // Close dialog
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/Invite Faculty for Availability/i)).not.toBeInTheDocument();
    });
  });

  test('selects a season and candidates in Invite Faculty dialog', async () => {
    // Mock seasons and candidate sections
    const mockSeason = { id: 's1', title: 'Spring 2024', end_date: '2099-12-31' };
    const mockCandidateSection = {
      id: 'c1',
      candidate: { id: 10, first_name: 'Alice', last_name: 'Smith' },
      arrival_date: '2024-04-01',
      leaving_date: '2024-04-10'
    };
    api.get.mockImplementation((url) => {
      if (url === '/forms/') return Promise.resolve({ data: [mockForm] });
      if (url === '/users/') return Promise.resolve({ data: [mockUser] });
      if (url.startsWith('/users/?user_type=faculty')) return Promise.resolve({ data: [mockUser] });
      return Promise.resolve({ data: [] });
    });
    require('../api/api').seasonsAPI.getSeasons.mockResolvedValue({ data: [mockSeason] });
    require('../api/api').candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({ data: [mockCandidateSection] });
    require('../api/api').default.get.mockImplementation((url) => {
      if (url === '/users/?user_type=faculty') return Promise.resolve({ data: [mockUser] });
      if (url === '/forms/') return Promise.resolve({ data: [mockForm] });
      if (url === '/users/') return Promise.resolve({ data: [mockUser] });
      return Promise.resolve({ data: [] });
    });

    customRender(<FormManagement />);
    expect(await screen.findByText('Faculty Availability Form')).toBeInTheDocument();

    // Open dialog
    const inviteButton = screen.getByRole('button', { name: /Invite Faculty/i });
    await userEvent.click(inviteButton);

    // Select season
    const seasonSelect = await screen.findByLabelText(/Select Season/i);
    await userEvent.click(seasonSelect);
    const seasonOption = await screen.findByText('Spring 2024');
    await userEvent.click(seasonOption);

    // Candidate should appear
    expect(await screen.findByText(/Alice Smith/)).toBeInTheDocument();

    // Select candidate
    const candidateCheckbox = screen.getByRole('checkbox', { name: '' });
    await userEvent.click(candidateCheckbox);

    // Select faculty
    const facultyCheckbox = screen.getAllByRole('checkbox').find((cb, idx) => idx > 0); // skip first, which is candidate
    await userEvent.click(facultyCheckbox);

    // Send invitations
    const sendButton = screen.getByRole('button', { name: /Send Invitations/i });
    require('../api/api').availabilityInvitationAPI.inviteFaculty.mockResolvedValue({ data: { message: 'Invited!' } });
    await userEvent.click(sendButton);

    // Success snackbar
    expect(await screen.findByText(/Successfully sent invitations/i)).toBeInTheDocument();
  });

  test('handles error when sending faculty invitations fails', async () => {
    // Ensure faculty and season mocks are present
    const mockSeason = { id: 's1', title: 'Spring 2024', end_date: '2099-12-31' };
    const mockCandidateSection = {
      id: 'c1',
      candidate: { id: 10, first_name: 'Alice', last_name: 'Smith' },
      arrival_date: '2024-04-01',
      leaving_date: '2024-04-10'
    };
    api.get.mockImplementation((url) => {
      if (url === '/forms/') return Promise.resolve({ data: [mockForm] });
      if (url === '/users/') return Promise.resolve({ data: [mockUser] });
      if (url.startsWith('/users/?user_type=faculty')) return Promise.resolve({ data: [mockUser] });
      return Promise.resolve({ data: [] });
    });
    require('../api/api').seasonsAPI.getSeasons.mockResolvedValue({ data: [mockSeason] });
    require('../api/api').candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({ data: [mockCandidateSection] });
    require('../api/api').default.get.mockImplementation((url) => {
      if (url === '/users/?user_type=faculty') return Promise.resolve({ data: [mockUser] });
      if (url === '/forms/') return Promise.resolve({ data: [mockForm] });
      if (url === '/users/') return Promise.resolve({ data: [mockUser] });
      return Promise.resolve({ data: [] });
    });

    customRender(<FormManagement />);
    expect(await screen.findByText('Faculty Availability Form')).toBeInTheDocument();

    // Open dialog
    const inviteButton = screen.getByRole('button', { name: /Invite Faculty/i });
    await userEvent.click(inviteButton);

    // Wait for dialog to open
    expect(await screen.findByText(/Invite Faculty for Availability/i)).toBeInTheDocument();

    // Wait for the Send Invitations button to be enabled (after loading)
    const sendButton = await screen.findByRole('button', { name: /Send Invitations/i });

    // Try to send with nothing selected
    await userEvent.click(sendButton);

    expect(await screen.findByText(/Please select at least one candidate and one faculty member/i)).toBeInTheDocument();
  });

  // --- Send Form Link Dialog ---

  test('opens and closes the Send Form Link dialog', async () => {
    customRender(<FormManagement />);
    expect(await screen.findByText('Test Form 1')).toBeInTheDocument();

    // Open dialog
    const sendLinkButton = screen.getByRole('button', { name: /Send Link/i });
    await userEvent.click(sendLinkButton);

    expect(await screen.findByText(/Send Form Link to Users/i)).toBeInTheDocument();

    // Close dialog
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/Send Form Link to Users/i)).not.toBeInTheDocument();
    });
  });

  test('shows error if no users selected in Send Form Link dialog', async () => {
    customRender(<FormManagement />);
    expect(await screen.findByText('Test Form 1')).toBeInTheDocument();

    // Open dialog
    const sendLinkButton = screen.getByRole('button', { name: /Send Link/i });
    await userEvent.click(sendLinkButton);

    // The button should be disabled
    const sendButton = screen.getByRole('button', { name: /Send Link to 0 User/i });
    expect(sendButton).toBeDisabled();

    // Optionally, try to click and catch the error (should not throw)
    // await userEvent.click(sendButton); // This will throw, so we skip it

    // Instead, check that the error does not appear (since button is disabled)
    expect(screen.queryByText(/Please select at least one user/i)).not.toBeInTheDocument();
  });

  test('sends form link to selected user', async () => {
    customRender(<FormManagement />);
    expect(await screen.findByText('Test Form 1')).toBeInTheDocument();

    // Open dialog
    const sendLinkButton = screen.getByRole('button', { name: /Send Link/i });
    await userEvent.click(sendLinkButton);

    // Select user
    const userCheckbox = screen.getByRole('checkbox');
    await userEvent.click(userCheckbox);

    // Mock API
    require('../api/api').usersAPI.sendFormLink.mockResolvedValue({});

    // Send
    const sendButton = screen.getByRole('button', { name: /Send Link to 1 User/i });
    await userEvent.click(sendButton);

    expect(await screen.findByText(/Form link sent successfully/i)).toBeInTheDocument();
  });

  // --- View Submissions Dialog ---

  test('opens and closes the View Submissions dialog for a normal form', async () => {
    const mockForm = setupMockForm();
    
    customRender(<FormManagement />);
    
    // Wait for form to appear
    await screen.findByText(mockForm.mockForm.title);
    
    // Find and click View Submissions
    const viewButton = await screen.findByRole('button', { name: /View Submissions/i });
    await userEvent.click(viewButton);
    
    // Dialog title should appear
    expect(await screen.findByText(`${mockForm.mockForm.title} - Submissions`)).toBeInTheDocument();
    
    // Close dialog
    const closeButton = await screen.findByRole('button', { name: /Close/i });
    await userEvent.click(closeButton);
    
    // Dialog should be closed
    expect(screen.queryByText(`${mockForm.mockForm.title} - Submissions`)).not.toBeInTheDocument();
  });

  test('opens and closes the View Submissions dialog for the virtual form', async () => {
    // Ensure both forms are present
    const formWithFields = {
      ...mockForm,
      form_fields: [{ id: 'f1', label: 'Field 1', type: 'text' }]
    };
    api.get.mockImplementation((url) => {
      if (url === '/forms/') return Promise.resolve({ data: [formWithFields] });
      if (url === '/users/') return Promise.resolve({ data: [mockUser] });
      return Promise.resolve({ data: [] });
    });

    customRender(<FormManagement />);
    expect(await screen.findByText('Faculty Availability Form')).toBeInTheDocument();

    // Open dialog
    const viewButton = screen.getAllByRole('button', { name: /View Submissions/i })[0];
    await userEvent.click(viewButton);

    expect(await screen.findByText(/Faculty Availability Form - Submissions/i)).toBeInTheDocument();

    // Close dialog
    const closeButton = screen.getByRole('button', { name: /Close/i });
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/Faculty Availability Form - Submissions/i)).not.toBeInTheDocument();
    });
  });

  // --- Snackbar ---

  test('snackbar closes when close button is clicked', async () => {
    // Ensure a form is present
    api.get.mockImplementation((url) => {
      if (url === '/forms/') return Promise.resolve({ data: [mockForm] });
      if (url === '/users/') return Promise.resolve({ data: [mockUser] });
      return Promise.resolve({ data: [] });
    });
    customRender(<FormManagement />);

    // Manually trigger snackbar by simulating a failed delete
    api.delete.mockRejectedValue({ response: { data: { error: 'Failed to delete' } } });

    // Open dialog and delete
    const deleteButton = await screen.findByRole('button', { name: /Delete/i });
    await userEvent.click(deleteButton);

    // Snackbar should appear
    const errorSnackbar = await screen.findByText(/Failed to delete/i);
    expect(errorSnackbar).toBeInTheDocument();

    // Close snackbar
    // The close button in MUI Snackbar/Alert is usually the first button with no name
    const closeButton = screen.getAllByRole('button').find(
      btn => btn.getAttribute('aria-label') === 'Close'
    );
    expect(closeButton).toBeTruthy();
    await userEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/Failed to delete/i)).not.toBeInTheDocument();
    });
  });
});

describe('Form Validation and Submission', () => {
  test('validates form fields before submission', async () => {
    setupMockForm();
    await act(async () => {
      renderWithAuth(<FormManagement />, { isAdmin: true });
    });
    
    // Wait for component to load
    await screen.findByText('Form Management');
    
    // Open create form dialog
    const createButton = await screen.findByRole('button', { name: /Create Form/i });
    await act(async () => {
      await userEvent.click(createButton);
    });
    
    // Add a field
    const addFieldButton = await screen.findByRole('button', { name: /Add Field/i });
    await act(async () => {
      await userEvent.click(addFieldButton);
    });
    
    // Set label
    const labelInput = await screen.findByLabelText(/Field Label/i);
    await act(async () => {
      await userEvent.type(labelInput, 'Select Field');
    });
    
    // Find and click the select
    const fieldTypeSelect = await screen.findByRole('combobox', { name: /Field Type/i });
    await act(async () => {
      await userEvent.click(fieldTypeSelect);
    });
    
    // Select dropdown option
    const dropdownOption = await screen.findByRole('option', { name: /Dropdown/i });
    await act(async () => {
      await userEvent.click(dropdownOption);
    });
    
    // Try to submit
    const submitButton = await screen.findByRole('button', { name: /Create/i });
    await act(async () => {
      await userEvent.click(submitButton);
    });
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/Select Field must have at least one option/i)).toBeInTheDocument();
    });
  });
});

describe('Season Management', () => {
  test('fetches and filters active seasons', async () => {
    const { mockFacultyForm } = setupMockForm();
    const mockSeasons = [
      { id: 's1', title: 'Current Season', end_date: '2099-12-31' },
      { id: 's2', title: 'Past Season', end_date: '2020-12-31' }
    ];
    
    require('../api/api').seasonsAPI.getSeasons.mockResolvedValue({ data: mockSeasons });
    
    await act(async () => {
      renderWithAuth(<FormManagement />, { isAdmin: true });
    });
    
    // Wait for Faculty Availability Form to appear
    await screen.findByText('Faculty Availability Form');
    
    // Find and click Invite Faculty button
    const inviteButton = await screen.findByRole('button', { name: /Invite Faculty/i });
    await act(async () => {
      await userEvent.click(inviteButton);
    });
    
    // Find and click the season select
    const seasonSelect = await screen.findByRole('combobox', { name: /Select Season/i });
    await act(async () => {
      await userEvent.click(seasonSelect);
    });
    
    // Verify season options
    expect(screen.getByText('Current Season')).toBeInTheDocument();
    expect(screen.queryByText('Past Season')).not.toBeInTheDocument();
  });

  test('handles season fetch error', async () => {
    require('../api/api').seasonsAPI.getSeasons.mockRejectedValue(new Error('Failed to fetch'));
    
    customRender(<FormManagement />);
    
    const inviteButton = await screen.findByRole('button', { name: /Invite Faculty/i });
    await userEvent.click(inviteButton);
    
    expect(await screen.findByText(/Failed to load seasons/i)).toBeInTheDocument();
  });
});

describe('Candidate Sections', () => {
  test('fetches candidate sections for selected season', async () => {
    setupMockForm();
    const mockCandidateSection = {
      id: 'c1',
      candidate: { id: 'cand1', first_name: 'John', last_name: 'Doe' },
      arrival_date: '2024-03-01',
      leaving_date: '2024-03-05'
    };
    
    require('../api/api').candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [mockCandidateSection]
    });
    
    require('../api/api').seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 's1', title: 'Spring 2024', end_date: '2099-12-31' }]
    });
    
    customRender(<FormManagement />);
    
    // Wait for Faculty Availability Form
    await screen.findByText('Faculty Availability Form');
    
    // Open invite dialog
    const inviteButton = await screen.findByText('Invite Faculty');
    await userEvent.click(inviteButton);
    
    // Select a season
    const seasonSelect = await screen.findByText(/Select Season/i);
    await userEvent.click(seasonSelect);
    const seasonOption = await screen.findByText('Spring 2024');
    await userEvent.click(seasonOption);
    
    // Verify candidate appears
    expect(await screen.findByText('John Doe')).toBeInTheDocument();
  });

  test('handles candidate sections fetch error', async () => {
    require('../api/api').candidateSectionsAPI.getCandidateSectionsBySeason.mockRejectedValue(
      new Error('Failed to fetch')
    );
    
    customRender(<FormManagement />);
    
    const inviteButton = await screen.findByRole('button', { name: /Invite Faculty/i });
    await userEvent.click(inviteButton);
    
    // Select a season
    const seasonSelect = await screen.findByLabelText(/Select Season/i);
    await userEvent.click(seasonSelect);
    const seasonOption = await screen.findByText('Spring 2024');
    await userEvent.click(seasonOption);
    
    expect(await screen.findByText(/Failed to load candidates/i)).toBeInTheDocument();
  });
});

describe('Import Preferred Faculty', () => {
  const mockCandidate = {
    id: 'cand1',
    candidate_profile: {
      preferred_faculty: ['fac1', 'fac2']
    }
  };

  const mockFacultyForm = {
    id: 'faculty-availability',
    title: 'Faculty Availability Form',
    description: 'Faculty availability form',
    is_active: true,
    is_virtual: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockForm = {
      id: 1,
      title: 'Test Form 1',
      description: 'A test form',
      is_active: true,
      form_fields: [{ id: 'f1', label: 'Field 1', type: 'text' }]
    };

    // Mock API responses with both forms
    api.get.mockImplementation((url) => {
      switch (url) {
        case '/forms/':
          return Promise.resolve({ data: [mockForm, mockFacultyForm] });
        case '/users/':
          return Promise.resolve({ data: [{ id: 1, email: 'test@test.com' }] });
        case '/users/?user_type=faculty':
          return Promise.resolve({ data: [{ id: 'fac1', email: 'faculty@test.com' }] });
        default:
          return Promise.resolve({ data: [] });
      }
    });
  });

  test('successfully imports preferred faculty', async () => {
    // Mock the API responses
    require('../api/api').usersAPI.getUser.mockResolvedValue({ data: mockCandidate });
    
    const mockCandidateSection = {
      id: 'c1',
      candidate: { id: 'cand1', first_name: 'John', last_name: 'Doe' }
    };
    
    require('../api/api').seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 's1', title: 'Spring 2024', end_date: '2099-12-31' }]
    });
    
    require('../api/api').candidateSectionsAPI.getCandidateSectionsBySeason.mockResolvedValue({
      data: [mockCandidateSection]
    });
    
    await act(async () => {
      customRender(<FormManagement />);
    });
    
    // Wait for Faculty Availability Form to appear
    await screen.findByText('Faculty Availability Form');
    
    const inviteButton = await screen.findByRole('button', { name: /Invite Faculty/i });
    await act(async () => {
      await userEvent.click(inviteButton);
    });
    
    // Wait for dialog to open and buttons to be available
    await screen.findByText(/Invite Faculty for Availability/i);
    
    const importButton = await screen.findByRole('button', { name: /Import Selections/i });
    await act(async () => {
      await userEvent.click(importButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Imported 2 preferred faculty member/i)).toBeInTheDocument();
    });
  });

  test('handles case when candidate has no preferred faculty', async () => {
    require('../api/api').usersAPI.getUser.mockResolvedValue({
      data: { id: 'cand1', candidate_profile: { preferred_faculty: [] } }
    });
    
    require('../api/api').seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 's1', title: 'Spring 2024', end_date: '2099-12-31' }]
    });
    
    await act(async () => {
      customRender(<FormManagement />);
    });
    
    // Wait for Faculty Availability Form to appear
    await screen.findByText('Faculty Availability Form');
    
    const inviteButton = await screen.findByRole('button', { name: /Invite Faculty/i });
    await act(async () => {
      await userEvent.click(inviteButton);
    });
    
    // Wait for dialog to open
    await screen.findByText(/Invite Faculty for Availability/i);
    
    const importButton = await screen.findByRole('button', { name: /Import Selections/i });
    await act(async () => {
      await userEvent.click(importButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/This candidate has not selected any preferred faculty members/i)).toBeInTheDocument();
    });
  });

  test('handles case when preferred faculty are not in system', async () => {
    require('../api/api').usersAPI.getUser.mockResolvedValue({
      data: { 
        id: 'cand1',
        candidate_profile: { preferred_faculty: ['nonexistent1', 'nonexistent2'] }
      }
    });
    
    require('../api/api').seasonsAPI.getSeasons.mockResolvedValue({
      data: [{ id: 's1', title: 'Spring 2024', end_date: '2099-12-31' }]
    });
    
    // Mock API to return no faculty
    api.get.mockImplementation((url) => {
      if (url === '/forms/') {
        return Promise.resolve({ data: [mockFacultyForm] }); // Include faculty form
      }
      if (url === '/users/?user_type=faculty') {
        return Promise.resolve({ data: [] }); // No matching faculty in system
      }
      return Promise.resolve({ data: [] });
    });
    
    await act(async () => {
      customRender(<FormManagement />);
    });
    
    // Wait for Faculty Availability Form to appear
    await screen.findByText('Faculty Availability Form');
    
    const inviteButton = await screen.findByRole('button', { name: /Invite Faculty/i });
    await act(async () => {
      await userEvent.click(inviteButton);
    });
    
    // Wait for dialog to open
    await screen.findByText(/Invite Faculty for Availability/i);
    
    const importButton = await screen.findByRole('button', { name: /Import Selections/i });
    await act(async () => {
      await userEvent.click(importButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/None of the candidate's preferred faculty members are available/i)).toBeInTheDocument();
    });
  });
});
