from django.db import models
from users.models import User
from django.conf import settings

class CandidateSession(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200)
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sessions'
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    needs_transportation = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.title} - {self.candidate.email}"

class SessionTimeSlot(models.Model):
    session = models.ForeignKey(CandidateSession, on_delete=models.CASCADE, related_name='time_slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    max_attendees = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return f"{self.session.title} - {self.start_time.strftime('%Y-%m-%d %H:%M')}"
    
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
