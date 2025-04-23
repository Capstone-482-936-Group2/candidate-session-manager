"""
Custom adapters for Django AllAuth authentication.
Extends default adapters to customize user creation and social account integration.
"""
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from .models import User

class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Custom adapter for standard account registration.
    Extends the default adapter to set custom user fields during account creation.
    """
    def save_user(self, request, user, form, commit=True):
        """
        Override the save_user method to customize user creation.
        Sets default user type and handles any custom fields.
        
        Args:
            request: The HTTP request
            user: The user instance to save
            form: The registration form
            commit: Whether to commit the user to the database
            
        Returns:
            The saved user instance
        """
        user = super().save_user(request, user, form, commit=False)
        # Add any custom user fields here
        user.user_type = 'candidate'  # Set default user type
        if commit:
            user.save()
        return user

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Custom adapter for social account registration.
    Extends the default adapter to set custom user fields during social login.
    """
    def populate_user(self, request, sociallogin, data):
        """
        Populate user instance with data from social account.
        Sets default fields for users registering via social login.
        
        Args:
            request: The HTTP request
            sociallogin: The social login instance
            data: User data from the social provider
            
        Returns:
            The populated user instance
        """
        user = super().populate_user(request, sociallogin, data)
        # Set default fields for new users
        user.user_type = 'candidate'
        return user
    
    def save_user(self, request, sociallogin, form=None):
        """
        Save a user who has registered via social login.
        Handles extraction of additional profile information from social providers.
        
        Args:
            request: The HTTP request
            sociallogin: The social login instance
            form: Optional form data
            
        Returns:
            The saved user instance
        """
        user = super().save_user(request, sociallogin, form)
        # Access social account data
        social_data = sociallogin.account.extra_data
        
        # Get or create existing user profile information
        # You might want to update additional fields here
        
        # Example: For Google accounts, you could access:
        # - name = social_data.get('name')
        # - email = social_data.get('email')
        # - picture = social_data.get('picture')
        # - given_name = social_data.get('given_name')
        # - family_name = social_data.get('family_name')
        
        return user
