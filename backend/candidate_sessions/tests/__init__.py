# candidate_sessions/tests/__init__.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

def create_test_user(user_type='candidate', **kwargs):
    """
    Utility function to create test users with different roles.
    
    Args:
        user_type (str): Type of user ('candidate', 'faculty', 'admin')
        **kwargs: Additional user attributes
        
    Returns:
        User: Created user instance
    """
    email = kwargs.pop('email', f'{user_type}@test.com')
    username = kwargs.pop('username', email.split('@')[0])
    password = kwargs.pop('password', 'testpass123')
    
    user = User.objects.create_user(
        email=email,
        username=username,
        password=password,
        user_type=user_type,
        **kwargs
    )
    return user

def get_auth_client(user=None):
    """
    Returns an authenticated API client.
    
    Args:
        user (User, optional): User to authenticate as. If None, creates a new user.
        
    Returns:
        APIClient: Authenticated client instance
    """
    client = APIClient()
    if user is None:
        user = create_test_user()
    client.force_authenticate(user=user)
    return client

class TestCaseBase(TestCase):
    """
    Base class for test cases with common setup and utilities.
    """
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        
        # Create users with different roles
        self.candidate = create_test_user('candidate')
        self.faculty = create_test_user('faculty')
        self.admin = create_test_user('admin')
        
        # Create authenticated clients
        self.candidate_client = get_auth_client(self.candidate)
        self.faculty_client = get_auth_client(self.faculty)
        self.admin_client = get_auth_client(self.admin)
    @property
    def admin_request(self):
        request = type('Request', (), {})()
        request.user = self.admin
        return request
    
    @property
    def candidate_request(self):
        request = type('Request', (), {})()
        request.user = self.candidate
        return request
    
    @property
    def faculty_request(self):
        request = type('Request', (), {})()
        request.user = self.faculty
        return request