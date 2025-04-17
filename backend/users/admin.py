from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, CandidateProfile

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'user_type', 'is_active', 'date_joined')
    list_filter = ('user_type', 'is_active', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Role'), {'fields': ('user_type',)}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'user_type', 'is_active', 'is_staff'),
        }),
    )
    
    # Define which fields basic admins can view/edit
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If the user is a superuser, show all users
        if request.user.is_superuser:
            return qs
        # Otherwise, for regular admins, filter out superusers
        return qs.exclude(is_superuser=True)
    
    def get_readonly_fields(self, request, obj=None):
        # If not superuser, certain fields should be read-only
        if not request.user.is_superuser:
            return ('is_superuser', 'user_permissions') 
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        # If creating a new user, set username to email if not provided
        if not change and not obj.username:
            obj.username = obj.email
        super().save_model(request, obj, form, change)

admin.site.register(User, CustomUserAdmin)
admin.site.register(CandidateProfile)
