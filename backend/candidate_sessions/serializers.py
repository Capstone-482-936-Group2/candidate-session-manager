from rest_framework import serializers
from .models import CandidateSession, SessionTimeSlot, SessionAttendee
from users.serializers import UserSerializer

class SessionTimeSlotSerializer(serializers.ModelSerializer):
    available_slots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = SessionTimeSlot
        fields = ['id', 'start_time', 'end_time', 'max_attendees', 'available_slots', 'is_full']

class CandidateSessionSerializer(serializers.ModelSerializer):
    time_slots = SessionTimeSlotSerializer(many=True, read_only=True)
    candidate = UserSerializer(read_only=True)
    
    class Meta:
        model = CandidateSession
        fields = ['id', 'title', 'description', 'location', 'candidate', 'time_slots', 'created_at']

class SessionAttendeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = SessionAttendee
        fields = ['id', 'user', 'registered_at']

class TimeSlotDetailSerializer(serializers.ModelSerializer):
    attendees = SessionAttendeeSerializer(many=True, read_only=True)
    available_slots = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = SessionTimeSlot
        fields = ['id', 'start_time', 'end_time', 'max_attendees', 'available_slots', 'is_full', 'attendees']

class CandidateSessionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CandidateSession
        fields = ['id', 'title', 'description', 'location', 'candidate']

class SessionTimeSlotCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionTimeSlot
        fields = ['id', 'session', 'start_time', 'end_time', 'max_attendees']
