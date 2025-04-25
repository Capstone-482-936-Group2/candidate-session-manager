"""
Serializers for the candidate session management system.
Converts model instances to JSON for API responses and validates incoming data for API requests.
Each serializer corresponds to a model in the system and handles its representation and validation.
"""
from rest_framework import serializers
from .models import Session, CandidateSection, SessionTimeSlot, SessionAttendee, TimeSlotTemplate, LocationType, Location, Form, FormSubmission, FormField, FormFieldOption, FacultyAvailability, AvailabilityTimeSlot, AvailabilityInvitation
from users.serializers import UserSerializer
from users.models import User
from datetime import datetime

class SessionAttendeeSerializer(serializers.ModelSerializer):
    """
    Serializer for the SessionAttendee model.
    Includes user details and when they registered for a session.
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = SessionAttendee
        fields = ['id', 'user', 'registered_at']

class SessionTimeSlotSerializer(serializers.ModelSerializer):
    """
    Serializer for the SessionTimeSlot model.
    Includes computed fields for slot availability and attendees.
    """
    available_slots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    attendees = SessionAttendeeSerializer(many=True, read_only=True)
    
    class Meta:
        model = SessionTimeSlot
        fields = ['id', 'start_time', 'end_time', 'max_attendees', 'location', 'description', 'available_slots', 'is_full', 'attendees', 'is_visible']

class CandidateSectionSerializer(serializers.ModelSerializer):
    """
    Serializer for the CandidateSection model.
    Includes candidate details and associated time slots.
    """
    candidate = UserSerializer(read_only=True)
    time_slots = SessionTimeSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = CandidateSection
        fields = [
            'id', 'title', 'description', 'location', 
            'candidate', 'time_slots', 'created_at', 
            'needs_transportation', 'session', 'arrival_date', 
            'leaving_date', 'imported_availability_ids'
        ]
        read_only_fields = ['created_at']

class SessionSerializer(serializers.ModelSerializer):
    """
    Basic serializer for the Session model.
    Used for list views and simpler representations.
    """
    class Meta:
        model = Session
        fields = [
            'id', 'title', 'description', 'start_date',
            'end_date', 'created_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'created_by']

class SessionDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for the Session model.
    Includes candidate sections and creator details.
    """
    candidate_sections = CandidateSectionSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Session
        fields = [
            'id', 'title', 'description', 'start_date',
            'end_date', 'created_at', 'created_by', 'candidate_sections'
        ]

class TimeSlotDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for the SessionTimeSlot model.
    Used for specific time slot views with attendee information.
    """
    attendees = SessionAttendeeSerializer(many=True, read_only=True)
    available_slots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = SessionTimeSlot
        fields = ['id', 'start_time', 'end_time', 'max_attendees', 'location', 'description', 'available_slots', 'is_full', 'attendees']

class CandidateSectionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating CandidateSection instances.
    Includes validation to ensure only admins can create sections.
    """
    class Meta:
        model = CandidateSection
        fields = ['id', 'title', 'description', 'location', 'needs_transportation', 'candidate', 'session', 'arrival_date', 'leaving_date']
        extra_kwargs = {
            'title': {'required': True},
            'location': {'required': True},
            'description': {'required': False},
            'needs_transportation': {'required': False, 'default': False},
            'candidate': {'required': True},
            'session': {'required': True},
            'arrival_date': {'required': False},
            'leaving_date': {'required': False}
        }

    def create(self, validated_data):
        """
        Custom create method to ensure only admins can create candidate sections.
        Validates user permissions before creating.
        """
        request = self.context.get('request')
        if not request or request.user.user_type not in ['admin', 'superadmin']:
            raise serializers.ValidationError("Only administrators can create candidate sections.")
            
        return super().create(validated_data)

class SessionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating Session instances.
    Includes validation and automatically sets the creator.
    """
    class Meta:
        model = Session
        fields = ['id', 'title', 'description', 'start_date', 'end_date']
        extra_kwargs = {
            'title': {'required': True},
            'description': {'required': False},
            'start_date': {'required': True},
            'end_date': {'required': True}
        }
        
    def create(self, validated_data):
        """
        Custom create method to ensure only admins can create sessions.
        Sets the creator to the requesting user.
        """
        request = self.context.get('request')
        if not request or request.user.user_type not in ['admin', 'superadmin']:
            raise serializers.ValidationError("Only administrators can create sessions.")
            
        validated_data['created_by'] = request.user
        return super().create(validated_data)

class SessionTimeSlotCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating SessionTimeSlot instances.
    """
    class Meta:
        model = SessionTimeSlot
        fields = ['id', 'candidate_section', 'start_time', 'end_time', 'max_attendees', 'location', 'description', 'is_visible']
    def validate(self, data):
        """
        Validate that the end time is after the start time.
        """
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        
        return data

class LocationTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for the LocationType model.
    Automatically sets the creator to the requesting user.
    """
    class Meta:
        model = LocationType
        fields = ['id', 'name', 'description', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']
        
    def create(self, validated_data):
        """
        Custom create method that sets the creator from the request context.
        """
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class LocationSerializer(serializers.ModelSerializer):
    """
    Serializer for the Location model.
    Includes location type name and automatically sets the creator.
    """
    location_type_name = serializers.CharField(source='location_type.name', read_only=True)
    
    class Meta:
        model = Location
        fields = ['id', 'name', 'description', 'location_type', 'location_type_name', 'address', 'notes', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at', 'location_type_name']
        
    def create(self, validated_data):
        """
        Custom create method that sets the creator from the request context.
        """
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class TimeSlotTemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for the TimeSlotTemplate model.
    Includes location and location type names, and sets the creator.
    """
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_type_name = serializers.CharField(source='location_type.name', read_only=True)
    
    class Meta:
        model = TimeSlotTemplate
        fields = ['id', 'name', 'description', 'start_time', 'duration_minutes', 'max_attendees', 
                 'use_location_type', 'custom_location', 'location', 'location_name', 
                 'location_type', 'location_type_name', 'notes', 'is_visible', 
                 'has_end_time', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at', 'location_name', 'location_type_name']
        
    def create(self, validated_data):
        """
        Custom create method that sets the creator from the request context.
        """
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
        fields = ['id', 'candidate_section', 'start_time', 'end_time', 'max_attendees', 'location', 'description']

class FormFieldOptionSerializer(serializers.ModelSerializer):
    """
    Serializer for the FormFieldOption model.
    Represents options for select, radio, and checkbox form fields.
    """
    class Meta:
        model = FormFieldOption
        fields = ['id', 'label', 'order']
        read_only_fields = ['id', 'created_at']

class FormFieldSerializer(serializers.ModelSerializer):
    """
    Serializer for the FormField model.
    Includes nested options and validates field-specific requirements.
    """
    options = FormFieldOptionSerializer(many=True, required=False)
    
    class Meta:
        model = FormField
        fields = ['id', 'type', 'label', 'required', 'help_text', 'order', 'options']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """
        Validates that field types have appropriate options.
        Select, radio, and checkbox fields require options, while date_range should not have options.
        """
        field_type = data.get('type')
        if field_type in ['select', 'radio', 'checkbox']:
            options = data.get('options', [])
            if not options:
                raise serializers.ValidationError({
                    'options': f'Options are required for {field_type} type fields'
                })
        elif field_type == 'date_range':
            # Ensure no options are provided for date_range
            if data.get('options', []):
                raise serializers.ValidationError({
                    'options': 'Options are not allowed for date range fields'
                })
        return data

    def create(self, validated_data):
        """
        Custom create method for form fields that handles nested options.
        Creates the field and its options in a single transaction.
        """
        options_data = validated_data.pop('options', [])
        field = FormField.objects.create(**validated_data)
        
        # Only create options for fields that support them
        if field.type in ['select', 'radio', 'checkbox']:
            for option_data in options_data:
                FormFieldOption.objects.create(field=field, **option_data)
        
        return field

    def update(self, instance, validated_data):
        """
        Custom update method for form fields that handles nested options.
        Updates the field and manages its options in a single transaction.
        """
        options_data = validated_data.pop('options', [])
        
        # Update field attributes
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Only update options for fields that support them
        if instance.type in ['select', 'radio', 'checkbox']:
            # Preserve existing options and update/create as needed
            existing_options = {opt.id: opt for opt in instance.options.all()}
            updated_option_ids = set()
            
            for option_data in options_data:
                option_id = option_data.get('id')
                if option_id and option_id in existing_options:
                    # Update existing option
                    option = existing_options[option_id]
                    for attr, value in option_data.items():
                        setattr(option, attr, value)
                    option.save()
                    updated_option_ids.add(option_id)
                else:
                    # Create new option
                    FormFieldOption.objects.create(field=instance, **option_data)
            
            # Delete options that were not updated
            for option_id, option in existing_options.items():
                if option_id not in updated_option_ids:
                    option.delete()
        
        return instance

class FormSubmissionFormSerializer(serializers.ModelSerializer):
    """
    Simple serializer for Form model when referenced in form submissions.
    """
    class Meta:
        model = Form
        fields = ['id', 'title', 'description']

class FormSerializer(serializers.ModelSerializer):
    """
    Serializer for the Form model.
    Includes nested fields and handles user assignments.
    """
    form_fields = FormFieldSerializer(many=True, required=False)
    assigned_to_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)
    assigned_to = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Form
        fields = ['id', 'title', 'description', 'form_fields', 'assigned_to', 'assigned_to_ids', 'is_active']
    
    def create(self, validated_data):
        """
        Custom create method that handles nested form fields and user assignments.
        Creates the form, its fields, and options in a single transaction.
        """
        form_fields_data = validated_data.pop('form_fields', [])
        assigned_to_ids = validated_data.pop('assigned_to_ids', None)
        
        form = Form.objects.create(**validated_data)
        
        # Create form fields
        for field_data in form_fields_data:
            options_data = field_data.pop('options', [])
            field = FormField.objects.create(form=form, **field_data)
            
            # Create options for select/radio/checkbox fields
            for option_data in options_data:
                FormFieldOption.objects.create(field=field, **option_data)
        
        # Assign users if provided
        if assigned_to_ids is not None:
            form.assigned_to.set(assigned_to_ids)
        
        return form

    def update(self, instance, validated_data):
        """
        Custom update method that handles nested form fields and user assignments.
        Updates the form, its fields, and options in a single transaction.
        """
        form_fields_data = validated_data.pop('form_fields', [])
        assigned_to_ids = validated_data.pop('assigned_to_ids', None)
        
        # Update form fields
        existing_fields = {field.id: field for field in instance.form_fields.all()}
        updated_field_ids = set()
        
        for field_data in form_fields_data:
            field_id = field_data.get('id')
            options_data = field_data.pop('options', [])
            
            if field_id and field_id in existing_fields:
                # Update existing field
                field = existing_fields[field_id]
                field_serializer = FormFieldSerializer(field, data=field_data, partial=True)
                if field_serializer.is_valid():
                    field_serializer.save()
                updated_field_ids.add(field_id)
            else:
                # Create new field
                field = FormField.objects.create(form=instance, **field_data)
                updated_field_ids.add(field.id)
                
                # Create options for new field
                for option_data in options_data:
                    FormFieldOption.objects.create(field=field, **option_data)
        
        # Delete fields that were not updated
        for field_id, field in existing_fields.items():
            if field_id not in updated_field_ids:
                field.delete()
        
        # Update assigned users if provided
        if assigned_to_ids is not None:
            instance.assigned_to.set(assigned_to_ids)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class FormSubmissionSerializer(serializers.ModelSerializer):
    """
    Serializer for the FormSubmission model.
    Handles form submissions with answer validation and uniqueness checks.
    """
    submitted_by = UserSerializer(read_only=True)
    
    class Meta:
        model = FormSubmission
        fields = ['id', 'form', 'submitted_by', 'answers', 'is_completed', 'submitted_at', 'form_version']
        read_only_fields = ['submitted_by', 'submitted_at', 'form_version']

    def validate_answers(self, value):
        """
        Validates form answers against form field requirements.
        Ensures required fields are filled and validates specific field types.
        """
        form = self.context.get('form')
        if not form:
            raise serializers.ValidationError("Form is required for validation")

        # Get all fields from the form
        fields = form.form_fields.all()
        
        # Check if all required fields are filled
        for field in fields:
            if field.required:
                field_value = value.get(str(field.id))
                if not field_value:
                    raise serializers.ValidationError(f"{field.label} is required")
                
                # Validate date range fields
                if field.type == 'date_range':
                    if not isinstance(field_value, dict):
                        raise serializers.ValidationError(f"{field.label} must be a date range")
                    
                    start_date = field_value.get('startDate')
                    end_date = field_value.get('endDate')
                    
                    if not start_date or not end_date:
                        raise serializers.ValidationError(f"{field.label} must have both start and end dates")
                    
                    # Convert to datetime for comparison
                    start = datetime.strptime(start_date, '%Y-%m-%d')
                    end = datetime.strptime(end_date, '%Y-%m-%d')
                    
                    if start > end:
                        raise serializers.ValidationError(f"{field.label} start date must be before end date")

        return value

    def create(self, validated_data):
        """
        Custom create method that sets the submitter and validates uniqueness.
        Ensures a user can only submit one completed form.
        """
        form = self.context.get('form')
        if not form:
            raise serializers.ValidationError("Form is required")

        # Check if user has already submitted this form
        if FormSubmission.objects.filter(
            form=form,
            submitted_by=self.context['request'].user,
            is_completed=True
        ).exists():
            raise serializers.ValidationError("You have already submitted this form")

        validated_data['submitted_by'] = self.context['request'].user
        return super().create(validated_data)

    def to_representation(self, instance):
        """
        Custom representation method that handles field ID mapping.
        Maps stored answers to current field IDs for compatibility with form changes.
        """
        data = super().to_representation(instance)
        
        # If viewing a submission, use the stored form version to map answers
        if instance.form_version:
            # Create a mapping of current field IDs to original field IDs
            field_mapping = {}
            for field in instance.form.form_fields.all():
                # Find the original field that matches this one
                for orig_id, orig_data in instance.form_version['fields'].items():
                    if orig_data['label'] == field.label and orig_data['type'] == field.type:
                        field_mapping[str(field.id)] = orig_id
                        break
            
            # Remap answers to use current field IDs
            remapped_answers = {}
            for current_id, orig_id in field_mapping.items():
                if orig_id in instance.answers:
                    remapped_answers[current_id] = instance.answers[orig_id]
            
            data['answers'] = remapped_answers
        
        return data

class AvailabilityTimeSlotSerializer(serializers.ModelSerializer):
    """
    Serializer for the AvailabilityTimeSlot model.
    Represents time slots when faculty are available.
    """
    class Meta:
        model = AvailabilityTimeSlot
        fields = ['id', 'start_time', 'end_time']

class FacultyAvailabilitySerializer(serializers.ModelSerializer):
    """
    Serializer for the FacultyAvailability model.
    Includes time slots and faculty information.
    """
    time_slots = AvailabilityTimeSlotSerializer(many=True, read_only=True)
    faculty_name = serializers.SerializerMethodField()
    faculty_email = serializers.SerializerMethodField()
    faculty_room = serializers.SerializerMethodField()
    
    class Meta:
        model = FacultyAvailability
        fields = ['id', 'faculty', 'candidate_section', 'submitted_at', 'updated_at', 'notes', 
                  'time_slots', 'faculty_name', 'faculty_email', 'faculty_room']
        read_only_fields = ['id', 'submitted_at', 'updated_at']
    
    def get_faculty_name(self, obj):
        """
        Method to get the faculty member's full name.
        """
        return f"{obj.faculty.first_name} {obj.faculty.last_name}"
    
    def get_faculty_email(self, obj):
        """
        Method to get the faculty member's email.
        """
        return obj.faculty.email
    
    def get_faculty_room(self, obj):
        """
        Method to get the faculty member's room number.
        """
        return obj.faculty.room_number

class FacultyAvailabilityCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating FacultyAvailability instances.
    Handles nested time slots for faculty availability.
    """
    time_slots = AvailabilityTimeSlotSerializer(many=True)
    
    class Meta:
        model = FacultyAvailability
        fields = ['candidate_section', 'notes', 'time_slots']
    
    def create(self, validated_data):
        """
        Custom create method that handles nested time slots.
        Creates the availability record and its time slots in a single transaction.
        """
        time_slots_data = validated_data.pop('time_slots')
        availability = FacultyAvailability.objects.create(**validated_data)
        
        for time_slot_data in time_slots_data:
            AvailabilityTimeSlot.objects.create(availability=availability, **time_slot_data)
        
        return availability

class AvailabilityInvitationSerializer(serializers.ModelSerializer):
    """
    Serializer for the AvailabilityInvitation model.
    Includes faculty and candidate details for availability requests.
    """
    faculty_name = serializers.SerializerMethodField()
    candidate_name = serializers.SerializerMethodField()
    candidate_section_title = serializers.SerializerMethodField()
    
    class Meta:
        model = AvailabilityInvitation
        fields = ['id', 'faculty', 'candidate_section', 'created_at', 'email_sent', 
                  'faculty_name', 'candidate_name', 'candidate_section_title']
    
    def get_faculty_name(self, obj):
        """
        Method to get the faculty member's full name.
        """
        return f"{obj.faculty.first_name} {obj.faculty.last_name}"
    
    def get_candidate_name(self, obj):
        """
        Method to get the candidate's full name.
        """
        return f"{obj.candidate_section.candidate.first_name} {obj.candidate_section.candidate.last_name}"
    
    def get_candidate_section_title(self, obj):
        """
        Method to get the candidate section's title.
        """
        return obj.candidate_section.title
