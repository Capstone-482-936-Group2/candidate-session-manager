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
   git clone https://github.com/Capstone-482-936-Group2/candidate-session-manager.git
   cd candidate-session-manager
   ```

2. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
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
   cd frontend
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

## Setting Up Google OAuth Authentication

### 1. Create Google OAuth Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Configure the OAuth consent screen:
   - Add your app name and contact information

### 2. Configure OAuth Credentials
1. Select "Web Application" as the application type
2. Add authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-production-frontend-domain.com
   ```
3. Add authorized redirect URIs:
   ```
   http://localhost:3000
   http://localhost:3000/login
   http://localhost:8000/accounts/google/login/callback/
   https://your-production-frontend-domain.com
   https://your-production-frontend-domain.com/login
   https://your-production-backend-domain.com/accounts/google/login/callback/
   ```
4. Save and note down your Client ID and Client Secret

### 3. Configure Backend
1. Create/update `.env` file in the backend directory:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

2. Install required packages:
   ```bash
   pip install django-allauth google-auth python-dotenv
   ```

### 4. Configure Frontend
1. Create/update `.env` file in the frontend directory:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
   ```

2. Install required package:
   ```bash
   npm install @react-oauth/google
   ```

### 5. Configure Django Admin for Google OAuth
1. Start the Django development server:
   ```bash
   python manage.py runserver
   ```

2. Access the Django admin interface:
   - Go to `http://localhost:8000/admin`
   - Log in with your superuser credentials (created during initial setup)

3. Configure the Site:
   - In the admin interface, find and click on "Sites"
   - Click on the existing site (usually "example.com")
   - Update the domain name:
     * For local development: `localhost:8000`
     * For production: your actual domain
   - Update the display name to match your site name
   - Click "Save"

4. Add Google as a Social Application:
   - In the admin interface, find and click on "Social Applications"
   - Click "Add Social Application"
   - Fill in the following details:
     * Provider: Select "Google"
     * Name: "Google OAuth" (or any descriptive name)
     * Client ID: Paste your Google OAuth client ID
     * Secret key: Paste your Google OAuth client secret
     * Sites: Move your site from "Available sites" to "Chosen sites" using the arrow button
   - Click "Save"

### 6. Production Deployment
When deploying to production:
1. Add your production domain to the authorized origins and redirect URIs in Google Cloud Console
2. Update environment variables in your hosting platform (e.g., Render):
   - Backend: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - Frontend: `REACT_APP_GOOGLE_CLIENT_ID`
3. Update the site domain in Django admin:
   - Access your production Django admin
   - Update the site domain to match your production backend URL
   - Update the social application to ensure it's associated with the production site

### Security Notes
- Never commit your OAuth credentials to version control
- Always use environment variables for sensitive information
- Keep your client secret secure and only use it in the backend
- The client ID is public and safe to use in the frontend
