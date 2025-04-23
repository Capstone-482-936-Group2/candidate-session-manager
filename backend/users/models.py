"""
User models for the candidate session management system.
Defines custom user types and profile information for candidates, faculty, and administrators.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings
from django.core.files.storage import default_storage
import os
import time
from django.utils import timezone

# Create your models here.

class UserManager(BaseUserManager):
    """
    Custom user manager for the User model.
    Extends Django's BaseUserManager to handle email-based authentication and user types.
    """
    def create_user(self, email, username, password=None, **extra_fields):
        """
        Create and save a regular user.
        Requires email and username, with password being optional.
        
        Args:
            email: User's email address (required)
            username: User's username (required)
            password: User's password (optional)
            **extra_fields: Additional fields to set on the user
            
        Returns:
            The created user object
            
        Raises:
            ValueError: If email is not provided
        """
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        """
        Create and save a superuser.
        Sets appropriate permission flags and user type.
        
        Args:
            email: User's email address
            username: User's username
            password: User's password
            **extra_fields: Additional fields to set on the user
            
        Returns:
            The created superuser object
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'superadmin')
        
        return self.create_user(email, username, password, **extra_fields)

class User(AbstractUser):
    """
    Custom user model that extends Django's AbstractUser.
    Supports different user types (candidate, faculty, admin, superadmin).
    Uses email for authentication instead of username.
    """
    USER_TYPE_CHOICES = (
        ('candidate', 'Candidate'),
        ('faculty', 'Faculty'),
        ('admin', 'Admin'),
        ('superadmin', 'Super Admin'),
    )
    
    email = models.EmailField(unique=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='candidate')
    room_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="Room Number/Office Location")
    has_completed_setup = models.BooleanField(default=False)
    available_for_meetings = models.BooleanField(default=True, help_text="Whether this staff member can be requested for meetings by candidates")
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        """Return a string representation of the user."""
        return self.email
        
    @property
    def is_admin(self):
        """
        Check if user has admin privileges.
        Returns True if user type is admin or superadmin.
        """
        return self.user_type in ['admin', 'superadmin']
        
    @property
    def is_superadmin(self):
        """
        Check if user has superadmin privileges.
        Returns True if user type is superadmin.
        """
        return self.user_type == 'superadmin'
    
    @property
    def needs_room_setup(self):
        """
        Check if user needs to complete room setup.
        Returns True for faculty, admin, and superadmin users who haven't completed setup.
        """
        return not self.has_completed_setup and self.user_type in ['faculty', 'admin', 'superadmin']

def headshot_path(instance, filename):
    """
    Determine the file path for candidate headshots.
    Creates a unique filename based on user ID and timestamp.
    
    Args:
        instance: The CandidateProfile instance
        filename: Original filename
        
    Returns:
        String path where the file should be stored
    """
    # Get the file extension
    ext = filename.split('.')[-1]
    # Generate a timestamp
    timestamp = timezone.now().strftime('%Y%m%d_%H%M%S')
    # Create the new filename
    new_filename = f'candidate_headshots/user_{instance.user.id}_{timestamp}.{ext}'
    return new_filename

class CandidateProfile(models.Model):
    """
    Extended profile information for candidate users.
    Stores professional information, travel details, presentation info, and preferences.
    """
    TRAVEL_ASSISTANCE_CHOICES = (
        ('all', 'Yes, I will need help with ALL travel arrangements'),
        ('some', 'Yes, I will need help with SOME of my travel arrangements'),
        ('none', 'No, I will book ALL travel arrangements and will submit for reimbursement'),
    )
    
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('prefer_not_to_say', 'Prefer not to say'),
        ('other', 'Other'),
    )

    PERMISSION_CHOICES = (
        ('yes', 'Yes'),
        ('no', 'No')
    )

    TOUR_CHOICES = (
        ('Campus Tour', 'Campus Tour'),
        ('Community Tour w/Realtor', 'Community Tour w/Realtor'),
        ('Not at this time', 'Not at this time')
    )

    # User relationship
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='candidate_profile'
    )
    
    # Professional Information
    current_title = models.CharField(max_length=200)
    current_department = models.CharField(max_length=200)
    current_institution = models.CharField(max_length=200)
    research_interests = models.TextField()
    
    # Contact Information
    cell_number = models.CharField(max_length=20)
    
    # Travel Information
    travel_assistance = models.CharField(
        max_length=10,
        choices=TRAVEL_ASSISTANCE_CHOICES
    )
    passport_name = models.CharField(max_length=200)
    date_of_birth = models.DateField()
    country_of_residence = models.CharField(max_length=200)
    gender = models.CharField(
        max_length=50,
        choices=GENDER_CHOICES
    )
    gender_custom = models.CharField(max_length=50, blank=True, null=True)
    preferred_airport = models.CharField(max_length=200)
    frequent_flyer_info = models.TextField(blank=True)
    known_traveler_number = models.CharField(max_length=100, blank=True)
    
    # Presentation Information
    talk_title = models.CharField(max_length=300)
    abstract = models.TextField()
    biography = models.TextField()
    headshot = models.ImageField(
        upload_to=headshot_path,
        null=True,
        blank=True
    )
    
    # Permissions and Preferences (changed from boolean to CharField)
    videotape_permission = models.CharField(
        max_length=3,
        choices=PERMISSION_CHOICES,
        default='no'
    )
    advertisement_permission = models.CharField(
        max_length=3,
        choices=PERMISSION_CHOICES,
        default='no'
    )
    extra_tours = models.CharField(
        max_length=50,
        choices=TOUR_CHOICES,
        default='Not at this time'
    )
    
    # Food Preferences
    food_preferences = models.JSONField(default=list)
    dietary_restrictions = models.JSONField(default=list)
    
    # Additional Preferences
    preferred_faculty = models.JSONField(default=list)
    
    # Add preferred visit dates field
    preferred_visit_dates = models.JSONField(default=list, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    has_completed_setup = models.BooleanField(default=False)

    def __str__(self):
        """Return a string representation of the candidate profile."""
        return f"Profile for {self.user.email}"

    class Meta:
        """Meta configuration for CandidateProfile model."""
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        """
        Override save method to handle headshot file management.
        Deletes old headshot when a new one is uploaded.
        """
        if self.pk:  # If this is an update
            try:
                # Get the old instance from the database
                old_instance = CandidateProfile.objects.get(pk=self.pk)
                # If there's a new headshot and an old one exists
                if self.headshot and old_instance.headshot and self.headshot != old_instance.headshot:
                    # Delete the old headshot file
                    old_instance.headshot.delete(save=False)
            except CandidateProfile.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Override delete method to handle headshot file cleanup.
        Ensures headshot files are deleted when profile is deleted.
        """
        # Delete the headshot file when the profile is deleted
        if self.headshot:
            self.headshot.delete(save=False)
        super().delete(*args, **kwargs)
