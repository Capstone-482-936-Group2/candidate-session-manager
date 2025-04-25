from django.test import TestCase
from users.models import User, CandidateProfile
from django.utils import timezone
from datetime import timedelta
import os
from django.core.files.uploadedfile import SimpleUploadedFile

class UserModelTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin_test",
            email="admin_test@example.com",
            password="password",
            user_type="admin"
        )
        
        self.faculty = User.objects.create_user(
            username="faculty_test",
            email="faculty_test@example.com",
            password="password",
            user_type="faculty"
        )
        
        self.candidate = User.objects.create_user(
            username="candidate_test",
            email="candidate_test@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.superadmin = User.objects.create_superuser(
            username="super_test",
            email="super_test@example.com",
            password="password"
        )
    
    def test_user_creation(self):
        """Test that users can be created with correct attributes"""
        self.assertEqual(self.admin.email, "admin_test@example.com")
        self.assertEqual(self.admin.user_type, "admin")
        
        self.assertEqual(self.faculty.email, "faculty_test@example.com")
        self.assertEqual(self.faculty.user_type, "faculty")
        
        self.assertEqual(self.candidate.email, "candidate_test@example.com")
        self.assertEqual(self.candidate.user_type, "candidate")
        
        self.assertEqual(self.superadmin.email, "super_test@example.com")
        self.assertEqual(self.superadmin.user_type, "superadmin")
    
    def test_user_manager(self):
        """Test the custom UserManager methods"""
        # Test create_user with missing email
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", username="test")
    
    def test_user_properties(self):
        """Test user properties like is_admin, is_superadmin, needs_room_setup"""
        # Test is_admin property
        self.assertTrue(self.admin.is_admin)
        self.assertFalse(self.faculty.is_admin)
        self.assertFalse(self.candidate.is_admin)
        self.assertTrue(self.superadmin.is_admin)
        
        # Test is_superadmin property
        self.assertFalse(self.admin.is_superadmin)
        self.assertFalse(self.faculty.is_superadmin)
        self.assertFalse(self.candidate.is_superadmin)
        self.assertTrue(self.superadmin.is_superadmin)
        
        # Test needs_room_setup property
        self.assertTrue(self.admin.needs_room_setup)
        self.assertTrue(self.faculty.needs_room_setup)
        self.assertFalse(self.candidate.needs_room_setup)
        self.assertTrue(self.superadmin.needs_room_setup)
        
        # After setup completion
        self.faculty.has_completed_setup = True
        self.faculty.save()
        self.assertFalse(self.faculty.needs_room_setup)
    
    def test_string_representation(self):
        """Test string representation of User model"""
        self.assertEqual(str(self.admin), self.admin.email)

class CandidateProfileTests(TestCase):
    def setUp(self):
        self.candidate = User.objects.create_user(
            username="profile_candidate",
            email="profile_candidate@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.profile = CandidateProfile.objects.create(
            user=self.candidate,
            current_title="PhD Student",
            current_department="Computer Science",
            current_institution="Test University",
            research_interests="AI, Machine Learning",
            cell_number="123-456-7890",
            travel_assistance="none",
            passport_name="Test Candidate",
            date_of_birth=timezone.now().date() - timedelta(days=365*30),
            country_of_residence="USA",
            gender="prefer_not_to_say",
            preferred_airport="LAX",
            talk_title="Test Talk",
            abstract="Abstract of talk",
            biography="Short bio",
            videotape_permission="no",
            advertisement_permission="no",
            extra_tours="Not at this time"
        )
    
    def test_profile_creation(self):
        """Test creating a candidate profile"""
        self.assertEqual(self.profile.user, self.candidate)
        self.assertEqual(self.profile.current_title, "PhD Student")
        self.assertEqual(self.profile.talk_title, "Test Talk")
        self.assertFalse(self.profile.has_completed_setup)
    
    def test_profile_string_representation(self):
        """Test the string representation of profiles"""
        expected_string = f"Profile for {self.candidate.email}"
        self.assertEqual(str(self.profile), expected_string)
    
    def test_profile_json_fields(self):
        """Test the JSON fields in the profile"""
        self.profile.food_preferences = ["Vegetarian", "No Pork"]
        self.profile.dietary_restrictions = ["No Gluten"]
        self.profile.preferred_faculty = [1, 2, 3]
        self.profile.save()
        
        # Refresh from database to ensure JSON fields work
        refreshed_profile = CandidateProfile.objects.get(id=self.profile.id)
        self.assertEqual(refreshed_profile.food_preferences, ["Vegetarian", "No Pork"])
        self.assertEqual(refreshed_profile.dietary_restrictions, ["No Gluten"])
        self.assertEqual(refreshed_profile.preferred_faculty, [1, 2, 3])
    
    def test_headshot_path(self):
        """Test the headshot_path function"""
        from users.models import headshot_path
        
        # Create a test file
        test_image = SimpleUploadedFile(
            name='test.jpg',
            content=b'test content',
            content_type='image/jpeg'
        )
        
        # Test the path generation
        path = headshot_path(self.profile, 'original_filename.jpg')
        self.assertTrue(path.startswith('candidate_headshots/user_'))
        self.assertTrue(path.endswith('.jpg'))
    
    def test_profile_save_and_delete(self):
        """Test the overridden save and delete methods"""
        # Create a new user for this test to avoid unique constraint
        test_user = User.objects.create_user(
            username="profile_test_user",
            email="profile_test_user@example.com",
            password="password",
            user_type="candidate"
        )
        
        # Create a profile with a headshot to test file handling
        profile = CandidateProfile.objects.create(
            user=test_user,  # Use the new user
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
        
        # Save the profile
        profile.save()
        self.assertIsNotNone(profile.pk)
        
        # Update the profile
        profile.current_title = "Updated Title"
        profile.save()
        
        # Verify the update
        refreshed = CandidateProfile.objects.get(pk=profile.pk)
        self.assertEqual(refreshed.current_title, "Updated Title")
        
        # Test delete
        profile_id = profile.id
        profile.delete()
        self.assertEqual(CandidateProfile.objects.filter(id=profile_id).count(), 0)
    # Additional tests to add to backend/users/tests/test_models.py
    def test_faculty_properties(self):
        """Test faculty-specific properties"""
        # Create a faculty user with and without room number
        faculty_with_room = User.objects.create_user(
            username="faculty_with_room",
            email="faculty_with_room@example.com",
            password="password",
            user_type="faculty",
            room_number="Room 123",
            has_completed_setup=True
        )
        
        faculty_without_room = User.objects.create_user(
            username="faculty_without_room",
            email="faculty_without_room@example.com",
            password="password",
            user_type="faculty",
            room_number=""
        )
        
        # Test room status
        self.assertFalse(faculty_with_room.needs_room_setup)
        self.assertTrue(faculty_without_room.needs_room_setup)
        
        # Test completion status
        faculty_with_room.has_completed_setup = True
        faculty_with_room.save()
        self.assertFalse(faculty_with_room.needs_room_setup)

    def test_superuser_create_edge_cases(self):
        """Test edge cases for creating superusers"""
        # Test creating superuser with is_staff=False (should be overridden to True)
        superuser = User.objects.create_superuser(
            username="edge_superuser",
            email="edge_superuser@example.com",
            password="password",
            is_staff=True
        )
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)
        
        # Test attempting to create superuser with is_superuser=False (should raise ValueError)
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                username="invalid_superuser",
                email="invalid_superuser@example.com",
                password="password",
                is_superuser=False
            )
        
        # Test creating superuser with empty password (should raise ValueError)
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                username="no_pass_super",
                email="no_pass_super@example.com",
                password=""
            )