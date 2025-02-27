from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            # Try to find a user matching the email
            user = User.objects.get(email=email)
            print(f"Backend: Found user {user.email}")
            
            # Check the password with debugging
            password_valid = user.check_password(password)
            print(f"Backend: Password check result: {password_valid}")
            
            if password_valid:
                return user
            return None
        except User.DoesNotExist:
            print("Backend: No user found with this email")
            return None
