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
    
    def __str__(self):
        return f"{self.title} - {self.candidate.email}"

class SessionTimeSlot(models.Model):
    candidate_section = models.ForeignKey(CandidateSection, on_delete=models.CASCADE, related_name='time_slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    max_attendees = models.PositiveIntegerField(default=1)
    location = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    
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
