import io
from django.urls import reverse
from rest_framework.test import APIRequestFactory, force_authenticate
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch
from users.models import User, CandidateProfile
from django.test import TestCase

class TestUploadHeadshotFunction(TestCase):
    @patch('users.views.CandidateProfile.objects.get_or_create')
    def test_upload_headshot_success(self, mock_get_or_create):
        """Test successful upload of a headshot image"""
        from users.views import upload_headshot

        # Create a user and mock profile
        user = User.objects.create_user(username="candidate", email="candidate@example.com", password="password")
        profile = CandidateProfile(user=user)
        mock_get_or_create.return_value = (profile, True)

        # Create a fake image file
        image = SimpleUploadedFile(
            "test.jpg", b"file_content", content_type="image/jpeg"
        )

        factory = APIRequestFactory()
        request = factory.post("/fake-url/", {"file": image}, format="multipart")
        force_authenticate(request, user=user)

        # Patch profile.save and set profile.headshot to a mock with .url and .delete()
        with patch.object(profile, "save") as mock_save:
            class Headshot:
                url = "http://testserver/media/test.jpg"
                def delete(self, save): pass
            profile.headshot = Headshot()
            response = upload_headshot(request)
            self.assertEqual(response.status_code, 200)
            self.assertIn("url", response.data)
            self.assertEqual(response.data["message"], "Headshot uploaded successfully")

    @patch('users.views.CandidateProfile.objects.get_or_create')
    def test_upload_headshot_no_file(self, mock_get_or_create):
        """Test upload with no file provided"""
        from users.views import upload_headshot

        user = User.objects.create_user(username="candidate2", email="candidate2@example.com", password="password")
        profile = CandidateProfile(user=user)
        mock_get_or_create.return_value = (profile, True)

        factory = APIRequestFactory()
        request = factory.post("/fake-url/", {}, format="multipart")
        force_authenticate(request, user=user)

        response = upload_headshot(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "No file provided")

    @patch('users.views.CandidateProfile.objects.get_or_create')
    def test_upload_headshot_wrong_type(self, mock_get_or_create):
        """Test upload with a non-image file"""
        from users.views import upload_headshot

        user = User.objects.create_user(username="candidate3", email="candidate3@example.com", password="password")
        profile = CandidateProfile(user=user)
        mock_get_or_create.return_value = (profile, True)

        # Create a fake text file
        text_file = SimpleUploadedFile(
            "test.txt", b"hello", content_type="text/plain"
        )

        factory = APIRequestFactory()
        request = factory.post("/fake-url/", {"file": text_file}, format="multipart")
        force_authenticate(request, user=user)

        response = upload_headshot(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "File must be an image")

    @patch('users.views.CandidateProfile.objects.get_or_create')
    def test_upload_headshot_too_large(self, mock_get_or_create):
        """Test upload with a file that's too large"""
        from users.views import upload_headshot

        user = User.objects.create_user(username="candidate4", email="candidate4@example.com", password="password")
        profile = CandidateProfile(user=user)
        mock_get_or_create.return_value = (profile, True)

        # Create a fake image file >5MB
        big_content = b"x" * (5 * 1024 * 1024 + 1)
        big_image = SimpleUploadedFile(
            "big.jpg", big_content, content_type="image/jpeg"
        )

        factory = APIRequestFactory()
        request = factory.post("/fake-url/", {"file": big_image}, format="multipart")
        force_authenticate(request, user=user)

        response = upload_headshot(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "File size must be less than 5MB")

    @patch('users.views.CandidateProfile.objects.get_or_create')
    def test_upload_headshot_exception(self, mock_get_or_create):
        """Test upload when an exception is raised"""
        from users.views import upload_headshot

        user = User.objects.create_user(username="candidate5", email="candidate5@example.com", password="password")
        # Simulate get_or_create raising an exception
        mock_get_or_create.side_effect = Exception("DB error")

        factory = APIRequestFactory()
        image = SimpleUploadedFile(
            "test.jpg", b"file_content", content_type="image/jpeg"
        )
        request = factory.post("/fake-url/", {"file": image}, format="multipart")
        force_authenticate(request, user=user)

        response = upload_headshot(request)
        self.assertEqual(response.status_code, 500)
        self.assertIn("error", response.data)

    @patch('users.views.CandidateProfile.objects.get_or_create')
    def test_upload_headshot_replaces_old_headshot(self, mock_get_or_create):
        """Test uploading a new headshot deletes the old one first"""
        from users.views import upload_headshot

        user = User.objects.create_user(username="candidate6", email="candidate6@example.com", password="password")
        profile = CandidateProfile(user=user)
        mock_get_or_create.return_value = (profile, True)

        # Create a fake image file
        image = SimpleUploadedFile(
            "test.jpg", b"file_content", content_type="image/jpeg"
        )

        # Simulate an existing headshot with a .delete() method
        class OldHeadshot:
            url = "http://testserver/media/old.jpg"
            def __init__(self):
                self.deleted = False
            def delete(self, save):
                self.deleted = True

        old_headshot = OldHeadshot()
        profile.headshot = old_headshot

        factory = APIRequestFactory()
        request = factory.post("/fake-url/", {"file": image}, format="multipart")
        force_authenticate(request, user=user)

        # Patch only profile.save so we don't hit the DB
        with patch.object(profile, "save") as mock_save:
            # The view will assign a new headshot after calling .delete()
            response = upload_headshot(request)
            self.assertEqual(response.status_code, 200)
            self.assertIn("url", response.data)
            self.assertEqual(response.data["message"], "Headshot uploaded successfully")
            self.assertTrue(old_headshot.deleted)
