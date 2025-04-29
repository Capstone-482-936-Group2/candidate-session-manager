import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Navigation from './Navigation';

// Mock the useNavigate hook
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth hook
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../../context/AuthContext';
describe('Navigation', () => {
  it('renders login link when user is not authenticated', () => {
    // Mock no user logged in
    useAuth.mockReturnValue({
      currentUser: null,
      logout: jest.fn(),
      isAdmin: false,
      isFaculty: false,
    });

    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );

    // Check if "Sign In with Google" link is rendered
    expect(screen.getByRole('link', { name: /sign in with google/i })).toBeInTheDocument();
  });
  it('renders navigation links and avatar when user is authenticated', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'faculty', first_name: 'Alice' },
      logout: jest.fn(),
      isAdmin: false,
      isFaculty: true,
    });
  
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  
    // Check if "Forms" link is rendered
    expect(screen.getByRole('link', { name: /forms/i })).toBeInTheDocument();
  
    // Check if "Faculty" link is rendered (because isFaculty is true)
    expect(screen.getByRole('link', { name: /faculty/i })).toBeInTheDocument();
  
    // Check if Avatar with first letter "A" is rendered
    expect(screen.getByText('A')).toBeInTheDocument();
  });
  it('opens user menu when clicking on avatar', async () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'faculty', first_name: 'Bob' },
      logout: jest.fn(),
      isAdmin: false,
      isFaculty: true,
    });
  
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  
    const avatarButton = screen.getByText('B'); // Avatar shows "B" for "Bob"
  
    // Click the avatar
    await userEvent.click(avatarButton);
  
    // After clicking, the Profile menu item should appear
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument();
  });
  it('highlights Sessions link when route is /sessions', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'faculty', first_name: 'Dave' },
      logout: jest.fn(),
      isAdmin: false,
      isFaculty: false,
    });
  
    // Mock location.pathname to be '/sessions'
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      pathname: '/sessions',
    });
  
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  
    const sessionsLink = screen.getByRole('link', { name: /sessions/i });
  
    // Check if the "Sessions" link is styled as active
    expect(sessionsLink).toHaveStyle('font-weight: 700');
  });
  it('does not render Faculty link when user is not faculty', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'candidate', first_name: 'Eve' },
      logout: jest.fn(),
      isAdmin: false,
      isFaculty: false, 
    });
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
        pathname: '/',
      });
      
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  
    // "Faculty" button should not exist
    expect(screen.queryByRole('link', { name: /faculty/i })).not.toBeInTheDocument();
  });
  it('does not render Admin link when user is not admin', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'faculty', first_name: 'Frank' },
      logout: jest.fn(),
      isAdmin: false, // ❗ not an admin
      isFaculty: true,
    });
  
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      pathname: '/',
    });
  
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  
    // "Admin" button should not exist
    expect(screen.queryByRole('link', { name: /admin/i })).not.toBeInTheDocument();
  });
  it('renders AccountCircle icon when user has no first_name', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'faculty' }, // ❗ no first_name field
      logout: jest.fn(),
      isAdmin: false,
      isFaculty: true,
    });
  
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      pathname: '/',
    });
  
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  
    // Check if AccountCircle icon is rendered (fallback)
    expect(screen.getByTestId('AccountCircleIcon')).toBeInTheDocument();
  });
  it('does not render Sessions link when user is a candidate', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'candidate', first_name: 'Grace' }, // ❗ candidate user
      logout: jest.fn(),
      isAdmin: false,
      isFaculty: false,
    });
  
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      pathname: '/',
    });
  
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  
    // "Sessions" button should not exist
    expect(screen.queryByRole('link', { name: /sessions/i })).not.toBeInTheDocument();
  });
  
  it('highlights Faculty link when route is /faculty-dashboard', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'faculty', first_name: 'Jack' },
      logout: jest.fn(),
      isAdmin: false,
      isFaculty: true,
    });
  
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      pathname: '/faculty-dashboard',
    });
  
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  
    const facultyLink = screen.getByRole('link', { name: /faculty/i });
  
    expect(facultyLink).toHaveStyle('font-weight: 700');
  });
  it('highlights Admin link when route is /admin-dashboard', () => {
    useAuth.mockReturnValue({
      currentUser: { user_type: 'admin', first_name: 'Kate' },
      logout: jest.fn(),
      isAdmin: true,
      isFaculty: false,
    });
  
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      pathname: '/admin-dashboard',
    });
  
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
  
    const adminLink = screen.getByRole('link', { name: /admin/i });
  
    expect(adminLink).toHaveStyle('font-weight: 700');
  });
  
});
