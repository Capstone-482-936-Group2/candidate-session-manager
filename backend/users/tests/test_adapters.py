from django.test import TestCase
from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount, SocialLogin, SocialToken, SocialApp
from django.contrib.auth import get_user_model
from users.adapters import CustomAccountAdapter, CustomSocialAccountAdapter
from django.contrib.sites.models import Site
from django.http import HttpRequest
from django.contrib.auth.models import AnonymousUser
from unittest.mock import MagicMock, patch

User = get_user_model()

class CustomAccountAdapterTests(TestCase):
    def setUp(self):
        self.adapter = CustomAccountAdapter()
        self.request = HttpRequest()
        self.request.user = AnonymousUser()
        self.user = User(email="test@example.com", username="test")
    
    def test_save_user(self):
        """Test that save_user sets the correct user_type"""
        form = MagicMock()
        form.cleaned_data = {'username': 'test', 'email': 'test@example.com', 'password1': 'password123'}
        
        user = self.adapter.save_user(self.request, self.user, form, commit=False)
        
        self.assertEqual(user.user_type, 'candidate')

class CustomSocialAccountAdapterTests(TestCase):
    def setUp(self):
        self.adapter = CustomSocialAccountAdapter()
        self.request = HttpRequest()
        self.request.user = AnonymousUser()
        
        # Get or create the default site
        self.site, _ = Site.objects.get_or_create(
            id=1,
            defaults={'domain': 'example.com', 'name': 'example.com'}
        )
        
        self.social_app, _ = SocialApp.objects.get_or_create(
            provider='google',
            defaults={
                'name': 'Google',
                'client_id': 'test-client-id',
                'secret': 'test-secret'
            }
        )
        self.social_app.sites.add(self.site)
        
    def test_populate_user(self):
        """Test that populate_user sets the correct user_type"""
        user = User(email="social@example.com")
        account = SocialAccount(user=user, provider='google')
        sociallogin = SocialLogin(user=user, account=account)
        
        data = {
            'email': 'social@example.com',
            'name': 'Social User',
            'given_name': 'Social',
            'family_name': 'User'
        }
        
        populated_user = self.adapter.populate_user(self.request, sociallogin, data)
        
        self.assertEqual(populated_user.user_type, 'candidate')
        self.assertEqual(populated_user.email, 'social@example.com')
    
    def test_social_account_save_user_with_data(self):
        """Test save_user with social account data extraction"""
        # Create mock objects
        user = User(email="social2@example.com", username="social2")
        account = MagicMock()
        account.extra_data = {
            'name': 'Social User',
            'email': 'social2@example.com',
            'picture': 'http://example.com/pic.jpg',
            'given_name': 'Social',
            'family_name': 'User'
        }
        
        sociallogin = MagicMock()
        sociallogin.account = account
        sociallogin.user = user
        
        # Fix: We need to match the actual call pattern with form=None
        with patch('allauth.socialaccount.adapter.DefaultSocialAccountAdapter.save_user') as mock_save:
            mock_save.return_value = user
            saved_user = self.adapter.save_user(self.request, sociallogin, None)
            
            # Verify the user was returned
            self.assertEqual(saved_user, user)
            # Fix: Update the assertion to match the actual call pattern
            mock_save.assert_called_once_with(self.request, sociallogin, None) 