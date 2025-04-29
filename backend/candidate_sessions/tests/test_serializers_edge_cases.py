from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from candidate_sessions.models import (
    Form, FormField, FormFieldOption, FormSubmission, Session,
    CandidateSection, SessionTimeSlot, FacultyAvailability, AvailabilityTimeSlot,
    AvailabilityInvitation
)
from candidate_sessions.serializers import (
    FormSubmissionSerializer, FormFieldSerializer, FormSerializer, 
    FacultyAvailabilityCreateSerializer, SessionTimeSlotSerializer, SessionTimeSlotCreateSerializer
)
from rest_framework.test import APIRequestFactory
from datetime import datetime, timedelta
import json

User = get_user_model()

class FormSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="test",
            email="test@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.form = Form.objects.create(
            title="Test Form",
            description="Test Description",
            created_by=self.user
        )
        
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        self.request.user = self.user
    
    def test_update_form_with_nested_fields(self):
        """Test updating a form with nested field data"""
        # Create a form with fields
        field1 = FormField.objects.create(
            form=self.form,
            type="text",
            label="Name",
            required=True,
            order=1
        )
        
        field2 = FormField.objects.create(
            form=self.form,
            type="select",
            label="Color",
            required=True,
            order=2
        )
        
        option1 = FormFieldOption.objects.create(
            field=field2,
            label="Red",
            order=1
        )
        
        option2 = FormFieldOption.objects.create(
            field=field2,
            label="Blue",
            order=2
        )
        
        # Create serializer for update
        serializer = FormSerializer(
            instance=self.form,
            data={
                'title': 'Updated Form',
                'description': 'Updated Description',
                'is_active': True,
                'form_fields': [
                    # Update existing field
                    {
                        'id': field1.id,
                        'type': 'text',
                        'label': 'Full Name',  # Changed
                        'required': True,
                        'order': 1
                    },
                    # Update existing field with options
                    {
                        'id': field2.id,
                        'type': 'select',
                        'label': 'Favorite Color',  # Changed
                        'required': True,
                        'order': 2,
                        'options': [
                            # Keep one option
                            {
                                'id': option1.id,
                                'label': 'Red',
                                'order': 1
                            },
                            # Add new option
                            {
                                'label': 'Green',
                                'order': 2
                            }
                            # option2 will be deleted
                        ]
                    },
                    # Add new field
                    {
                        'type': 'checkbox',
                        'label': 'Interests',
                        'required': False,
                        'order': 3,
                        'options': [
                            {'label': 'Sports', 'order': 1},
                            {'label': 'Music', 'order': 2}
                        ]
                    }
                ]
            },
            partial=True,
            context={'request': self.request}
        )
        
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_form = serializer.save()
        
        # Verify updates
        self.assertEqual(updated_form.title, 'Updated Form')
        
        # Refresh form fields from database
        updated_form = Form.objects.get(id=self.form.id)
        self.assertEqual(updated_form.form_fields.count(), 3)
        
        # Check field1 updates
        updated_field1 = updated_form.form_fields.get(label='Full Name')
        self.assertEqual(updated_field1.label, 'Full Name')
        
        # Check field2 updates
        updated_field2 = updated_form.form_fields.get(label='Favorite Color')
        self.assertEqual(updated_field2.label, 'Favorite Color')
        self.assertEqual(updated_field2.options.count(), 2)
        self.assertTrue(updated_field2.options.filter(label='Red').exists())
        self.assertTrue(updated_field2.options.filter(label='Green').exists())
        self.assertFalse(updated_field2.options.filter(label='Blue').exists())
        
        # Check new field
        new_field = updated_form.form_fields.get(label='Interests')
        self.assertEqual(new_field.type, 'checkbox')
        self.assertEqual(new_field.options.count(), 2)

class FacultyAvailabilitySerializerTests(TestCase):
    def setUp(self):
        self.faculty = User.objects.create_user(
            username="faculty",
            email="faculty@example.com",
            password="password",
            user_type="faculty",
            room_number="Room 101"
        )
        
        self.candidate = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.session = Session.objects.create(
            title="Test Session",
            description="Test Session Description",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=2),
            created_by=self.faculty
        )
        
        self.section = CandidateSection.objects.create(
            title="Test Section",
            candidate=self.candidate,
            session=self.session
        )
        
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        self.request.user = self.faculty
    
    def test_create_faculty_availability(self):
        """Test creating faculty availability with time slots"""
        serializer = FacultyAvailabilityCreateSerializer(
            data={
                'candidate_section': self.section.id,
                'notes': 'Available in the mornings',
                'time_slots': [
                    {
                        'start_time': timezone.now().replace(hour=9, minute=0),
                        'end_time': timezone.now().replace(hour=10, minute=0)
                    },
                    {
                        'start_time': timezone.now().replace(hour=11, minute=0),
                        'end_time': timezone.now().replace(hour=12, minute=0)
                    }
                ]
            },
            context={'request': self.request}
        )
        
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        availability = FacultyAvailability.objects.create(
            faculty=self.faculty,
            candidate_section=self.section,
            notes='Available in the mornings'
        )
        
        for slot_data in serializer.validated_data['time_slots']:
            AvailabilityTimeSlot.objects.create(
                availability=availability,
                start_time=slot_data['start_time'],
                end_time=slot_data['end_time']
            )
        
        self.assertEqual(availability.faculty, self.faculty)
        self.assertEqual(availability.candidate_section, self.section)
        self.assertEqual(availability.notes, 'Available in the mornings')
        self.assertEqual(availability.time_slots.count(), 2)

class SessionTimeSlotSerializerTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", 
            email="admin@example.com",
            password="password",
            user_type="admin"
        )
        
        self.candidate = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.faculty = User.objects.create_user(
            username="faculty",
            email="faculty@example.com",
            password="password",
            user_type="faculty"
        )
        
        # Create session
        self.session = Session.objects.create(
            title="Test Session",
            description="Test session description",
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=2),
            created_by=self.admin
        )
        
        # Create candidate section
        self.section = CandidateSection.objects.create(
            title="Test Section",
            description="Test section description",
            candidate=self.candidate,
            session=self.session
        )
        
        # Create time slot
        self.time_slot = SessionTimeSlot.objects.create(
            candidate_section=self.section,
            start_time=timezone.now().replace(hour=9, minute=0),
            end_time=timezone.now().replace(hour=10, minute=0),
            max_attendees=3,
            location="Room 101",
            is_visible=True
        )
        
    def test_session_time_slot_computed_fields(self):
        """Test computed fields like available_slots and is_full"""
        # Add an attendee
        self.time_slot.attendees.create(user=self.faculty)
        
        serializer = SessionTimeSlotSerializer(self.time_slot)
        data = serializer.data
        
        # Check computed fields
        self.assertEqual(data['available_slots'], 2)
        self.assertFalse(data['is_full'])
        
        # Add more attendees to reach capacity
        self.time_slot.attendees.create(user=self.admin)
        self.time_slot.attendees.create(user=self.candidate)
        
        # Re-serialize to get updated computed values
        serializer = SessionTimeSlotSerializer(self.time_slot)
        data = serializer.data
        
        # Now should be full
        self.assertEqual(data['available_slots'], 0)
        self.assertTrue(data['is_full'])

class SessionTimeSlotCreateSerializerTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password",
            user_type="admin"
        )
        
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
            created_by=self.admin
        )
        
        # Create candidate section
        self.section = CandidateSection.objects.create(
            title="Test Section",
            description="Test section description",
            candidate=self.candidate,
            session=self.session
        )
        
        # Get session start and end dates for validation
        self.session_start = self.session.start_date
        self.session_end = self.session.end_date
        
        # Factory for requests
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        self.request.user = self.admin
        
    def test_validate_time_slot_within_session(self):
        """Test validation that time slot is within session dates"""
        # Create valid time slot data
        data = {
            'candidate_section': self.section.id,
            'start_time': datetime.combine(self.session_start, datetime.min.time().replace(hour=9)),
            'end_time': datetime.combine(self.session_start, datetime.min.time().replace(hour=10)),
            'max_attendees': 3,
            'location': 'Room 101',
            'is_visible': True
        }
        
        serializer = SessionTimeSlotCreateSerializer(data=data, context={'request': self.request})
        self.assertTrue(serializer.is_valid())
        
        # Test start time before session start date
        invalid_data = data.copy()
        invalid_data['start_time'] = datetime.combine(self.session_start - timedelta(days=1), 
                                                    datetime.min.time().replace(hour=9))
        
        serializer = SessionTimeSlotCreateSerializer(data=invalid_data, context={'request': self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('start_time', serializer.errors)
        
        # Test end time after session end date
        invalid_data = data.copy()
        invalid_data['end_time'] = datetime.combine(self.session_end + timedelta(days=1), 
                                                  datetime.min.time().replace(hour=10))
        
        serializer = SessionTimeSlotCreateSerializer(data=invalid_data, context={'request': self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('end_time', serializer.errors)
        
        # Test end time before start time
        invalid_data = data.copy()
        invalid_data['end_time'] = invalid_data['start_time'] - timedelta(hours=1)
        
        serializer = SessionTimeSlotCreateSerializer(data=invalid_data, context={'request': self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('end_time', serializer.errors) 