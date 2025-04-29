from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model
from candidate_sessions.models import (
    Form, FormField, FormFieldOption, FormSubmission, Session,
    CandidateSection, SessionTimeSlot, FacultyAvailability, AvailabilityTimeSlot,
    AvailabilityInvitation, LocationType, Location, TimeSlotTemplate
)
from candidate_sessions.serializers import (
    FormSubmissionSerializer, FormFieldSerializer, 
    FormSerializer, TimeSlotTemplateSerializer,
    LocationTypeSerializer, LocationSerializer,
    SessionCreateSerializer, SessionTimeSlotCreateSerializer,
    CandidateSectionCreateSerializer, AvailabilityInvitationSerializer
)
from rest_framework.test import APIRequestFactory, APITestCase
from datetime import datetime, timedelta
from users.models import User
from rest_framework import serializers
import datetime

User = get_user_model()

class FormFieldSerializerValidationTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')
        
        self.user = User.objects.create_user(
            username="test",
            email="test@example.com",
            password="password",
            user_type="admin"
        )
        self.request.user = self.user
    
    def test_validate_select_field_with_options(self):
        """Test validation with select field type requiring options"""
        serializer = FormFieldSerializer(data={
            'type': 'select',
            'label': 'Test Select',
            'required': True,
            'order': 1,
            'options': [
                {'label': 'Option 1', 'order': 1},
                {'label': 'Option 2', 'order': 2}
            ]
        })
        
        self.assertTrue(serializer.is_valid())
    
    def test_validate_select_field_without_options(self):
        """Test validation fails for select field without options"""
        serializer = FormFieldSerializer(data={
            'type': 'select',
            'label': 'Test Select',
            'required': True,
            'order': 1,
            'options': []
        })
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('options', serializer.errors)
    
    def test_validate_text_field_with_options(self):
        """Test validation warns about options in text field"""
        serializer = FormFieldSerializer(data={
            'type': 'text',
            'label': 'Test Text',
            'required': True,
            'order': 1,
            'options': [
                {'label': 'Option 1', 'order': 1}
            ]
        })
        
        self.assertTrue(serializer.is_valid())  # Should be valid, but with a warning
    
    def test_create_field_with_options(self):
        """Test creating a field with options"""
        form = Form.objects.create(
            title="Test Form",
            description="Test Description",
            created_by=self.user
        )
        
        serializer = FormFieldSerializer(data={
            'type': 'radio',
            'label': 'Test Radio',
            'required': True,
            'order': 1,
            'options': [
                {'label': 'Yes', 'order': 1},
                {'label': 'No', 'order': 2}
            ]
        }, context={'form': form})
        
        self.assertTrue(serializer.is_valid())
        field = serializer.save(form=form)
        
        self.assertEqual(field.options.count(), 2)
        self.assertTrue(field.options.filter(label='Yes').exists())
        self.assertTrue(field.options.filter(label='No').exists())

class FormSubmissionSerializerTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        
        self.user = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="password",
            user_type="candidate"
        )
        
        self.request = self.factory.get('/')
        self.request.user = self.user
        
        # Create a form
        self.form = Form.objects.create(
            title="Test Form",
            description="Test Description",
            created_by=self.user
        )
        
        # Create form fields
        self.text_field = FormField.objects.create(
            form=self.form,
            type="text",
            label="Name",
            required=True,
            order=1
        )
        
        self.date_range_field = FormField.objects.create(
            form=self.form,
            type="date_range",
            label="Available Dates",
            required=True,
            order=2
        )
    
    def test_validate_answers_missing_required(self):
        """Test validation fails when required fields are missing"""
        serializer = FormSubmissionSerializer(data={
            'form': self.form.id,
            'answers': {
                str(self.text_field.id): 'John Doe',
                # Missing date_range_field
            },
            'is_completed': True
        }, context={'form': self.form, 'request': self.request})
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('answers', serializer.errors)
    
    def test_validate_answers_invalid_date_range(self):
        """Test validation fails for invalid date range format"""
        serializer = FormSubmissionSerializer(data={
            'form': self.form.id,
            'answers': {
                str(self.text_field.id): 'John Doe',
                str(self.date_range_field.id): 'not a date range'  # Invalid format
            },
            'is_completed': True
        }, context={'form': self.form, 'request': self.request})
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('answers', serializer.errors)
    
    def test_validate_answers_date_range_missing_dates(self):
        """Test validation fails for date range with missing dates"""
        serializer = FormSubmissionSerializer(data={
            'form': self.form.id,
            'answers': {
                str(self.text_field.id): 'John Doe',
                str(self.date_range_field.id): {'startDate': '2023-01-01'}  # Missing endDate
            },
            'is_completed': True
        }, context={'form': self.form, 'request': self.request})
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('answers', serializer.errors)
    
    def test_validate_answers_date_range_invalid_order(self):
        """Test validation fails for date range with end before start"""
        serializer = FormSubmissionSerializer(data={
            'form': self.form.id,
            'answers': {
                str(self.text_field.id): 'John Doe',
                str(self.date_range_field.id): {
                    'startDate': '2023-02-01',
                    'endDate': '2023-01-01'  # End date before start date
                }
            },
            'is_completed': True
        }, context={'form': self.form, 'request': self.request})
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('answers', serializer.errors)
    
    def test_create_duplicate_submission(self):
        """Test creating a duplicate submission fails"""
        # Create an existing submission
        FormSubmission.objects.create(
            form=self.form,
            submitted_by=self.user,
            answers={
                str(self.text_field.id): 'John Doe',
                str(self.date_range_field.id): {
                    'startDate': '2023-01-01',
                    'endDate': '2023-01-10'
                }
            },
            is_completed=True
        )
        
        # Try to create another submission
        serializer = FormSubmissionSerializer(data={
            'form': self.form.id,
            'answers': {
                str(self.text_field.id): 'John Doe Again',
                str(self.date_range_field.id): {
                    'startDate': '2023-02-01',
                    'endDate': '2023-02-10'
                }
            },
            'is_completed': True
        }, context={'form': self.form, 'request': self.request})
        
        self.assertTrue(serializer.is_valid())
        
        # Try to save should raise validation error
        with self.assertRaises(ValidationError):
            serializer.save()

class CandidateSectionCreateSerializerTest(APITestCase):
    def test_non_admin_cannot_create_candidate_section(self):
        user = User.objects.create_user(email='test@x.com', username='test', password='pw', user_type='candidate')
        session = Session.objects.create(
            title="Test Session",
            start_date=datetime.date(2024, 1, 1),
            end_date=datetime.date(2024, 1, 2),
            created_by=user
        )
        data = {
            "title": "Section",
            "description": "",
            "location": "Room 1",
            "needs_transportation": False,
            "candidate": user.id,
            "session": session.id,
        }
        factory = APIRequestFactory()
        request = factory.post('/', data)
        request.user = user
        serializer = CandidateSectionCreateSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.save()
        self.assertIn("Only administrators can create candidate sections.", str(cm.exception))

class SessionCreateSerializerTest(APITestCase):
    def test_non_admin_cannot_create_session(self):
        user = User.objects.create_user(email='test2@x.com', username='test2', password='pw', user_type='candidate')
        data = {
            "title": "Session",
            "start_date": datetime.date(2024, 1, 1),
            "end_date": datetime.date(2024, 1, 2)
        }
        factory = APIRequestFactory()
        request = factory.post('/', data)
        request.user = user
        serializer = SessionCreateSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.save()
        self.assertIn("Only administrators can create sessions.", str(cm.exception))

class SessionTimeSlotCreateSerializerTest(APITestCase):
    def test_start_time_before_session_start(self):
        admin = User.objects.create_user(email='admin@x.com', username='admin', password='pw', user_type='admin')
        session = Session.objects.create(
            title="Test Session",
            start_date=datetime.date(2024, 1, 10),
            end_date=datetime.date(2024, 1, 20),
            created_by=admin
        )
        section = CandidateSection.objects.create(
            session=session, candidate=admin, title="Section", location="Room"
        )
        data = {
            "candidate_section": section,
            "start_time": datetime.datetime(2024, 1, 5, 10, 0),  # before session start
            "end_time": datetime.datetime(2024, 1, 11, 10, 0),
            "max_attendees": 1,
            "location": "Room",
            "description": "",
            "is_visible": True
        }
        serializer = SessionTimeSlotCreateSerializer(data=data)
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.validate(data)
        self.assertIn('start_time', str(cm.exception))

class FormFieldSerializerUpdateTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password",
            user_type="admin"
        )
        self.form = Form.objects.create(
            title="Test Form",
            description="Test",
            created_by=self.user
        )
        self.field = FormField.objects.create(
            form=self.form,
            type="select",
            label="Favorite Color",
            required=True,
            order=1
        )
        self.option1 = FormFieldOption.objects.create(field=self.field, label="Red", order=1)
        self.option2 = FormFieldOption.objects.create(field=self.field, label="Blue", order=2)

    def test_update_options(self):
        # Update option1, delete option2, add option3
        serializer = FormFieldSerializer(
            self.field,
            data={
                "type": "select",
                "label": "Favorite Color",
                "required": True,
                "order": 1,
                "options": [
                    {"id": self.option1.id, "label": "Red Updated", "order": 1},
                    {"label": "Green", "order": 3}
                ]
            },
            partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        field = serializer.save()
        # option1 should be updated
        self.assertTrue(field.options.filter(label="Red Updated").exists())
        # option2 should be deleted
        self.assertFalse(field.options.filter(label="Blue").exists())
        # option3 should be created
        self.assertTrue(field.options.filter(label="Green").exists())

class FormSerializerUpdateTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="admin2",
            email="admin2@example.com",
            password="password",
            user_type="admin"
        )
        self.form = Form.objects.create(
            title="Test Form 2",
            description="Test2",
            created_by=self.user
        )
        self.field1 = FormField.objects.create(form=self.form, type="text", label="Field1", required=True, order=1)
        self.field2 = FormField.objects.create(form=self.form, type="text", label="Field2", required=True, order=2)

    def test_delete_removed_fields(self):
        serializer = FormSerializer(
            self.form,
            data={
                "title": "Test Form 2",
                "description": "Test2",
                "form_fields": [
                    {"id": self.field1.id, "type": "text", "label": "Field1", "required": True, "order": 1}
                ]
            },
            partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        form = serializer.save()
        form.refresh_from_db()
        field1_exists = form.form_fields.filter(id=self.field1.id).exists()
        field2_exists = form.form_fields.filter(id=self.field2.id).exists()
        self.assertTrue(field1_exists)
        self.assertFalse(field2_exists)

class FormSubmissionSerializerDuplicateTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="candidate2",
            email="candidate2@example.com",
            password="password",
            user_type="candidate"
        )
        self.form = Form.objects.create(
            title="Test Form 3",
            description="Test3",
            created_by=self.user
        )
        self.field = FormField.objects.create(form=self.form, type="text", label="Name", required=True, order=1)
        self.request = APIRequestFactory().post('/')
        self.request.user = self.user

    def test_duplicate_submission(self):
        FormSubmission.objects.create(
            form=self.form,
            submitted_by=self.user,
            answers={str(self.field.id): "Test"},
            is_completed=True
        )
        serializer = FormSubmissionSerializer(
            data={
                "form": self.form.id,
                "answers": {str(self.field.id): "Test Again"},
                "is_completed": True
            },
            context={"form": self.form, "request": self.request}
        )
        self.assertTrue(serializer.is_valid())
        with self.assertRaises(serializers.ValidationError) as cm:
            serializer.save()
        self.assertIn("You have already submitted this form", str(cm.exception))

class FormSubmissionSerializerRepresentationTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="candidate3",
            email="candidate3@example.com",
            password="password",
            user_type="candidate"
        )
        self.form = Form.objects.create(
            title="Test Form 4",
            description="Test4",
            created_by=self.user
        )
        self.field = FormField.objects.create(form=self.form, type="text", label="Name", required=True, order=1)
        self.request = APIRequestFactory().post('/')
        self.request.user = self.user

    def test_to_representation_remaps_answers(self):
        # Simulate a form_version with a different field id
        form_version = {
            "fields": {
                "999": {"type": "text", "label": "Name", "required": True}
            }
        }
        submission = FormSubmission.objects.create(
            form=self.form,
            submitted_by=self.user,
            answers={"999": "Remapped Name"},
            is_completed=True,
            form_version=form_version
        )
        serializer = FormSubmissionSerializer(submission)
        data = serializer.data
        # The answers should be remapped to the current field id
        self.assertIn(str(self.field.id), data["answers"])
        self.assertEqual(data["answers"][str(self.field.id)], "Remapped Name")

class AvailabilityInvitationSerializerGettersTest(TestCase):
    def setUp(self):
        self.faculty = User.objects.create_user(
            username="faculty",
            email="faculty@example.com",
            password="password",
            user_type="faculty",
            first_name="Alice",
            last_name="Smith"
        )
        self.candidate = User.objects.create_user(
            username="candidate",
            email="candidate@example.com",
            password="password",
            user_type="candidate",
            first_name="Bob",
            last_name="Jones"
        )
        self.session = Session.objects.create(
            title="Session",
            start_date=datetime.date(2024, 1, 1),
            end_date=datetime.date(2024, 1, 2),
            created_by=self.faculty
        )
        self.section = CandidateSection.objects.create(
            session=self.session,
            candidate=self.candidate,
            title="Section 1",
            location="Room 1"
        )
        self.invitation = AvailabilityInvitation.objects.create(
            faculty=self.faculty,
            candidate_section=self.section,
            created_by=self.faculty
        )

    def test_get_methods(self):
        serializer = AvailabilityInvitationSerializer(self.invitation)
        data = serializer.data
        self.assertEqual(data["faculty_name"], "Alice Smith")
        self.assertEqual(data["candidate_name"], "Bob Jones")
        self.assertEqual(data["candidate_section_title"], "Section 1") 