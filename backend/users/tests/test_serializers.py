from django.test import TestCase
from users.models import User, CandidateProfile
from users.serializers import UserSerializer, RegisterSerializer, UserUpdateSerializer
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta

class UserSerializerTests(TestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin_serializer",
            email="admin_serializer@example.com",
            password="password",
            user_type="admin"
        )
        
        self.faculty_user = User.objects.create_user(
            username="faculty_serializer",
            email="faculty_serializer@example.com",
            password="password",
            user_type="faculty",
            room_number="Room 101"
        )
        
        self.candidate_user = User.objects.create_user(
            username="candidate_serializer",
            email="candidate_serializer@example.com",
            password="password",
            user_type="candidate"
        )
        
        # Create a profile for the candidate
        self.profile = CandidateProfile.objects.create(
            user=self.candidate_user,
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

    def test_user_serializer(self):
        """Test the UserSerializer with authenticated context"""
        context = {
            'request': type('Request', (), {'user': self.admin_user}),
            'is_superadmin': True
        }
        
        serializer = UserSerializer(instance=self.faculty_user, context=context)
        data = serializer.data
        
        self.assertEqual(data['username'], self.faculty_user.username)
        self.assertEqual(data['email'], self.faculty_user.email)
        self.assertEqual(data['user_type'], self.faculty_user.user_type)
        self.assertEqual(data['room_number'], self.faculty_user.room_number)

    def test_register_serializer(self):
        """Test the RegisterSerializer"""
        data = {
            'email': 'new_user@example.com',
            'username': 'new_user@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'user_type': 'faculty'
        }
        
        serializer = RegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        user = serializer.save()
        self.assertEqual(user.email, data['email'])
        self.assertEqual(user.username, data['email'])  # Uses email as username
        self.assertEqual(user.first_name, data['first_name'])
        self.assertEqual(user.user_type, data['user_type'])

    def test_user_update_serializer(self):
        """Test the UserUpdateSerializer"""
        update_data = {
            'first_name': 'Updated',
            'last_name': 'Name',
            'room_number': 'New Room 102',
            'has_completed_setup': True
        }
        
        serializer = UserUpdateSerializer(
            instance=self.faculty_user,
            data=update_data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        
        self.assertEqual(user.first_name, update_data['first_name'])
        self.assertEqual(user.last_name, update_data['last_name'])
        self.assertEqual(user.room_number, update_data['room_number'])
        self.assertEqual(user.has_completed_setup, update_data['has_completed_setup'])