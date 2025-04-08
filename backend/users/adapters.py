from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from .models import User

class CustomAccountAdapter(DefaultAccountAdapter):
    def save_user(self, request, user, form, commit=True):
        user = super().save_user(request, user, form, commit=False)
        # Add any custom user fields here
        user.user_type = 'candidate'  # Set default user type
        if commit:
            user.save()
        return user

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def populate_user(self, request, sociallogin, data):
        user = super().populate_user(request, sociallogin, data)
        # Set default fields for new users
        user.user_type = 'candidate'
        return user
    
    def save_user(self, request, sociallogin, form=None):
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
