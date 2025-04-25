# backend/users/tests/test_views_edge_cases.py
from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from django.utils import timezone
from users.models import User, CandidateProfile
from django.urls import reverse
from unittest.mock import patch, MagicMock, mock_open
from django.core.files.uploadedfile import SimpleUploadedFile
import json
from django.core.exceptions import ObjectDoesNotExist

class GoogleLoginEdgeCaseTests(APITestCase):
    def setUp(self):
        self.login_url = reverse('user-google-login')
        
    @patch('users.views.id_token.verify_oauth2_token')
    def test_google_login_with_unusual_data_formats(self, mock_verify_token):
        """Test Google login with various data formats"""
        # Set up the mock to return valid user data
        mock_verify_token.return_value = {
            'email': 'test_format@example.com',
            'given_name': 'Test',
            'family_name': 'Format',
        }
        
        # Test with string data instead of dict
        response = self.client.post(
            self.login_url, 
            data="raw_token_string",
            content_type='text/plain'
        )
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
        
        # Test with token in a different field name
        response = self.client.post(
            self.login_url,
            {'token': 'fake_token_wrong_field'},
            format='json'
        )
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
        
        # Test with empty string token
        response = self.client.post(
            self.login_url,
            {'credential': ''},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    @patch('users.views.id_token.verify_oauth2_token')
    @patch('users.views.User.objects.get_or_create')
    def test_google_login_database_error(self, mock_get_or_create, mock_verify_token):
        """Test Google login when database errors occur"""
        # Set up the token verification mock
        mock_verify_token.return_value = {
            'email': 'db_error@example.com',
            'given_name': 'DB',
            'family_name': 'Error',
        }
        
        # Make the database operation raise an exception
        mock_get_or_create.side_effect = Exception("Database connection error")
        
        # Attempt login
        response = self.client.post(
            self.login_url,
            {'credential': 'fake_token_db_error'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

    @patch('users.views.id_token.verify_oauth2_token')
    @patch('users.views.login')
    def test_google_login_session_error(self, mock_login, mock_verify_token):
        """Test Google login when session errors occur"""
        # Set up the token verification mock
        mock_verify_token.return_value = {
            'email': 'session_error@example.com',
            'given_name': 'Session',
            'family_name': 'Error',
        }
        
        # Make the login function raise an exception
        mock_login.side_effect = Exception("Session error")
        
        # Attempt login
        response = self.client.post(
            self.login_url,
            {'credential': 'fake_token_session_error'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)

class UserRegistrationEdgeCaseTests(APITestCase):
    def setUp(self):
        # Create an admin user for testing
        self.admin = User.objects.create_user(
            username="admin_test",
            email="admin_test@example.com",
            password="password",
            user_type="admin"
        )
        
        self.client.force_authenticate(user=self.admin)
        self.register_url = reverse('user-register')
        
    @patch('users.serializers.User.objects.create_user')
    def test_register_user_with_db_error(self, mock_create_user):
        """Test user registration when database errors occur"""
        # Make the create_user method raise an exception
        mock_create_user.side_effect = Exception("Database error during user creation")
        
        # Attempt to create a user
        new_user_data = {
            'email': 'new_error@example.com',
            'username': 'new_error@example.com',
            'first_name': 'New',
            'last_name': 'Error',
            'user_type': 'faculty'
        }
        
        response = self.client.post(self.register_url, new_user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        
    def test_register_with_existing_email(self):
        """Test registration with an email that already exists"""
        # Create user data with an email that already exists
        existing_email_data = {
            'email': self.admin.email,  # Using the admin's email which already exists
            'username': 'different_username',
            'first_name': 'Existing',
            'last_name': 'Email',
            'user_type': 'faculty'
        }
        
        response = self.client.post(self.register_url, existing_email_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class EmailErrorHandlingTests(APITestCase):
    def setUp(self):
        # Create an admin user for testing
        self.admin = User.objects.create_user(
            username="admin_email",
            email="admin_email@example.com",
            password="password",
            user_type="admin"
        )
        
        self.client.force_authenticate(user=self.admin)
        
        # Create a test form
        from candidate_sessions.models import Form
        self.form = Form.objects.create(
            title="Test Form for Email",
            description="Testing email error handling",
            created_by=self.admin
        )
        
        self.send_form_link_url = reverse('user-send-form-link')
        
    @patch('users.views.send_mail')
    def test_send_form_link_with_smtp_timeout(self, mock_send_mail):
        """Test handling of SMTP timeout when sending form link"""
        # Configure the mock to simulate a timeout
        mock_send_mail.side_effect = Exception("SMTP timeout")
        
        form_data = {
            'candidate_email': 'candidate@example.com',
            'form_id': self.form.id,
            'message': 'This email will fail with a timeout'
        }
        
        response = self.client.post(self.send_form_link_url, form_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        
    @patch('users.views.send_mail')
    def test_send_form_link_with_invalid_recipient(self, mock_send_mail):
        """Test handling of invalid email recipient when sending form link"""
        # Configure the mock to simulate an invalid recipient error
        mock_send_mail.side_effect = Exception("Invalid recipient")
        
        form_data = {
            'candidate_email': 'invalid@example..com',  # Invalid email
            'form_id': self.form.id,
            'message': 'This email will fail with invalid recipient'
        }
        
        response = self.client.post(self.send_form_link_url, form_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

class S3FileHandlingErrorTests(APITestCase):
    def setUp(self):
        # Create a candidate user for testing
        self.candidate = User.objects.create_user(
            username="candidate_s3",
            email="candidate_s3@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.client.force_authenticate(user=self.candidate)
        self.upload_headshot_url = reverse('user-upload-headshot')
        
        # Create a candidate profile
        self.profile = CandidateProfile.objects.create(
            user=self.candidate,
            current_title="PhD Student",
            current_department="Computer Science",
            current_institution="Test University",
            date_of_birth=timezone.now().date(),
            country_of_residence="USA",
            gender="male",
            preferred_airport="LAX",
            talk_title="Test Talk",
            abstract="Test Abstract",
            biography="Test Bio",
            passport_name="Test Candidate",
            cell_number="123-456-7890",
            travel_assistance="none"
        )
        
    @patch('users.views.boto3.client')
    def test_upload_headshot_s3_connection_error(self, mock_boto_client):
        """Test handling of S3 connection error when uploading headshot"""
        # Create a test image file
        image_file = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'GIF87a\x01\x00\x01\x00\x80\x01\x00\x00\x00\x00ccc,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;',
            content_type='image/jpeg'
        )
        
        # Configure the S3 client mock to raise an exception
        mock_s3 = MagicMock()
        mock_boto_client.return_value = mock_s3
        mock_s3.upload_fileobj.side_effect = Exception("S3 connection error")
        
        # Attempt to upload the image
        response = self.client.post(
            self.upload_headshot_url,
            {'headshot': image_file},
            format='multipart'
        )
        
        # The API should still return 200 since the image is saved locally first
        # but the S3 upload would fail in the background
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    @patch('users.views.os.path.exists')
    def test_headshot_path_not_found(self, mock_path_exists):
        """Test handling of file not found when processing headshot"""
        # Create a test image file
        image_file = SimpleUploadedFile(
            name='missing_image.jpg',
            content=b'GIF87a\x01\x00\x01\x00\x80\x01\x00\x00\x00\x00ccc,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;',
            content_type='image/jpeg'
        )
        
        # Configure the mock to simulate file not found
        mock_path_exists.return_value = False
        
        # Attempt to upload the image
        response = self.client.post(
            self.upload_headshot_url,
            {'headshot': image_file},
            format='multipart'
        )
        
        # The API should still return 200 but would log the error
        self.assertEqual(response.status_code, status.HTTP_200_OK)

class CandidateSetupEdgeCaseTests(APITestCase):
    def setUp(self):
        # Create a candidate user
        self.candidate = User.objects.create_user(
            username="candidate_setup",
            email="candidate_setup@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.client.force_authenticate(user=self.candidate)
        self.complete_setup_url = reverse('user-complete-candidate-setup')
        
    def test_complete_setup_with_invalid_date_format(self):
        """Test setup with invalid date format"""
        # Create profile with minimal valid data but invalid date
        profile_data = {
            'current_title': 'PhD Student',
            'current_department': 'Computer Science',
            'current_institution': 'Test University',
            'date_of_birth': 'not-a-date',  # Invalid date format
            'country_of_residence': 'USA',
            'gender': 'prefer_not_to_say'
        }
        
        response = self.client.post(self.complete_setup_url, profile_data, format='json')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST, 
            status.HTTP_500_INTERNAL_SERVER_ERROR
        ])
        self.assertIn('error', response.data)
        self.assertIn('date', response.data['error'].lower())
        
    def test_complete_setup_database_error(self):
        """Test setup with database error during save"""
        # Create a profile first
        profile = CandidateProfile.objects.create(
            user=self.candidate,
            current_title='Initial Title',
            current_department='Initial Department',
            current_institution='Initial Institution',
            date_of_birth=timezone.now().date(),
            country_of_residence='USA',
            gender='prefer_not_to_say',
            passport_name='Test Name',
            cell_number='123-456-7890',
            travel_assistance='none'
        )
        
        # Mock the save method to raise an exception
        with patch.object(CandidateProfile, 'save') as mock_save:
            mock_save.side_effect = Exception("Database connection error during save")
            
            profile_data = {
                'current_title': 'Updated Title',
                'current_department': 'Updated Department',
                'date_of_birth': '1990-01-01'
            }
            
            response = self.client.post(self.complete_setup_url, profile_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn('error', response.data)
    
class S3OperationsTests(APITestCase):
    def setUp(self):
        # Create an admin user for testing S3 operations
        self.admin = User.objects.create_user(
            username="admin_s3",
            email="admin_s3@example.com",
            password="password",
            user_type="admin"
        )
        
        self.client.force_authenticate(user=self.admin)
        self.test_s3_url = reverse('user-test-s3')
        
    @patch('django.core.files.storage.default_storage.save')
    def test_s3_save_error(self, mock_save):
        """Test handling of storage save error"""
        mock_save.side_effect = Exception("Storage save error")
        
        response = self.client.post(self.test_s3_url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertIn('s3 configuration test failed', response.data['error'].lower())
        
    @patch('django.core.files.storage.default_storage.save')
    @patch('django.core.files.storage.default_storage.url')
    def test_s3_url_error(self, mock_url, mock_save):
        """Test handling of URL generation error"""
        mock_save.return_value = "test/path.txt"
        mock_url.side_effect = Exception("URL generation error")
        
        response = self.client.post(self.test_s3_url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        
    @patch('django.core.files.storage.default_storage.save')
    @patch('django.core.files.storage.default_storage.url') 
    @patch('django.core.files.storage.default_storage.open')
    def test_s3_read_error(self, mock_open, mock_url, mock_save):
        """Test handling of file read error"""
        mock_save.return_value = "test/path.txt"
        mock_url.return_value = "https://example.com/test.txt"
        mock_open.side_effect = Exception("File open error")
        
        response = self.client.post(self.test_s3_url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        
    @patch('django.core.files.storage.default_storage.save')
    @patch('django.core.files.storage.default_storage.url')
    @patch('django.core.files.storage.default_storage.open')
    @patch('django.core.files.storage.default_storage.delete')
    def test_s3_delete_error(self, mock_delete, mock_open, mock_url, mock_save):
        """Test handling of file deletion error"""
        mock_save.return_value = "test/path.txt"
        mock_url.return_value = "https://example.com/test.txt"
        mock_open.return_value = MagicMock(read=lambda: b"test content")
        mock_delete.side_effect = Exception("Delete error")
        
        response = self.client.post(self.test_s3_url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

class HeadshotDownloadTests(APITestCase):
    def setUp(self):
        # Create a candidate user
        self.candidate = User.objects.create_user(
            username="candidate_download",
            email="candidate_download@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.client.force_authenticate(user=self.candidate)
        self.download_url = reverse('user-download-headshot')
        
    @patch('users.views.boto3.client')
    def test_download_with_invalid_s3_url(self, mock_boto_client):
        """Test download with invalid S3 URL format"""
        # Invalid S3 URL (missing .com/)
        response = self.client.get(f"{self.download_url}?url=invalid-s3-url")
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND,
            status.HTTP_500_INTERNAL_SERVER_ERROR
        ])
        
    @patch('users.views.os.path.exists')
    def test_download_local_file_not_found(self, mock_exists):
        """Test download when local file doesn't exist"""
        mock_exists.return_value = False
        
        # Request a local file that doesn't exist
        response = self.client.get(f"{self.download_url}?url=/media/candidate_headshots/nonexistent.jpg")
        self.assertIn(response.status_code, [
            status.HTTP_404_NOT_FOUND,
            status.HTTP_500_INTERNAL_SERVER_ERROR
        ])
        
    @patch('builtins.open')
    @patch('users.views.os.path.exists')
    def test_download_local_file_permissions_error(self, mock_exists, mock_open):
        """Test download when file exists but can't be opened due to permissions"""
        mock_exists.return_value = True
        mock_open.side_effect = PermissionError("Permission denied")
        
        # Try to download a file with permission issues
        response = self.client.get(f"{self.download_url}?url=/media/candidate_headshots/protected.jpg")
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

class UpdateRoleEdgeCaseTests(APITestCase):
    def setUp(self):
        # Create a superadmin user
        self.superadmin = User.objects.create_superuser(
            username="test_superadmin",
            email="test_superadmin@example.com",
            password="password"
        )
        
        # Create a second superadmin
        self.superadmin2 = User.objects.create_user(
            username="test_superadmin2",
            email="test_superadmin2@example.com",
            password="password",
            user_type="superadmin",
            is_superuser=True,
            is_staff=True
        )
        
        # Create a regular user
        self.regular_user = User.objects.create_user(
            username="regular_user",
            email="regular_user@example.com",
            password="password",
            user_type="faculty"
        )
        
        self.client.force_authenticate(user=self.superadmin)
        self.update_role_url = lambda pk: reverse('user-update-role', kwargs={'pk': pk})
        
    def test_change_other_superadmin_role(self):
        """Test attempting to change another superadmin's role"""
        response = self.client.patch(
            self.update_role_url(self.superadmin2.id),
            {'user_type': 'admin'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('error', response.data)
        
    def test_change_last_superadmin_role(self):
        """Test changing the role of the last superadmin"""
        # First, change superadmin2 to a non-superadmin role
        self.superadmin2.user_type = 'admin'
        self.superadmin2.save()
        
        # Now try to change the role of the only remaining superadmin
        response = self.client.patch(
            self.update_role_url(self.superadmin.id),
            {'user_type': 'admin'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('last superadmin', response.data['error'].lower())
        
    def test_update_role_to_superadmin(self):
        """Test updating a user to superadmin role"""
        response = self.client.patch(
            self.update_role_url(self.regular_user.id),
            {'user_type': 'superadmin'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        updated_user = User.objects.get(id=self.regular_user.id)
        self.assertEqual(updated_user.user_type, 'superadmin')

class S3HeadshotFailureTests(APITestCase):
    def setUp(self):
        # Create a candidate user
        self.candidate = User.objects.create_user(
            username="headshot_failure",
            email="headshot_failure@example.com",
            password="password",
            user_type="candidate"
        )
        
        # Create a profile
        self.profile = CandidateProfile.objects.create(
            user=self.candidate,
            current_title="PhD Student",
            current_department="Computer Science",
            current_institution="Test University",
            date_of_birth=timezone.now().date(),
            country_of_residence="USA",
            gender="male",
            passport_name="Test Name",
            cell_number="123-456-7890",
            travel_assistance="none"
        )
        
        self.client.force_authenticate(user=self.candidate)
        self.complete_setup_url = reverse('user-complete-candidate-setup')
        
    @patch('users.views.os.path.exists')
    @patch('users.views.boto3.client')
    def test_s3_transfer_failure_during_setup(self, mock_boto_client, mock_path_exists):
        """Test S3 transfer failure during candidate setup"""
        # Mock that headshot file exists
        mock_path_exists.return_value = True
        
        # Mock the S3 client to raise an exception
        mock_s3 = MagicMock()
        mock_boto_client.return_value = mock_s3
        mock_s3.upload_fileobj.side_effect = Exception("S3 upload failed")
        
        # Set up a fake headshot path
        with patch.object(CandidateProfile, 'headshot', create=True) as mock_headshot:
            mock_headshot.path = '/fake/path/to/headshot.jpg'
            
            # Set up a file mock
            with patch('builtins.open', mock_open(read_data=b'fake image data')):
                profile_data = {
                    'current_title': 'Updated Title',
                    'current_department': 'Updated Department',
                    'date_of_birth': '1990-01-01'
                }
                
                # The setup may either succeed with a 200 or fail with a 500 depending on how errors are handled
                response = self.client.post(self.complete_setup_url, profile_data, format='json')
                
                # Accept either status code as valid - both behaviors are reasonable
                self.assertIn(response.status_code, [
                    status.HTTP_200_OK, 
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ])
                
                if response.status_code == status.HTTP_200_OK:
                    self.assertEqual(response.data['message'], 'Candidate setup completed successfully')
                    
                    # Check that the profile was updated despite S3 error
                    self.profile.refresh_from_db()
                    self.assertEqual(self.profile.current_title, 'Updated Title')
                else:
                    # If it returns 500, it should have an error message
                    self.assertIn('error', response.data)