from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from candidate_sessions.models import (
    Form, FormField, FormFieldOption, FormSubmission, Session,
    CandidateSection, SessionTimeSlot, FacultyAvailability, AvailabilityTimeSlot,
    AvailabilityInvitation, LocationType, Location, TimeSlotTemplate
)
from candidate_sessions.serializers import (
    FormSubmissionSerializer, LocationTypeSerializer, LocationSerializer,
    TimeSlotTemplateSerializer, FormSerializer, AvailabilityInvitationSerializer,
    FacultyAvailabilitySerializer, FacultyAvailabilityCreateSerializer,
    SessionCreateSerializer, SessionTimeSlotCreateSerializer,
    CandidateSectionCreateSerializer, SessionTimeSlotSerializer
)
from datetime import datetime, timedelta
from rest_framework.exceptions import ValidationError

User = get_user_model()

class FormSubmissionRepresentationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password",
            user_type="admin"
        )
        
        self.form = Form.objects.create(
            title="Test Form",
            description="Test Description",
            created_by=self.admin
        )
        
        # Add form fields
        self.text_field = FormField.objects.create(
            form=self.form,
            type="text",
            label="Name",
            required=True,
            order=1
        )
        
        self.select_field = FormField.objects.create(
            form=self.form,
            type="select",
            label="Color",
            required=True,
            order=2
        )
        
        # Add options for select field
        self.option1 = FormFieldOption.objects.create(
            field=self.select_field,
            label="Red",
            order=1
        )
        
        self.option2 = FormFieldOption.objects.create(
            field=self.select_field,
            label="Blue",
            order=2
        )
        
        # Create a submission
        self.submission = FormSubmission.objects.create(
            form=self.form,
            submitted_by=self.user,
            answers={
                str(self.text_field.id): "John Doe",
                str(self.select_field.id): "Red"
            },
            is_completed=True
        )

    def test_form_submission_representation(self):
        """Test to_representation method adds form_version field"""
        factory = APIRequestFactory()
        request = factory.get('/')
        request.user = self.user
        
        serializer = FormSubmissionSerializer(self.submission, context={'request': request})
        data = serializer.data
        
        # Check form_version is included
        self.assertIn('form_version', data)
        self.assertIn('fields', data['form_version'])
        
        # Check fields are correctly represented
        fields = data['form_version']['fields']
        self.assertEqual(len(fields), 2)
        
        # Check text field representation
        text_field_id = str(self.text_field.id)
        self.assertIn(text_field_id, fields)
        self.assertEqual(fields[text_field_id]['type'], 'text')
        self.assertEqual(fields[text_field_id]['label'], 'Name')
        
        # Check select field representation
        select_field_id = str(self.select_field.id)
        self.assertIn(select_field_id, fields)
        self.assertEqual(fields[select_field_id]['type'], 'select')
        self.assertEqual(fields[select_field_id]['label'], 'Color')

class LocationTypeSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password",
            user_type="admin"
        )
        
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        self.request.user = self.user
    
    def test_create_location_type(self):
        """Test creating a location type sets the created_by field"""
        serializer = LocationTypeSerializer(data={
            'name': 'Conference Room',
            'description': 'Rooms for meetings and conferences'
        }, context={'request': self.request})
        
        self.assertTrue(serializer.is_valid())
        location_type = serializer.save()
        
        self.assertEqual(location_type.name, 'Conference Room')
        self.assertEqual(location_type.created_by, self.user)

class LocationSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password",
            user_type="admin"
        )
        
        self.location_type = LocationType.objects.create(
            name="Building",
            description="Campus buildings",
            created_by=self.user
        )
        
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        self.request.user = self.user
    
    def test_create_location(self):
        """Test creating a location sets the created_by field"""
        serializer = LocationSerializer(data={
            'name': 'Engineering Building',
            'description': 'Main engineering building',
            'location_type': self.location_type.id,
            'address': '123 Campus Dr'
        }, context={'request': self.request})
        
        self.assertTrue(serializer.is_valid())
        location = serializer.save()
        
        self.assertEqual(location.name, 'Engineering Building')
        self.assertEqual(location.created_by, self.user)
        self.assertEqual(location.location_type, self.location_type)

class TimeSlotTemplateSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password",
            user_type="admin"
        )
        
        self.location_type = LocationType.objects.create(
            name="Room",
            description="Meeting rooms",
            created_by=self.user
        )
        
        self.location = Location.objects.create(
            name="Room 101",
            description="Conference room",
            location_type=self.location_type,
            created_by=self.user
        )
        
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        self.request.user = self.user
    
    def test_create_template_with_location(self):
        """Test creating a template with specific location"""
        serializer = TimeSlotTemplateSerializer(data={
            'name': 'Morning Meeting',
            'description': '1-hour morning slot',
            'start_time': '09:00:00',
            'duration_minutes': 60,
            'max_attendees': 10,
            'use_location_type': False,
            'location': self.location.id,
            'is_visible': True
        }, context={'request': self.request})
        
        self.assertTrue(serializer.is_valid())
        template = serializer.save()
        
        self.assertEqual(template.name, 'Morning Meeting')
        self.assertEqual(template.created_by, self.user)
        self.assertEqual(template.location, self.location)
        self.assertFalse(template.use_location_type)
    
    def test_create_template_with_location_type(self):
        """Test creating a template with location type"""
        serializer = TimeSlotTemplateSerializer(data={
            'name': 'Afternoon Meeting',
            'description': '1-hour afternoon slot',
            'start_time': '14:00:00',
            'duration_minutes': 60,
            'max_attendees': 8,
            'use_location_type': True,
            'location_type': self.location_type.id,
            'is_visible': True
        }, context={'request': self.request})
        
        self.assertTrue(serializer.is_valid())
        template = serializer.save()
        
        self.assertEqual(template.name, 'Afternoon Meeting')
        self.assertEqual(template.created_by, self.user)
        self.assertEqual(template.location_type, self.location_type)
        self.assertTrue(template.use_location_type)

class SessionCreateSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password", 
            user_type="admin"
        )
        
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        self.request.user = self.user
    
    def test_create_session(self):
        """Test creating a session sets the created_by field"""
        serializer = SessionCreateSerializer(data={
            'title': 'Spring Review',
            'description': 'Spring semester candidate review',
            'start_date': timezone.now().date(),
            'end_date': timezone.now().date() + timedelta(days=2)
        }, context={'request': self.request})
        
        self.assertTrue(serializer.is_valid())
        session = serializer.save()
        
        self.assertEqual(session.title, 'Spring Review')
        self.assertEqual(session.created_by, self.user)

class FacultyAvailabilitySerializerGetterTests(TestCase):
    def setUp(self):
        # Create faculty user
        self.faculty = User.objects.create_user(
            username="faculty",
            email="faculty@example.com",
            password="password",
            user_type="faculty",
            first_name="John",
            last_name="Smith",
            room_number="Room 101"
        )
        
        # Create candidate user
        self.candidate = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="password",
            user_type="candidate"
        )
        
        # Create session
        self.session = Session.objects.create(
            title="Test Session",
            description="Test session description",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=2),
            created_by=self.candidate
        )
        
        # Create candidate section
        self.section = CandidateSection.objects.create(
            title="Test Section",
            description="Test section description",
            candidate=self.candidate,
            session=self.session
        )
        
        # Create faculty availability
        self.availability = FacultyAvailability.objects.create(
            faculty=self.faculty,
            candidate_section=self.section,
            notes="Available in the morning"
        )
        
        # Add time slots
        self.time_slot1 = AvailabilityTimeSlot.objects.create(
            availability=self.availability,
            start_time=timezone.now().replace(hour=9, minute=0),
            end_time=timezone.now().replace(hour=10, minute=0)
        )
        
        self.time_slot2 = AvailabilityTimeSlot.objects.create(
            availability=self.availability,
            start_time=timezone.now().replace(hour=11, minute=0),
            end_time=timezone.now().replace(hour=12, minute=0)
        )
    
    def test_get_faculty_name(self):
        """Test get_faculty_name method returns the correct name"""
        serializer = FacultyAvailabilitySerializer(self.availability)
        
        self.assertEqual(serializer.get_faculty_name(self.availability), "John Smith")
    
    def test_get_faculty_email(self):
        """Test get_faculty_email method returns the correct email"""
        serializer = FacultyAvailabilitySerializer(self.availability)
        
        self.assertEqual(serializer.get_faculty_email(self.availability), "faculty@example.com")
    
    def test_get_faculty_room(self):
        """Test get_faculty_room method returns the correct room"""
        serializer = FacultyAvailabilitySerializer(self.availability)
        
        self.assertEqual(serializer.get_faculty_room(self.availability), "Room 101")

class AvailabilityInvitationSerializerTests(TestCase):
    def setUp(self):
        # Create faculty user
        self.faculty = User.objects.create_user(
            username="faculty",
            email="faculty@example.com",
            password="password",
            user_type="faculty",
            first_name="Jane",
            last_name="Doe"
        )
        
        # Create candidate user
        self.candidate = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="password",
            user_type="candidate",
            first_name="John",
            last_name="Smith"
        )
        
        # Create session
        self.session = Session.objects.create(
            title="Test Session",
            description="Test session description",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=2),
            created_by=self.candidate
        )
        
        # Create candidate section
        self.section = CandidateSection.objects.create(
            title="Candidate Presentation",
            description="Test section description",
            candidate=self.candidate,
            session=self.session
        )
        
        # Create invitation
        self.invitation = AvailabilityInvitation.objects.create(
            faculty=self.faculty,
            candidate_section=self.section,
            created_by=self.candidate
        )
    
    def test_get_faculty_name(self):
        """Test get_faculty_name method returns the correct name"""
        serializer = AvailabilityInvitationSerializer(self.invitation)
        
        self.assertEqual(serializer.get_faculty_name(self.invitation), "Jane Doe")
    
    def test_get_candidate_name(self):
        """Test get_candidate_name method returns the correct name"""
        serializer = AvailabilityInvitationSerializer(self.invitation)
        
        self.assertEqual(serializer.get_candidate_name(self.invitation), "John Smith")
    
    def test_get_candidate_section_title(self):
        """Test get_candidate_section_title method returns the correct title"""
        serializer = AvailabilityInvitationSerializer(self.invitation)
        
        self.assertEqual(serializer.get_candidate_section_title(self.invitation), "Candidate Presentation") 