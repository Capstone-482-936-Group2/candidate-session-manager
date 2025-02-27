from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'user_type', 'is_active')
    list_filter = ('user_type', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('user_type', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
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

admin.site.register(User, CustomUserAdmin)
