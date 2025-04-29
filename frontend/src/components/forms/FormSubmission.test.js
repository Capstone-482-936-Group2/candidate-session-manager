import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FormSubmission from './FormSubmission';
import api from '../../api/api'; // <--- MOVE THIS IMPORT ABOVE jest.mock()

// Mock the api module
jest.mock('../../api/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('FormSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading spinner initially', () => {
    render(<FormSubmission formId={1} onClose={jest.fn()} onSubmitted={jest.fn()} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders form title after loading', async () => {
    // Mock api.get to resolve with a fake form
    api.get.mockResolvedValueOnce({
      data: {
        id: 1,
        title: 'Test Form Title',
        description: 'This is a test form description.',
        form_fields: [],
      },
    });

    render(<FormSubmission formId={1} onClose={jest.fn()} onSubmitted={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Form Title');
    });
  });
  it('renders a text field if form has a text field', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        id: 1,
        title: 'Test Form Title',
        description: '',
        form_fields: [
          {
            id: 101,
            type: 'text',
            label: 'First Name',
            required: true,
            help_text: '',
          },
        ],
      },
    });
  
    render(<FormSubmission formId={1} onClose={jest.fn()} onSubmitted={jest.fn()} />);
  
    await waitFor(() => {
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    });
  });
  it('shows validation error by marking the required text field as invalid', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 1,
      title: 'Test Form Title',
      description: '',
      form_fields: [
        {
          id: 101,
          type: 'text',
          label: 'First Name',
          required: true,
          help_text: '',
        },
      ],
    },
  });

  render(<FormSubmission formId={1} onClose={jest.fn()} onSubmitted={jest.fn()} />);

  await waitFor(() => {
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
  });

  const submitButton = screen.getByRole('button', { name: /submit form/i });
  submitButton.click();

  await waitFor(() => {
    // Expect the input to have aria-invalid="true"
    expect(screen.getByLabelText(/First Name/i)).toHaveAttribute('aria-invalid', 'true');
  });
});
it('submits the form successfully when required text field is filled', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 1,
      title: 'Test Form Title',
      description: '',
      form_fields: [
        {
          id: 101,
          type: 'text',
          label: 'First Name',
          required: true,
          help_text: '',
        },
      ],
    },
  });

  api.post.mockResolvedValueOnce({
    data: {
      id: 1,
      form: 1,
      answers: { 101: 'John' },
      is_completed: true,
    },
  });

  const handleSubmitted = jest.fn();

  render(<FormSubmission formId={1} onClose={jest.fn()} onSubmitted={handleSubmitted} />);

  await waitFor(() => {
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
  });

  const input = screen.getByLabelText(/First Name/i);
  fireEvent.change(input, { target: { value: 'John' } });

  const submitButton = screen.getByRole('button', { name: /submit form/i });
  fireEvent.click(submitButton);

  // Instead of finding a dialog, just find "Submit" button inside dialog
  const confirmSubmitButton = await screen.findByRole('button', { name: /^submit$/i });
  fireEvent.click(confirmSubmitButton);

  await waitFor(() => {
    expect(handleSubmitted).toHaveBeenCalled();
  });
});

it('renders the form in view-only mode with pre-filled answers', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 1,
      title: 'Test Form Title',
      description: '',
      form_fields: [
        {
          id: 101,
          type: 'text',
          label: 'First Name',
          required: true,
          help_text: '',
        },
      ],
    },
  });

  const mockSubmission = {
    answers: {
      101: 'John Doe',
    },
  };

  render(
    <FormSubmission
      formId={1}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
      isViewOnly={true}
      submission={mockSubmission}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
it('renders checkbox field correctly with selected options in view-only mode', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 2,
      title: 'Test Checkbox Form',
      description: '',
      form_fields: [
        {
          id: 201,
          type: 'checkbox',
          label: 'Favorite Fruits',
          required: false,
          help_text: '',
          options: [
            { id: 1, label: 'Apple' },
            { id: 2, label: 'Banana' },
            { id: 3, label: 'Cherry' },
          ],
        },
      ],
    },
  });

  const mockSubmission = {
    answers: {
      201: ['Apple', 'Cherry'],
    },
  };

  render(
    <FormSubmission
      formId={2}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
      isViewOnly={true}
      submission={mockSubmission}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('Favorite Fruits')).toBeInTheDocument();
    expect(screen.getByText(/Apple, Cherry/)).toBeInTheDocument();
  });
});
it('renders a date field correctly in view-only mode', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 3,
      title: 'Test Date Form',
      description: '',
      form_fields: [
        {
          id: 301,
          type: 'date',
          label: 'Birthday',
          required: false,
          help_text: '',
        },
      ],
    },
  });

  const mockSubmission = {
    answers: {
      301: '2025-04-28',
    },
  };

  render(
    <FormSubmission
      formId={3}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
      isViewOnly={true}
      submission={mockSubmission}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('Birthday')).toBeInTheDocument();
    expect(screen.getByText('4/28/2025')).toBeInTheDocument(); // assumes local date format MM/DD/YYYY
  });
});
it('renders a date range field correctly in view-only mode', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 4,
      title: 'Test Date Range Form',
      description: '',
      form_fields: [
        {
          id: 401,
          type: 'date_range',
          label: 'Event Duration',
          required: false,
          help_text: '',
        },
      ],
    },
  });

  const mockSubmission = {
    answers: {
      401: {
        startDate: '2025-05-01',
        endDate: '2025-05-05',
      },
    },
  };

  render(
    <FormSubmission
      formId={4}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
      isViewOnly={true}
      submission={mockSubmission}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('Event Duration')).toBeInTheDocument();
    expect(screen.getByText('5/1/2025 - 5/5/2025')).toBeInTheDocument(); // assumes local date format MM/DD/YYYY
  });
});
it('renders a select field correctly in view-only mode', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 5,
      title: 'Test Select Form',
      description: '',
      form_fields: [
        {
          id: 501,
          type: 'select',
          label: 'Favorite Color',
          required: false,
          help_text: '',
          options: [
            { id: 1, label: 'Red' },
            { id: 2, label: 'Blue' },
            { id: 3, label: 'Green' },
          ],
        },
      ],
    },
  });

  const mockSubmission = {
    answers: {
      501: 'Blue',
    },
  };

  render(
    <FormSubmission
      formId={5}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
      isViewOnly={true}
      submission={mockSubmission}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('Favorite Color')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
  });
});
it('renders a radio field correctly in view-only mode', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 6,
      title: 'Test Radio Form',
      description: '',
      form_fields: [
        {
          id: 601,
          type: 'radio',
          label: 'Preferred Contact Method',
          required: false,
          help_text: '',
          options: [
            { id: 1, label: 'Email' },
            { id: 2, label: 'Phone' },
            { id: 3, label: 'Text Message' },
          ],
        },
      ],
    },
  });

  const mockSubmission = {
    answers: {
      601: 'Phone',
    },
  };

  render(
    <FormSubmission
      formId={6}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
      isViewOnly={true}
      submission={mockSubmission}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('Preferred Contact Method')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
  });
});
it('renders a textarea field correctly in view-only mode', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 7,
      title: 'Test Textarea Form',
      description: '',
      form_fields: [
        {
          id: 701,
          type: 'textarea',
          label: 'Additional Comments',
          required: false,
          help_text: '',
        },
      ],
    },
  });

  const mockSubmission = {
    answers: {
      701: 'This is a comment.',
    },
  };

  render(
    <FormSubmission
      formId={7}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
      isViewOnly={true}
      submission={mockSubmission}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('Additional Comments')).toBeInTheDocument();
    expect(screen.getByText('This is a comment.')).toBeInTheDocument();
  });
});
it('calls onClose when cancel button is clicked', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 8,
      title: 'Test Cancel Form',
      description: '',
      form_fields: [],
    },
  });

  const handleClose = jest.fn();

  render(
    <FormSubmission
      formId={8}
      onClose={handleClose}
      onSubmitted={jest.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Cancel Form');
  });

  const cancelButton = screen.getByRole('button', { name: /cancel/i });
  cancelButton.click();

  await waitFor(() => {
    expect(handleClose).toHaveBeenCalled();
  });
});
it('displays an error alert when form fails to load', async () => {
  api.get.mockRejectedValueOnce(new Error('Network error'));

  render(
    <FormSubmission
      formId={9}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/form not found/i);
  });
});
it('displays an error alert when form submission fails', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 10,
      title: 'Test Submission Fail Form',
      description: '',
      form_fields: [
        {
          id: 1001,
          type: 'text',
          label: 'Feedback',
          required: true,
          help_text: '',
        },
      ],
    },
  });

  api.post.mockRejectedValueOnce(new Error('Submission failed'));

  render(
    <FormSubmission
      formId={10}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.getByLabelText(/Feedback/i)).toBeInTheDocument();
  });

  const input = screen.getByLabelText(/Feedback/i);
  fireEvent.change(input, { target: { value: 'Great experience' } });

  const submitButton = screen.getByRole('button', { name: /submit form/i });
  fireEvent.click(submitButton);

  const confirmSubmitButton = await screen.findByRole('button', { name: /^submit$/i });
  fireEvent.click(confirmSubmitButton);

  await waitFor(() => {
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some(alert => alert.textContent.match(/failed to submit form/i))).toBe(true);
  });
});
it('displays a success alert after successful form submission', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 11,
      title: 'Test Success Form',
      description: '',
      form_fields: [
        {
          id: 1101,
          type: 'text',
          label: 'Suggestion',
          required: true,
          help_text: '',
        },
      ],
    },
  });

  api.post.mockResolvedValueOnce({
    data: {
      id: 11,
      form: 11,
      answers: { 1101: 'Add more options' },
      is_completed: true,
    },
  });

  render(
    <FormSubmission
      formId={11}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.getByLabelText(/Suggestion/i)).toBeInTheDocument();
  });

  const input = screen.getByLabelText(/Suggestion/i);
  fireEvent.change(input, { target: { value: 'Add more options' } });

  const submitButton = screen.getByRole('button', { name: /submit form/i });
  fireEvent.click(submitButton);

  const confirmSubmitButton = await screen.findByRole('button', { name: /^submit$/i });
  fireEvent.click(confirmSubmitButton);

  await waitFor(() => {
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some(alert => alert.textContent.match(/form submitted successfully/i))).toBe(true);
  });
});
it('updates checkbox answers correctly when toggling options', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 12,
      title: 'Test Checkbox Toggle Form',
      description: '',
      form_fields: [
        {
          id: 1201,
          type: 'checkbox',
          label: 'Select Skills',
          required: false,
          help_text: '',
          options: [
            { id: 1, label: 'Python' },
            { id: 2, label: 'JavaScript' },
            { id: 3, label: 'C++' },
          ],
        },
      ],
    },
  });

  render(
    <FormSubmission
      formId={12}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('Select Skills')).toBeInTheDocument();
  });

  // Click to check Python
  const pythonCheckbox = screen.getByLabelText('Python');
  fireEvent.click(pythonCheckbox);

  expect(pythonCheckbox).toBeChecked();

  // Click to uncheck Python
  fireEvent.click(pythonCheckbox);

  expect(pythonCheckbox).not.toBeChecked();
});

it('marks start date field invalid when start date is after end date', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 13,
      title: 'Test Invalid Date Range Form',
      description: '',
      form_fields: [
        {
          id: 1301,
          type: 'date_range',
          label: 'Vacation Dates',
          required: true,
          help_text: '',
        },
      ],
    },
  });

  render(
    <FormSubmission
      formId={13}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('Vacation Dates')).toBeInTheDocument();
  });

  // Select invalid date range
  const startDateInput = screen.getByLabelText(/start date/i);
  const endDateInput = screen.getByLabelText(/end date/i);

  fireEvent.change(startDateInput, { target: { value: '2025-06-10' } });
  fireEvent.change(endDateInput, { target: { value: '2025-06-05' } });

  const submitButton = screen.getByRole('button', { name: /submit form/i });
  fireEvent.click(submitButton);

  await waitFor(() => {
    expect(startDateInput).toHaveAttribute('aria-invalid', 'true');
    expect(endDateInput).toHaveAttribute('aria-invalid', 'true');
  });
});

it('renders help text for a field', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 14,
      title: 'Test Help Text Form',
      description: '',
      form_fields: [
        {
          id: 1401,
          type: 'text',
          label: 'Username',
          required: false,
          help_text: 'Your public username (no spaces)',
        },
      ],
    },
  });

  render(
    <FormSubmission
      formId={14}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.getByText(/your public username/i)).toBeInTheDocument();
  });
});

it('displays fields as static text in view-only mode', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 15,
      title: 'Test View-Only Disabled Fields Form',
      description: '',
      form_fields: [
        {
          id: 1501,
          type: 'text',
          label: 'First Name',
          required: true,
          help_text: '',
        },
        {
          id: 1502,
          type: 'select',
          label: 'Country',
          required: false,
          help_text: '',
          options: [
            { id: 1, label: 'USA' },
            { id: 2, label: 'Canada' },
          ],
        },
      ],
    },
  });

  const mockSubmission = {
    answers: {
      1501: 'John',
      1502: 'USA',
    },
  };

  render(
    <FormSubmission
      formId={15}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
      isViewOnly={true}
      submission={mockSubmission}
    />
  );

  await waitFor(() => {
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Country')).toBeInTheDocument();
    expect(screen.getByText('USA')).toBeInTheDocument();
  });
});

it('shows a success snackbar after form submission', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 16,
      title: 'Test Success Snackbar Form',
      description: '',
      form_fields: [
        {
          id: 1601,
          type: 'text',
          label: 'Suggestion',
          required: true,
          help_text: '',
        },
      ],
    },
  });

  api.post.mockResolvedValueOnce({
    data: {
      id: 16,
      form: 16,
      answers: { 1601: 'More features' },
      is_completed: true,
    },
  });

  render(
    <FormSubmission
      formId={16}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
    />
  );

  await waitFor(() => {
    expect(screen.getByLabelText(/Suggestion/i)).toBeInTheDocument();
  });

  const input = screen.getByLabelText(/Suggestion/i);
  fireEvent.change(input, { target: { value: 'More features' } });

  const submitButton = screen.getByRole('button', { name: /submit form/i });
  fireEvent.click(submitButton);

  const confirmSubmitButton = await screen.findByRole('button', { name: /^submit$/i });
  fireEvent.click(confirmSubmitButton);

  await waitFor(() => {
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some(alert => alert.textContent.match(/form submitted successfully/i))).toBe(true);
  });
});
it('handles unknown field types gracefully without crashing', async () => {
  api.get.mockResolvedValueOnce({
    data: {
      id: 17,
      title: 'Test Unknown Field Type Form',
      description: '',
      form_fields: [
        {
          id: 1701,
          type: 'unknown_type',
          label: 'Mystery Field',
          required: false,
          help_text: '',
        },
      ],
    },
  });

  render(
    <FormSubmission
      formId={17}
      onClose={jest.fn()}
      onSubmitted={jest.fn()}
    />
  );

  // Just wait for the form title (meaning the page loaded)
  await waitFor(() => {
    expect(screen.getByText('Test Unknown Field Type Form')).toBeInTheDocument();
  });

  // No input or field should exist
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});
it('does not submit the form if confirmation dialog is cancelled', async () => {
  const handleSubmitted = jest.fn();

  api.get.mockResolvedValueOnce({
    data: {
      id: 22,
      title: 'Test Cancel Dialog Form',
      description: '',
      form_fields: [
        {
          id: 2201,
          type: 'text',
          label: 'Reason',
          required: true,
          help_text: '',
        },
      ],
    },
  });

  render(
    <FormSubmission
      formId={22}
      onClose={() => {}}
      onSubmitted={handleSubmitted}
    />
  );

  await waitFor(() => {
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
  });

  // Fill the text field
  fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: 'Test reason' } });

  // Click the initial Submit Form button
  const submitButton = screen.getByRole('button', { name: /submit form/i });
  fireEvent.click(submitButton);

  // Dialog should open
  const cancelButton = await screen.findByRole('button', { name: /^cancel$/i });

  // Click cancel inside the dialog
  fireEvent.click(cancelButton);

  // Wait a bit
  await waitFor(() => {
    // Ensure form submission (POST) did not happen
    expect(handleSubmitted).not.toHaveBeenCalled();
  });
});

it('allows the user to manually close the success snackbar', async () => {
  const handleSubmitted = jest.fn();

  api.get.mockResolvedValueOnce({
    data: {
      id: 23,
      title: 'Test Snackbar Close Form',
      description: '',
      form_fields: [
        {
          id: 2301,
          type: 'text',
          label: 'Feedback',
          required: true,
          help_text: '',
        },
      ],
    },
  });

  render(
    <FormSubmission
      formId={23}
      onClose={() => {}}
      onSubmitted={handleSubmitted}
    />
  );

  await waitFor(() => {
    expect(screen.getByLabelText(/feedback/i)).toBeInTheDocument();
  });

  fireEvent.change(screen.getByLabelText(/feedback/i), { target: { value: 'Awesome!' } });

  const submitButton = screen.getByRole('button', { name: /submit form/i });
  fireEvent.click(submitButton);

  const confirmSubmitButton = await screen.findByRole('button', { name: /^submit$/i });
  fireEvent.click(confirmSubmitButton);

  // Snackbar should appear
  const snackbar = await screen.findByText(/form submitted successfully/i);
  expect(snackbar).toBeInTheDocument();

  // Click the close button of the snackbar
  const closeButton = screen.getByRole('button', { name: /close/i });
  fireEvent.click(closeButton);

  await waitFor(() => {
    expect(screen.queryByText(/form submitted successfully/i)).not.toBeInTheDocument();
  });
});

});

