"""
Django admin configuration for the users app.
Defines the admin interface for User and CandidateProfile models with customized display and permissions.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, CandidateProfile

class CustomUserAdmin(UserAdmin):
    """
    Custom admin interface for User model.
    Extends Django's UserAdmin with application-specific fields and behavior.
    Controls how users are displayed, filtered, and edited in the admin interface.
    """
    list_display = ('email', 'username', 'first_name', 'last_name', 'user_type', 'is_active', 'date_joined')
    list_filter = ('user_type', 'is_active', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Role'), {'fields': ('user_type',)}),
        (_('Faculty Settings'), {'fields': ('room_number', 'available_for_meetings'), 'classes': ('collapse',)}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'user_type', 'is_active', 'is_staff'),
        }),
    )
    
    def get_queryset(self, request):
        """
        Override queryset method to implement permission-based filtering.
        Superusers can see all users, while regular admins cannot see superusers.
        
        Args:
            request: The HTTP request
            
        Returns:
            Filtered queryset based on user permissions
        """
        qs = super().get_queryset(request)
        # If the user is a superuser, show all users
        if request.user.is_superuser:
            return qs
        # Otherwise, for regular admins, filter out superusers
        return qs.exclude(is_superuser=True)
    
    def get_readonly_fields(self, request, obj=None):
        """
        Determine which fields should be read-only based on user permissions.
        Non-superusers cannot modify superuser status or permissions.
        
        Args:
            request: The HTTP request
            obj: The user object being edited
            
        Returns:
            List of field names that should be read-only
        """
        # If not superuser, certain fields should be read-only
        if not request.user.is_superuser:
            return ('is_superuser', 'user_permissions') 
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        """
        Custom save method to handle user creation and modification.
        Sets username to email for new users if username is not provided.
        
        Args:
            request: The HTTP request
            obj: The user object being saved
            form: The form used to edit the user
            change: Boolean indicating if this is an edit (True) or create (False)
        """
        # If creating a new user, set username to email if not provided
        if not change and not obj.username:
            obj.username = obj.email
        super().save_model(request, obj, form, change)

# Register models with the admin site
admin.site.register(User, CustomUserAdmin)
admin.site.register(CandidateProfile)
