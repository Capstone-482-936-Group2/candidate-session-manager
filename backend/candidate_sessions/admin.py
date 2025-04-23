"""
Django admin configuration for candidate session management.
Defines the admin interface for Session, CandidateSection, SessionTimeSlot, 
SessionAttendee, Location, and LocationType models.
"""
from django.contrib import admin
from .models import Session, CandidateSection, SessionTimeSlot, SessionAttendee, Location, LocationType

class SessionTimeSlotInline(admin.TabularInline):
    """
    Inline admin configuration for SessionTimeSlot model.
    Allows adding time slots directly when editing a CandidateSection.
    """
    model = SessionTimeSlot
    extra = 1

class SessionAdmin(admin.ModelAdmin):
    """
    Admin configuration for Session model.
    Displays sessions with their title, dates, creator, and creation time.
    """
    list_display = ('title', 'start_date', 'end_date', 'created_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')
    
    def get_queryset(self, request):
        """
        Override queryset method to filter sessions based on user permissions.
        Superusers see all sessions, while other admins see only relevant ones.
        """
        qs = super().get_queryset(request)
        # If superuser, show all
        if request.user.is_superuser:
            return qs
        # If admin but not superuser, show only relevant sessions
        return qs

class CandidateSectionAdmin(admin.ModelAdmin):
    """
    Admin configuration for CandidateSection model.
    Includes inline management of time slots for each section.
    """
    list_display = ('title', 'session', 'candidate', 'location', 'created_at')
    list_filter = ('session', 'created_at')
    search_fields = ('title', 'candidate__email', 'session__title')
    inlines = [SessionTimeSlotInline]

class SessionTimeSlotAdmin(admin.ModelAdmin):
    """
    Admin configuration for SessionTimeSlot model.
    Displays time slots with their section, time range, and capacity.
    """
    list_display = ('candidate_section', 'start_time', 'end_time', 'max_attendees')
    list_filter = ('candidate_section__session',)
    search_fields = ('candidate_section__title', 'candidate_section__session__title')

class SessionAttendeeAdmin(admin.ModelAdmin):
    """
    Admin configuration for SessionAttendee model.
    Tracks users registered for specific time slots.
    """
    list_display = ('user', 'time_slot', 'registered_at')
    list_filter = ('time_slot__candidate_section__session', 'registered_at')
    search_fields = ('user__email', 'time_slot__candidate_section__title')

class LocationTypeAdmin(admin.ModelAdmin):
    """
    Admin configuration for LocationType model.
    Manages categories of locations for sessions.
    """
    list_display = ('name', 'description', 'created_by', 'created_at')
    search_fields = ('name',)

class LocationAdmin(admin.ModelAdmin):
    """
    Admin configuration for Location model.
    Manages physical or virtual locations where sessions are held.
    """
    list_display = ('name', 'location_type', 'address', 'created_by', 'created_at')
    list_filter = ('location_type',)
    search_fields = ('name', 'address')

# Register models with their custom admin configurations
admin.site.register(Session, SessionAdmin)
admin.site.register(CandidateSection, CandidateSectionAdmin)
admin.site.register(SessionTimeSlot, SessionTimeSlotAdmin)
admin.site.register(SessionAttendee, SessionAttendeeAdmin)
admin.site.register(LocationType, LocationTypeAdmin)
admin.site.register(Location, LocationAdmin)
