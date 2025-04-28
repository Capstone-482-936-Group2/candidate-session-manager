from django.test import TestCase
from users.backends import EmailBackend
from django.contrib.auth import get_user_model
from unittest.mock import patch

User = get_user_model()

class EmailBackendTests(TestCase):
    def setUp(self):
        self.backend = EmailBackend()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123"
        )
    
    @patch('users.backends.print')
    def test_authenticate_success(self, mock_print):
        """Test successful authentication with correct email and password"""
        request = None  # Django's authenticate can accept None for request
        
        authenticated_user = self.backend.authenticate(
            request,
            email="test@example.com",
            password="password123"
        )
        
        self.assertEqual(authenticated_user, self.user)
        mock_print.assert_any_call("Backend: Found user test@example.com")
        mock_print.assert_any_call("Backend: Password check result: True")
    
    @patch('users.backends.print')
    def test_authenticate_wrong_password(self, mock_print):
        """Test authentication fails with wrong password"""
        request = None
        
        authenticated_user = self.backend.authenticate(
            request,
            email="test@example.com",
            password="wrongpassword"
        )
        
        self.assertIsNone(authenticated_user)
        mock_print.assert_any_call("Backend: Found user test@example.com")
        mock_print.assert_any_call("Backend: Password check result: False")
    
    @patch('users.backends.print')
    def test_authenticate_user_not_found(self, mock_print):
        """Test authentication fails when user doesn't exist"""
        request = None
        
        authenticated_user = self.backend.authenticate(
            request,
            email="nonexistent@example.com",
            password="password123"
        )
        
        self.assertIsNone(authenticated_user)
        mock_print.assert_called_with("Backend: No user found with this email") 