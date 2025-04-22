from django.db import models
from users.models import User
from django.conf import settings
from django.core.exceptions import ValidationError

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
    imported_availability_ids = models.JSONField(default=list, blank=True, null=True, 
                                                help_text="IDs of faculty availability submissions that have been imported")
    
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

class Form(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_forms')
    created_at = models.DateTimeField(auto_now_add=True)
    assigned_to = models.ManyToManyField(User, related_name='assigned_forms', blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class FormSubmission(models.Model):
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='submissions')
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='form_submissions')
    submitted_at = models.DateTimeField(auto_now_add=True)
    answers = models.JSONField()  # Stores the user's answers
    is_completed = models.BooleanField(default=False)
    form_version = models.JSONField(default=dict)  # Store form field metadata at submission time

    def clean(self):
        # Only enforce uniqueness for completed submissions
        if self.is_completed:
            existing = FormSubmission.objects.filter(
                form=self.form,
                submitted_by=self.submitted_by,
                is_completed=True
            ).exclude(pk=self.pk)
            if existing.exists():
                raise ValidationError("You have already submitted this form")

    def save(self, *args, **kwargs):
        # Store form field metadata when saving
        if not self.form_version:
            self.form_version = {
                'fields': {
                    str(field.id): {
                        'type': field.type,
                        'label': field.label,
                        'required': field.required
                    }
                    for field in self.form.form_fields.all()
                }
            }
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.submitted_by.email} - {self.form.title}"

class FormField(models.Model):
    FIELD_TYPES = [
        ('text', 'Text'),
        ('textarea', 'Text Area'),
        ('select', 'Select'),
        ('radio', 'Radio'),
        ('checkbox', 'Checkbox'),
        ('date', 'Date'),
        ('date_range', 'Date Range'),
    ]

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='form_fields')
    type = models.CharField(max_length=20, choices=FIELD_TYPES)
    label = models.CharField(max_length=200)
    required = models.BooleanField(default=False)
    help_text = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.label} ({self.type})"

class FormFieldOption(models.Model):
    field = models.ForeignKey(FormField, on_delete=models.CASCADE, related_name='options')
    label = models.CharField(max_length=200)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"{self.field.label} - {self.label}"

class FacultyAvailability(models.Model):
    """
    Represents a faculty member's availability for meeting with candidates
    """
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availability_submissions')
    candidate_section = models.ForeignKey(CandidateSection, on_delete=models.CASCADE, related_name='faculty_availability')
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.faculty.email} - {self.candidate_section.title}"

class AvailabilityTimeSlot(models.Model):
    """
    Represents a time slot when a faculty member is available
    """
    availability = models.ForeignKey(FacultyAvailability, on_delete=models.CASCADE, related_name='time_slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    def __str__(self):
        return f"{self.availability.faculty.email} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"

class AvailabilityInvitation(models.Model):
    """
    Tracks which faculty members are invited to submit availability for which candidates
    """
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availability_invitations')
    candidate_section = models.ForeignKey(CandidateSection, on_delete=models.CASCADE, related_name='faculty_invitations')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_invitations')
    created_at = models.DateTimeField(auto_now_add=True)
    email_sent = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('faculty', 'candidate_section')
    
    def __str__(self):
        return f"{self.faculty.email} - {self.candidate_section.title}"
