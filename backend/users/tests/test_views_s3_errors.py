from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework import status
from users.models import CandidateProfile
from django.urls import reverse
from django.utils import timezone
from unittest.mock import patch, MagicMock
import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class S3IntegrationErrorTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create candidate user
        self.candidate = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="password",
            user_type="candidate"
        )
        
        # Create profile
        self.profile = CandidateProfile.objects.create(
            user=self.candidate,
            date_of_birth=timezone.now().date(),
            passport_name="Test Candidate",
            cell_number="123-456-7890",
            country_of_residence="USA",
            travel_assistance="none",
            gender="male",
            preferred_airport="LAX"
        )
        
        # Authentication
        self.client.force_authenticate(user=self.candidate)
        
        # URL for S3 test
        self.test_s3_url = reverse('user-test-s3')
        
        # Create a test image
        self.test_image = self.create_test_image()
        
    def create_test_image(self):
        """Create a test image for upload"""
        file = io.BytesIO()
        image = Image.new('RGB', (100, 100), color='red')
        image.save(file, 'jpeg')
        file.name = 'test.jpg'
        file.seek(0)
        return file
    
    @patch('users.views.boto3.client')
    def test_s3_test_aws_credentials_not_found(self, mock_boto3):
        """Test error handling when AWS credentials are not found"""
        mock_boto3.side_effect = Exception("AWS credentials not found")
        
        response = self.client.post(self.test_s3_url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('s3 configuration test failed', response.data['error'].lower())
    
    @patch('users.views.boto3.client')
    @patch('users.views.default_storage.save')
    def test_s3_test_storage_save_error(self, mock_save, mock_boto3):
        """Test error handling when storage save fails"""
        mock_boto3.return_value = MagicMock()
        mock_save.side_effect = Exception("Storage save error")
        
        response = self.client.post(self.test_s3_url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('s3 configuration test failed', response.data['error'].lower())
    
    @patch('users.views.boto3.client')
    @patch('users.views.default_storage.save')
    @patch('users.views.default_storage.url')
    def test_s3_test_url_generation_error(self, mock_url, mock_save, mock_boto3):
        """Test error handling when URL generation fails"""
        mock_boto3.return_value = MagicMock()
        mock_save.return_value = "test/test_file.txt"
        mock_url.side_effect = Exception("URL generation error")
        
        response = self.client.post(self.test_s3_url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('s3 configuration test failed', response.data['error'].lower())
    
    @patch('users.views.boto3.client')
    @patch('users.views.default_storage.save')
    @patch('users.views.default_storage.url')
    @patch('users.views.default_storage.open')
    def test_s3_test_file_open_error(self, mock_open, mock_url, mock_save, mock_boto3):
        """Test error handling when file open fails"""
        mock_boto3.return_value = MagicMock()
        mock_save.return_value = "test/test_file.txt"
        mock_url.return_value = "https://example.com/test_file.txt"
        mock_open.side_effect = Exception("File open error")
        
        response = self.client.post(self.test_s3_url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('s3 configuration test failed', response.data['error'].lower())
    
    @patch('users.views.boto3.client')
    @patch('users.views.default_storage.save')
    @patch('users.views.default_storage.url')
    @patch('users.views.default_storage.open')
    @patch('users.views.default_storage.delete')
    def test_s3_test_delete_error(self, mock_delete, mock_open, mock_url, mock_save, mock_boto3):
        """Test error handling when file deletion fails"""
        mock_boto3.return_value = MagicMock()
        mock_save.return_value = "test/test_file.txt"
        mock_url.return_value = "https://example.com/test_file.txt"
        
        # Create a mock file object with a read method
        mock_file = MagicMock()
        mock_file.read.return_value = b"This is a test file"
        
        # Make mock_open return a context manager that yields the mock file
        mock_open.return_value.__enter__.return_value = mock_file
        
        mock_delete.side_effect = Exception("Delete error")
        
        response = self.client.post(self.test_s3_url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('s3 configuration test failed', response.data['error'].lower())
    
    @patch('users.views.default_storage')
    def test_download_headshot_s3_error(self, mock_storage):
        """Test error handling when downloading headshot fails"""
        # Add a headshot URL to the profile
        self.profile.headshot = "candidate_headshots/test.jpg"
        self.profile.save()
        
        # Mock the S3 download to fail
        mock_storage.url.side_effect = Exception("S3 download error")
        
        # URL for headshot download
        headshot_url = reverse('user-download-headshot', args=[self.candidate.id])
        
        response = self.client.get(headshot_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', response.data)
    
    @patch('users.views.default_storage')
    def test_download_headshot_invalid_credentials(self, mock_storage):
        """Test error handling with invalid AWS credentials"""
        # Add a headshot URL to the profile
        self.profile.headshot = "candidate_headshots/test.jpg"
        self.profile.save()
        
        # Mock the S3 download to fail with credentials error
        mock_storage.url.side_effect = Exception("Invalid AWS credentials")
        
        # URL for headshot download
        headshot_url = reverse('user-download-headshot', args=[self.candidate.id])
        
        response = self.client.get(headshot_url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', response.data)

class CandidateProfileErrorTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create candidate user
        self.candidate = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="password",
            user_type="candidate"
        )
        
        # Authentication
        self.client.force_authenticate(user=self.candidate)
        
        # URL for completing candidate setup
        self.complete_setup_url = reverse('user-complete-candidate-setup')
        
    @patch('users.views.CandidateProfile.objects.create')
    def test_candidate_setup_database_error(self, mock_create):
        """Test error handling when database error occurs during profile creation"""
        mock_create.side_effect = Exception("Database connection error during save")
        
        response = self.client.post(self.complete_setup_url, {
            'current_title': 'PhD Student',
            'current_department': 'Computer Science',
            'current_institution': 'Test University',
            'date_of_birth': '1990-01-01',
            'country_of_residence': 'USA',
            'gender': 'male',
            'preferred_airport': 'LAX',
            'cell_number': '123-456-7890',
            'passport_name': 'Test Candidate',
            'travel_assistance': 'none'
        })
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        
    def test_candidate_setup_validation_error(self):
        """Test error handling when validation error occurs during profile creation"""
        # Missing required field date_of_birth
        response = self.client.post(self.complete_setup_url, {
            'current_title': 'PhD Student',
            'current_department': 'Computer Science',
            'current_institution': 'Test University',
            # Missing date_of_birth
            'country_of_residence': 'USA',
            'gender': 'male',
            'preferred_airport': 'LAX',
            'cell_number': '123-456-7890',
            'passport_name': 'Test Candidate',
            'travel_assistance': 'none'
        })
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('NOT NULL constraint', response.data['error']) 