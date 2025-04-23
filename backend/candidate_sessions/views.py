"""
Views for the candidate session management system.
Provides API endpoints for managing sessions, candidates, time slots, and related functionality.
"""
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from django.shortcuts import get_object_or_404
from .models import Session, CandidateSection, SessionTimeSlot, SessionAttendee, TimeSlotTemplate, LocationType, Location, Form, FormSubmission, FacultyAvailability, AvailabilityInvitation
from .serializers import (
    CandidateSectionSerializer, 
    SessionSerializer,
    SessionDetailSerializer,
    SessionTimeSlotSerializer,
    SessionAttendeeSerializer,
    TimeSlotDetailSerializer,
    CandidateSectionCreateSerializer,
    SessionCreateSerializer,
    SessionTimeSlotCreateSerializer,
    TimeSlotTemplateSerializer,
    LocationTypeSerializer,
    LocationSerializer,
    FormSerializer,
    FormSubmissionSerializer,
    FacultyAvailabilitySerializer,
    FacultyAvailabilityCreateSerializer,
    AvailabilityInvitationSerializer
)
from rest_framework import serializers
import logging
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
User = get_user_model()

logger = logging.getLogger(__name__)

# Create your views here.

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission that allows read-only access to authenticated users,
    but restricts write operations to admin users only.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.is_admin

class IsFacultyOrReadOnly(permissions.BasePermission):
    """
    Custom permission that allows read-only access to authenticated users,
    but restricts write operations to faculty users only.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.user_type == 'faculty'

class IsAdminOrCandidateOwner(permissions.BasePermission):
    """
    Custom permission that allows access to admin users or the candidate who owns the resource.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Allow admin users full access
        if request.user.is_admin:
            return True
        # Allow candidates to manage their own sections
        return obj.candidate == request.user

class IsAdminOrFacultyOrSectionOwner(permissions.BasePermission):
    """
    Custom permission that allows read access to authenticated users,
    but restricts write operations to admins, faculty, or section owners.
    """
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

class IsAdminOrFaculty(permissions.BasePermission):
    """
    Custom permission to only allow admins or faculty members to access.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or 
            request.user.is_staff or 
            getattr(request.user, 'user_type', '') in ['admin', 'faculty', 'superadmin']
        )

class SessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing session resources.
    Provides CRUD operations for recruitment sessions.
    """
    serializer_class = SessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return all sessions."""
        return Session.objects.all()
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        Uses detailed serializer for retrieval and create/update serializer for modifications.
        """
        if self.action == 'retrieve':
            return SessionDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return SessionCreateSerializer
        return SessionSerializer
    
    def perform_create(self, serializer):
        """
        Create a new session.
        Ensures only admin users can create sessions and sets the creator.
        """
        if self.request.user.user_type not in ['admin', 'superadmin']:
            raise serializers.ValidationError("Only administrators can create sessions.")
        serializer.save(created_by=self.request.user)

class CandidateSectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing candidate section resources.
    Provides CRUD operations for sections within sessions that candidates participate in.
    """
    serializer_class = CandidateSectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return filtered candidate sections based on user role and query parameters.
        Admins and faculty can see all sections, others only see their own.
        """
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
        """
        Return appropriate serializer based on action.
        Uses create serializer for modifications.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return CandidateSectionCreateSerializer
        return CandidateSectionSerializer
    
    def perform_create(self, serializer):
        """
        Create a new candidate section.
        Ensures only admin users can create sections.
        """
        if self.request.user.user_type not in ['admin', 'superadmin']:
            raise serializers.ValidationError("Only administrators can create candidate sections.")
        serializer.save()

class SessionTimeSlotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing session time slot resources.
    Provides CRUD operations for time slots within candidate sections.
    """
    serializer_class = SessionTimeSlotSerializer
    permission_classes = [IsAdminOrFacultyOrSectionOwner]
    
    def get_queryset(self):
        """Return all time slots."""
        return SessionTimeSlot.objects.all()
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        Uses detailed serializer for retrieval and create serializer for modifications.
        """
        if self.action == 'retrieve':
            return TimeSlotDetailSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return SessionTimeSlotCreateSerializer
        return SessionTimeSlotSerializer
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        """
        Register the current user for a specific time slot.
        Checks for availability and prevents duplicate registrations.
        """
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
        """
        Unregister the current user from a specific time slot.
        Removes the attendee record if found.
        """
        time_slot = self.get_object()
        user = request.user
        
        # Check if user is registered for this time slot
        attendee = get_object_or_404(SessionAttendee, time_slot=time_slot, user=user)
        attendee.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class SessionAttendeeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing session attendee resources.
    Provides CRUD operations for users registered to attend time slots.
    """
    queryset = SessionAttendee.objects.all()
    serializer_class = SessionAttendeeSerializer
    
    def get_permissions(self):
        """
        Return appropriate permissions based on action.
        List and retrieve are available to authenticated users, others only to admins.
        """
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrReadOnly()]
    
    def get_queryset(self):
        """
        Return filtered attendees based on user role.
        Admins can see all attendees, others only see their own registrations.
        """
        user = self.request.user
        if user.is_admin:
            return SessionAttendee.objects.all()
        return SessionAttendee.objects.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def my_registrations(self, request):
        """
        List all time slots the current user is registered for.
        Returns attendee records for the current user.
        """
        attendees = SessionAttendee.objects.filter(user=request.user)
        serializer = self.get_serializer(attendees, many=True)
        return Response(serializer.data)

class TimeSlotTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing time slot template resources.
    Provides CRUD operations for templates used to create time slots.
    """
    serializer_class = TimeSlotTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrFacultyOrSectionOwner]
    
    def get_queryset(self):
        """
        Return filtered templates based on user role.
        Admins can see all templates, others only see their own.
        """
        # Only return templates created by the current user or that are public
        user = self.request.user
        if user.is_admin:
            return TimeSlotTemplate.objects.all()
        return TimeSlotTemplate.objects.filter(created_by=user)

class LocationTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing location type resources.
    Provides CRUD operations for types of locations.
    """
    serializer_class = LocationTypeSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrFaculty]
    
    def get_queryset(self):
        """Return all location types."""
        return LocationType.objects.all()
    
    def perform_create(self, serializer):
        """
        Create a new location type.
        Sets the creator to the current user.
        """
        serializer.save(created_by=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        List all location types.
        Handles errors with logging.
        """
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in LocationTypeViewSet.list: {str(e)}")
            raise

    def create(self, request, *args, **kwargs):
        """
        Create a new location type.
        Handles errors with logging.
        """
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in LocationTypeViewSet.create: {str(e)}")
            raise

class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing location resources.
    Provides CRUD operations for physical or virtual locations.
    """
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrFaculty]
    
    def get_queryset(self):
        """
        Return filtered locations based on query parameters.
        Can filter by location type.
        """
        location_type = self.request.query_params.get('location_type', None)
        queryset = Location.objects.all()
        
        if location_type:
            queryset = queryset.filter(location_type=location_type)
            
        return queryset
    
    def perform_create(self, serializer):
        """
        Create a new location.
        Sets the creator to the current user.
        """
        serializer.save(created_by=self.request.user)

class FormViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing form resources.
    Provides CRUD operations for forms that can be assigned to users.
    """
    serializer_class = FormSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return filtered forms based on user role.
        Staff can see all forms, others only see forms assigned to them.
        """
        user = self.request.user
        if user.is_staff:
            return Form.objects.all()
        # Only return forms that are assigned to the user
        return Form.objects.filter(assigned_to=user, is_active=True)

    def perform_create(self, serializer):
        """
        Create a new form.
        Sets the creator to the current user.
        """
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        """Update an existing form."""
        serializer.save()

class FormSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing form submission resources.
    Provides CRUD operations for submitted forms from users.
    """
    serializer_class = FormSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return filtered form submissions based on user role and query parameters.
        Staff can see all submissions, others only see their own.
        """
        user = self.request.user
        form_id = self.request.query_params.get('form')
        
        # If user is admin, return all submissions
        if user.is_staff:
            queryset = FormSubmission.objects.all()
        else:
            # For regular users, only return their own submissions
            queryset = FormSubmission.objects.filter(submitted_by=user)
        
        # If form_id is provided, filter by form
        if form_id:
            queryset = queryset.filter(form_id=form_id)
        
        return queryset
    
    def get_serializer_context(self):
        """
        Return context for serializer.
        Includes the form object for validation.
        """
        context = super().get_serializer_context()
        form_id = self.request.data.get('form')
        if form_id:
            try:
                form = Form.objects.get(id=form_id)
                context['form'] = form
            except Form.DoesNotExist:
                pass
        return context
    
    def perform_create(self, serializer):
        """
        Create a new form submission.
        Validates that the user is assigned to the form and hasn't already submitted.
        """
        # Check if user has already submitted this form and it's still active
        form_id = self.request.data.get('form')
        form = Form.objects.get(id=form_id)
        
        # Check if user is assigned to this form
        if not form.assigned_to.filter(id=self.request.user.id).exists():
            raise serializers.ValidationError("You are not assigned to this form")
            
        # Check if user has already submitted this form
        if FormSubmission.objects.filter(
            form_id=form_id, 
            submitted_by=self.request.user,
            is_completed=True
        ).exists():
            raise serializers.ValidationError("You have already submitted this form")
        
        serializer.save(submitted_by=self.request.user)

class FacultyAvailabilityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing faculty availability resources.
    Provides CRUD operations for faculty member's availability for sessions.
    """
    queryset = FacultyAvailability.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action.
        Uses create serializer for creating new availability.
        """
        if self.action == 'create':
            return FacultyAvailabilityCreateSerializer
        return FacultyAvailabilitySerializer
    
    def get_queryset(self):
        """
        Return filtered faculty availability based on user role and query parameters.
        Faculty can only see their own availability.
        """
        user = self.request.user
        candidate_section_id = self.request.query_params.get('candidate_section')
        
        queryset = FacultyAvailability.objects.all()
        
        if user.user_type == 'faculty':
            # Faculty can only see their own submissions
            queryset = queryset.filter(faculty=user)
        
        if candidate_section_id:
            queryset = queryset.filter(candidate_section_id=candidate_section_id)
            
        return queryset
    
    def perform_create(self, serializer):
        """
        Create a new faculty availability.
        Sets the faculty to the current user.
        """
        serializer.save(faculty=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """
        Create a new faculty availability.
        Handles errors with a detailed response.
        """
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def import_slots(self, request, pk=None):
        """
        Import faculty availability as session time slots.
        Creates time slots for the candidate section based on faculty availability.
        """
        user = request.user
        if not user.is_admin:
            return Response({"error": "Only admins can import faculty availability"}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            availability = self.get_object()
            faculty = availability.faculty
            candidate_section = availability.candidate_section
            
            # Initialize imported_availability_ids if it doesn't exist
            if candidate_section.imported_availability_ids is None:
                candidate_section.imported_availability_ids = []
            
            # Add this availability ID if not already there
            if int(pk) not in candidate_section.imported_availability_ids:
                candidate_section.imported_availability_ids.append(int(pk))
                candidate_section.save(update_fields=['imported_availability_ids'])
            
            created_slots = []
            
            for time_slot in availability.time_slots.all():
                # Create a time slot for the candidate section
                new_time_slot = SessionTimeSlot.objects.create(
                    candidate_section=candidate_section,
                    start_time=time_slot.start_time,
                    end_time=time_slot.end_time,
                    max_attendees=1,
                    location=faculty.room_number or '',
                    description=f"Meeting with {faculty.first_name} {faculty.last_name}",
                    is_visible=True
                )
                
                # Automatically register the faculty member for this time slot
                SessionAttendee.objects.create(
                    time_slot=new_time_slot,
                    user=faculty
                )
                
                created_slots.append(new_time_slot.id)
            
            return Response({
                "message": f"Successfully imported {len(created_slots)} time slots from faculty availability",
                "created_time_slots": created_slots,
                "imported_availability_ids": candidate_section.imported_availability_ids
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class AvailabilityInvitationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing availability invitation resources.
    Provides CRUD operations for invitations sent to faculty for availability submissions.
    """
    queryset = AvailabilityInvitation.objects.all()
    serializer_class = AvailabilityInvitationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return filtered invitations based on user role.
        Admins can see all invitations, faculty only see their own.
        """
        user = self.request.user
        
        if user.is_admin:
            return AvailabilityInvitation.objects.all()
        
        # Regular faculty can only see invitations for themselves
        return AvailabilityInvitation.objects.filter(faculty=user)
    
    def perform_create(self, serializer):
        """
        Create a new availability invitation.
        Sets the creator to the current user.
        """
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def invite_faculty(self, request):
        """
        Invite multiple faculty members to submit availability for multiple candidates.
        Creates invitation records and sends emails if requested.
        """
        if not request.user.is_admin:
            return Response({"error": "Only admins can send invitations"}, 
                           status=status.HTTP_403_FORBIDDEN)
            
        faculty_ids = request.data.get('faculty_ids', [])
        candidate_section_ids = request.data.get('candidate_section_ids', [])
        send_email = request.data.get('send_email', False)
        
        if not faculty_ids or not candidate_section_ids:
            return Response({"error": "Both faculty_ids and candidate_section_ids are required"}, 
                           status=status.HTTP_400_BAD_REQUEST)
            
        try:
            faculty_users = User.objects.filter(id__in=faculty_ids, 
                                              user_type__in=['faculty', 'admin', 'superadmin'])
            candidate_sections = CandidateSection.objects.filter(id__in=candidate_section_ids)
            
            invitations_created = 0
            
            for faculty in faculty_users:
                for section in candidate_sections:
                    # Create invitation if it doesn't exist
                    invitation, created = AvailabilityInvitation.objects.get_or_create(
                        faculty=faculty,
                        candidate_section=section,
                        defaults={'created_by': request.user}
                    )
                    
                    if created:
                        invitations_created += 1
                    
                    if send_email and (created or not invitation.email_sent):
                        # Send email to faculty member
                        self._send_invitation_email(invitation)
                        invitation.email_sent = True
                        invitation.save()
            
            return Response({
                "message": f"Created {invitations_created} new invitations",
                "faculty_count": faculty_users.count(),
                "candidate_count": candidate_sections.count(),
                "total_invitations": faculty_users.count() * candidate_sections.count()
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def _send_invitation_email(self, invitation):
        """
        Send an email to faculty member with a link to submit availability.
        Creates and sends an email with the relevant information.
        """
        faculty = invitation.faculty
        candidate = invitation.candidate_section.candidate
        
        subject = f"Request to Submit Availability for {candidate.first_name} {candidate.last_name}"
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = faculty.email
        
        # Create a message with the link to the availability form
        frontend_url = settings.FRONTEND_URL.rstrip('/')
        message = f"""
Hello {faculty.first_name},

You have been invited to submit your availability for meeting with candidate {candidate.first_name} {candidate.last_name}.

Please go to the Forms page on the Candidate Session Manager and fill out the Faculty Availability Form:
{frontend_url}/forms

Candidate Visit Dates: {invitation.candidate_section.arrival_date} to {invitation.candidate_section.leaving_date}

Thank you!
        """
        
        try:
            send_mail(
                subject,
                message,
                from_email,
                [to_email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Error sending invitation email: {str(e)}")
