from django.db import models
from users.models import User
from django.conf import settings

class Session(models.Model):
    """
    Represents a recruiting season (e.g., "Fall 2023 Recruitment")
    """
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class CandidateSection(models.Model):
    """
    Represents a candidate's section within a recruiting session
    """
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='candidate_sections')
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sections'
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    needs_transportation = models.BooleanField(default=False)
    arrival_date = models.DateField(null=True, blank=True)
    leaving_date = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.title} - {self.candidate.email}"

class SessionTimeSlot(models.Model):
    candidate_section = models.ForeignKey(CandidateSection, on_delete=models.CASCADE, related_name='time_slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    max_attendees = models.PositiveIntegerField(default=1)
    location = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    is_visible = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.candidate_section.title} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def available_slots(self):
        return self.max_attendees - self.attendees.count()
    
    @property
    def is_full(self):
        return self.available_slots <= 0

class SessionAttendee(models.Model):
    time_slot = models.ForeignKey(SessionTimeSlot, on_delete=models.CASCADE, related_name='attendees')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attending_slots')
    registered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('time_slot', 'user')
    
    def __str__(self):
        return f"{self.user.username} - {self.time_slot}"

class LocationType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_location_types')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class Location(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    location_type = models.ForeignKey(LocationType, on_delete=models.CASCADE, related_name='locations')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_locations')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class TimeSlotTemplate(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    start_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=60)
    max_attendees = models.PositiveIntegerField(default=1)
    
    # Location fields
    use_location_type = models.BooleanField(default=False)
    custom_location = models.CharField(max_length=200, blank=True)
    location = models.ForeignKey('Location', on_delete=models.SET_NULL, null=True, blank=True, related_name='templates')
    location_type = models.ForeignKey('LocationType', on_delete=models.SET_NULL, null=True, blank=True, related_name='templates')
    
    notes = models.TextField(blank=True)
    is_visible = models.BooleanField(default=True)
    has_end_time = models.BooleanField(default=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
