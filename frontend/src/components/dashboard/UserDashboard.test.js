// src/components/UserDashboard.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom'; // RouterLink needs Router
import UserDashboard from './UserDashboard';

describe('UserDashboard', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <UserDashboard />
      </MemoryRouter>
    );
  });

  test('renders dashboard title', () => {
    expect(screen.getByRole('heading', { name: /Welcome to Your Dashboard/i })).toBeInTheDocument();
  });

  test('renders quick actions section', () => {
    expect(screen.getByRole('heading', { name: /Quick Actions/i })).toBeInTheDocument();
  });

  test('renders forms navigation link', () => {
    const formsLink = screen.getByRole('link', { name: /View Forms/i });
    expect(formsLink).toBeInTheDocument();
    expect(formsLink).toHaveAttribute('href', '/forms');
  });

  test('renders profile navigation link', () => {
    const profileLink = screen.getByRole('link', { name: /View Profile/i });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  test('renders recent activity section', () => {
    expect(screen.getByRole('heading', { name: /Recent Activity/i })).toBeInTheDocument();
  });

  test('renders no recent activity message', () => {
    expect(screen.getByText(/No recent activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Your recent actions will appear here/i)).toBeInTheDocument();
  });
});
