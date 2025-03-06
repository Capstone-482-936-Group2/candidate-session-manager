from rest_framework import serializers
from .models import Session, CandidateSection, SessionTimeSlot, SessionAttendee
from users.serializers import UserSerializer
from users.models import User

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
