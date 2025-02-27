# Candidate Session Manager

A web application for managing candidate sessions, built with Django backend and React frontend.

## Project Overview

This application allows candidates to register for sessions and administrators to manage those sessions. It features user authentication, role-based permissions, and a responsive UI.

## Prerequisites

- Python 3.8+
- Node.js 14+
- npm or yarn

## Project Structure

```

## Installation

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/candidate-session-manager.git
   cd candidate-session-manager
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Generate a new Django secret key:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

6. Update the `.env` file with your secret key.

7. Run migrations:
   ```bash
   python manage.py migrate
   ```

8. Create a superuser:
   ```bash
   python manage.py createsuperuser
   ```

9. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the frontend directory in a second terminal:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Running the Application

1. Make sure the Django backend is running (on http://localhost:8000)
2. Make sure the React frontend is running (on http://localhost:3000)
3. Access the application at http://localhost:3000

## User Roles

- **Candidate**: Can register for sessions and view their registrations
- **Faculty**: Can view all sessions
- **Admin**: Can manage sessions and users (except superadmins)
- **Superadmin**: Can manage all aspects of the system

## Development Workflow

1. Pull the latest changes: `git pull origin main`
2. Create a new branch for your feature: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit and push your changes: `git push origin feature/your-feature-name`
5. Create a pull request

## Additional Notes

- Default admin credentials (if using provided fixture data): admin@example.com / admin
