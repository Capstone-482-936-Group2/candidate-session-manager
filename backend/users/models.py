from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager

# Create your models here.

class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('user_type', 'superadmin')
        
        return self.create_user(email, username, password, **extra_fields)

class User(AbstractUser):
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
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email
        
    @property
    def is_admin(self):
        return self.user_type in ['admin', 'superadmin']
        
    @property
    def is_superadmin(self):
        return self.user_type == 'superadmin'
    
    @property
    def needs_room_setup(self):
        return not self.has_completed_setup and self.user_type in ['faculty', 'admin', 'superadmin']
