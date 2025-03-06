from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Session, CandidateSection, SessionTimeSlot, SessionAttendee
from .serializers import (
    CandidateSectionSerializer, 
    SessionSerializer,
    SessionDetailSerializer,
    SessionTimeSlotSerializer,
    SessionAttendeeSerializer,
    TimeSlotDetailSerializer,
    CandidateSectionCreateSerializer,
    SessionCreateSerializer,
    SessionTimeSlotCreateSerializer
)
from rest_framework import serializers

# Create your views here.

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_admin

class IsFacultyOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.user_type == 'faculty'

class IsAdminOrCandidateOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Allow admin users full access
        if request.user.is_admin:
            return True
        # Allow candidates to manage their own sections
        return obj.candidate == request.user

class IsAdminOrFacultyOrSectionOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.user_type in ['admin', 'superadmin', 'faculty']:
            return True
        # For POST requests, check if the user owns the section
        if request.method == 'POST':
            candidate_section_id = request.data.get('candidate_section')
            try:
                section = CandidateSection.objects.get(id=candidate_section_id)
                return section.candidate == user
            except CandidateSection.DoesNotExist:
                return False
        return obj.candidate_section.candidate == user

class SessionViewSet(viewsets.ModelViewSet):
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Session.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SessionDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return SessionCreateSerializer
        return SessionSerializer
    
    def perform_create(self, serializer):
        if self.request.user.user_type not in ['admin', 'superadmin']:
            raise serializers.ValidationError("Only administrators can create sessions.")
        serializer.save(created_by=self.request.user)

class CandidateSectionViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateSectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        session_id = self.request.query_params.get('session')
        queryset = CandidateSection.objects.all()
        
        # Filter by session if provided
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Filter by user type
        if user.user_type not in ['faculty', 'admin', 'superadmin']:
            queryset = queryset.filter(candidate=user)
            
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CandidateSectionCreateSerializer
        return CandidateSectionSerializer
    
    def perform_create(self, serializer):
        if self.request.user.user_type not in ['admin', 'superadmin']:
            raise serializers.ValidationError("Only administrators can create candidate sections.")
        serializer.save()

class SessionTimeSlotViewSet(viewsets.ModelViewSet):
    serializer_class = SessionTimeSlotSerializer
    permission_classes = [IsAdminOrFacultyOrSectionOwner]
    
    def get_queryset(self):
        return SessionTimeSlot.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TimeSlotDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return SessionTimeSlotCreateSerializer
        return SessionTimeSlotSerializer
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        time_slot = self.get_object()
        user = request.user
        
        # Check if the user is a candidate (candidates shouldn't register)
        if user.user_type == 'candidate':
            return Response({'error': 'Candidates cannot register for sessions'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        # Check if the time slot is available
        if time_slot.is_full:
            return Response({'error': 'Time slot is full'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is already registered for this time slot
        if SessionAttendee.objects.filter(time_slot=time_slot, user=user).exists():
            return Response({'error': 'Already registered for this time slot'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Register user for the time slot
        attendee = SessionAttendee.objects.create(time_slot=time_slot, user=user)
        serializer = SessionAttendeeSerializer(attendee)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def unregister(self, request, pk=None):
        time_slot = self.get_object()
        user = request.user
        
        # Check if user is registered for this time slot
        attendee = get_object_or_404(SessionAttendee, time_slot=time_slot, user=user)
        attendee.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class SessionAttendeeViewSet(viewsets.ModelViewSet):
    queryset = SessionAttendee.objects.all()
    serializer_class = SessionAttendeeSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrReadOnly()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return SessionAttendee.objects.all()
        return SessionAttendee.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def my_registrations(self, request):
        attendees = SessionAttendee.objects.filter(user=request.user)
        serializer = self.get_serializer(attendees, many=True)
        return Response(serializer.data)
