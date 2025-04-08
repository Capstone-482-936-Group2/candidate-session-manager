from rest_framework import serializers
from .models import Session, CandidateSection, SessionTimeSlot, SessionAttendee, Form, FormSubmission, FormField, FormFieldOption
from users.serializers import UserSerializer
from users.models import User
from datetime import datetime

class SessionAttendeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = SessionAttendee
        fields = ['id', 'user', 'registered_at']

class SessionTimeSlotSerializer(serializers.ModelSerializer):
    available_slots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    attendees = SessionAttendeeSerializer(many=True, read_only=True)
    
    class Meta:
        model = SessionTimeSlot
        fields = ['id', 'start_time', 'end_time', 'max_attendees', 'location', 'description', 'available_slots', 'is_full', 'attendees']

class CandidateSectionSerializer(serializers.ModelSerializer):
    candidate = UserSerializer(read_only=True)
    time_slots = SessionTimeSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = CandidateSection
        fields = [
            'id', 'title', 'description', 'location', 
            'candidate', 'time_slots', 'created_at', 
            'needs_transportation', 'session', 'arrival_date', 'leaving_date'
        ]
        read_only_fields = ['created_at']

class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = [
            'id', 'title', 'description', 'start_date',
            'end_date', 'created_at', 'created_by'
        ]
        read_only_fields = ['created_at', 'created_by']

class SessionDetailSerializer(serializers.ModelSerializer):
    candidate_sections = CandidateSectionSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Session
        fields = [
            'id', 'title', 'description', 'start_date',
            'end_date', 'created_at', 'created_by', 'candidate_sections'
        ]

class TimeSlotDetailSerializer(serializers.ModelSerializer):
    attendees = SessionAttendeeSerializer(many=True, read_only=True)
    available_slots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = SessionTimeSlot
        fields = ['id', 'start_time', 'end_time', 'max_attendees', 'location', 'description', 'available_slots', 'is_full', 'attendees']

class CandidateSectionCreateSerializer(serializers.ModelSerializer):
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
        request = self.context.get('request')
        if not request or request.user.user_type not in ['admin', 'superadmin']:
            raise serializers.ValidationError("Only administrators can create candidate sections.")
            
        return super().create(validated_data)

class SessionCreateSerializer(serializers.ModelSerializer):
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
        request = self.context.get('request')
        if not request or request.user.user_type not in ['admin', 'superadmin']:
            raise serializers.ValidationError("Only administrators can create sessions.")
            
        validated_data['created_by'] = request.user
        return super().create(validated_data)

class SessionTimeSlotCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionTimeSlot
        fields = ['id', 'candidate_section', 'start_time', 'end_time', 'max_attendees', 'location', 'description']

class FormFieldOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormFieldOption
        fields = ['id', 'label', 'order']
        read_only_fields = ['id', 'created_at']

class FormFieldSerializer(serializers.ModelSerializer):
    options = FormFieldOptionSerializer(many=True, required=False)
    
    class Meta:
        model = FormField
        fields = ['id', 'type', 'label', 'required', 'help_text', 'order', 'options']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
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
        options_data = validated_data.pop('options', [])
        field = FormField.objects.create(**validated_data)
        
        # Only create options for fields that support them
        if field.type in ['select', 'radio', 'checkbox']:
            for option_data in options_data:
                FormFieldOption.objects.create(field=field, **option_data)
        
        return field

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', [])
        
        # Update field attributes
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Only update options for fields that support them
        if instance.type in ['select', 'radio', 'checkbox']:
            instance.options.all().delete()
            for option_data in options_data:
                FormFieldOption.objects.create(field=instance, **option_data)
        
        return instance

class FormSubmissionFormSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ['id', 'title', 'description']

class FormSerializer(serializers.ModelSerializer):
    form_fields = FormFieldSerializer(many=True)
    assigned_to_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    assigned_to = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Form
        fields = ['id', 'title', 'description', 'created_by', 'created_at', 'form_fields', 'assigned_to', 'assigned_to_ids', 'is_active']
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        form_fields_data = validated_data.pop('form_fields', [])
        assigned_to_ids = validated_data.pop('assigned_to_ids', [])
        
        # Create the form with an empty fields list
        form = Form.objects.create(**validated_data)
        
        # Add assigned users
        if assigned_to_ids:
            form.assigned_to.set(assigned_to_ids)
        
        # Create form fields
        for field_data in form_fields_data:
            options_data = field_data.pop('options', [])
            field = FormField.objects.create(form=form, **field_data)
            
            # Create options for select/radio/checkbox fields
            for option_data in options_data:
                FormFieldOption.objects.create(field=field, **option_data)
        
        return form

    def update(self, instance, validated_data):
        form_fields_data = validated_data.pop('form_fields', [])
        assigned_to_ids = validated_data.pop('assigned_to_ids', None)
        
        # Update form fields
        instance.form_fields.all().delete()
        for field_data in form_fields_data:
            options_data = field_data.pop('options', [])
            field = FormField.objects.create(form=instance, **field_data)
            
            # Create options for select/radio/checkbox fields
            for option_data in options_data:
                FormFieldOption.objects.create(field=field, **option_data)
        
        # Update assigned users if provided
        if assigned_to_ids is not None:
            instance.assigned_to.set(assigned_to_ids)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class FormSubmissionSerializer(serializers.ModelSerializer):
    submitted_by = UserSerializer(read_only=True)
    
    class Meta:
        model = FormSubmission
        fields = ['id', 'form', 'submitted_by', 'answers', 'is_completed', 'submitted_at']
        read_only_fields = ['submitted_by', 'submitted_at']

    def validate_answers(self, value):
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
