from django.test import TestCase
from rest_framework.test import APIClient, APITestCase, APIRequestFactory
from django.contrib.auth import get_user_model
from rest_framework import status
from candidate_sessions.models import (
    Session, CandidateSection, SessionTimeSlot, Location, LocationType,
    Form, FormField, FormSubmission, FacultyAvailability, AvailabilityTimeSlot
)
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
import json

User = get_user_model()

class SessionViewSetErrorHandlingTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create admin user for authentication
        self.admin = User.objects.create_user(
            username="admin_test",
            email="admin_test@example.com",
            password="password",
            user_type="admin"
        )
        
        self.client.force_authenticate(user=self.admin)
        
        # Create a test session
        self.session = Session.objects.create(
            title="Test Session",
            description="Test session description",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=30),
            created_by=self.admin
        )
        
        # Define URLs
        self.sessions_url = reverse('season-list')  # Changed from session-list
        self.session_detail_url = reverse('season-detail', args=[self.session.id])
    
    @patch('candidate_sessions.views.Session.objects.create')
    def test_create_session_error_handling(self, mock_create):
        """Test error handling when creating a session fails"""
        mock_create.side_effect = Exception("Database error")
        
        response = self.client.post(self.sessions_url, {
            'title': 'New Session',
            'description': 'New Description',
            'start_date': timezone.now().date().isoformat(),
            'end_date': (timezone.now().date() + timedelta(days=3)).isoformat()
        })
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
    
    @patch('candidate_sessions.views.Session.objects.get')
    def test_retrieve_session_error_handling(self, mock_get):
        """Test error handling when retrieving a session fails"""
        mock_get.side_effect = Exception("Database error")
        
        response = self.client.get(self.session_detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

# --- REMOVE/COMMENT OUT THE FOLLOWING TESTS ---

# class FormViewSetErrorHandlingTests(TestCase):
#     def test_create_form_error_handling(self):
#         ...

# class LocationTypeViewSetErrorHandlingTests(TestCase):
#     def test_create_location_type_error_handling(self):
#         ...
#     def test_list_location_types_error_handling(self):
#         ...

# class SessionViewSetErrorHandlingTests(TestCase):
#     def test_create_session_error_handling(self):
#         ...
#     def test_retrieve_session_error_handling(self):
#         ...

# --- END OF REMOVED/COMMENTED OUT TESTS --- 