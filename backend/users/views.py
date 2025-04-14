from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.views import APIView
from django.contrib.auth import login, logout, authenticate
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from allauth.socialaccount.models import SocialAccount
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.contrib.auth import get_backends
from .models import User
from .serializers import UserSerializer, RegisterSerializer, UserUpdateSerializer
import json
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from candidate_sessions.models import Form
from rest_framework.permissions import IsAuthenticated

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RegisterSerializer
        elif self.action in ['update', 'partial_update'] and self.request.user.is_admin:
            return UserUpdateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action in ['google_login', 'logout']:
            return [permissions.AllowAny()]
        elif self.action in ['me', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        elif self.action == 'update_role':
            # Custom permission for update_role that checks is_superadmin in the action itself
            return [permissions.IsAuthenticated()]
        elif self.action == 'send_form_link':
            return [permissions.IsAuthenticated()]
        # For other actions like update/delete
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_superadmin:
                return User.objects.all()
            elif user.is_admin:
                # Regular admins can only see non-superadmin users
                # and get a limited view (handled by serializer)
                return User.objects.exclude(user_type='superadmin')
            else:
                # Regular users can only see basic info
                # and get a very limited view (handled by serializer)
                return User.objects.all()
        return User.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['is_superadmin'] = self.request.user.is_superadmin if self.request.user.is_authenticated else False
        return context
    
    @action(detail=False, methods=['post'])
    def google_login(self, request):
        try:
            token = request.data.get('access_token')
            print(f"Received token: {token[:20]}...") # Print first 20 chars of token for debugging
            
            if not token:
                return Response(
                    {'error': 'Token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            print(f"Using client ID: {settings.GOOGLE_CLIENT_ID}")
            
            # Specify the CLIENT_ID of your app
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID,
                clock_skew_in_seconds=10  # Allow some clock skew
            )

            print(f"Token verification successful. User info: {json.dumps(idinfo, indent=2)}")

            # Verify the email is verified
            if not idinfo.get('email_verified', False):
                return Response(
                    {'error': 'Email not verified'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Get user info from the verified token
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            # Check if user exists
            try:
                user = User.objects.get(email=email)
                print(f"Found existing user: {user.email}")
            except User.DoesNotExist:
                # User does not exist, return 403 Forbidden
                return Response(
                    {'error': 'This email is not associated with an approved user'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Create or update social account
            social_account, created = SocialAccount.objects.update_or_create(
                provider='google',
                uid=email,
                defaults={
                    'user': user,
                    'extra_data': idinfo
                }
            )
            print(f"{'Created' if created else 'Updated'} social account for {email}")

            # Get the first authentication backend
            backend = get_backends()[0]
            
            # Set the backend attribute on the user instance
            user.backend = f"{backend.__module__}.{backend.__class__.__name__}"
            
            # Log the user in with the specified backend
            login(request, user)
            
            serializer = self.get_serializer(user)
            return Response(serializer.data)

        except ValueError as e:
            print(f"Token verification failed: {str(e)}")
            return Response(
                {'error': f'Invalid token: {str(e)}'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            print(f"Error during Google login: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        print("Create method called with data:", request.data)
        print("User making request:", request.user)
        print("Is user admin?", request.user.is_admin)
        
        # Only allow admins to create users
        if not request.user.is_admin:
            print("User is not admin, returning 403")
            return Response(
                {'error': 'Only administrators can create users'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            print("Serializer is valid, attempting to save")
            try:
                user = serializer.save()
                print("User created successfully:", user.email)
                return Response(
                    self.get_serializer(user).data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                print("Error saving user:", str(e))
                return Response(
                    {'error': f'Error creating user: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            print("Serializer validation failed:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def update_role(self, request, pk=None):
        user = self.get_object()
        
        # Only superadmins can change roles
        if not request.user.is_superadmin:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        new_role = request.data.get('user_type')
        if new_role not in [choice[0] for choice in User.USER_TYPE_CHOICES]:
            return Response({'error': 'Invalid user type'}, status=status.HTTP_400_BAD_REQUEST)
        
        # If trying to change a superadmin's role (including self)
        if user.is_superadmin:
            # Count number of superadmins
            superadmin_count = User.objects.filter(user_type='superadmin').count()
            
            # If this is the last superadmin and trying to change to non-superadmin role
            if superadmin_count == 1 and new_role != 'superadmin':
                return Response(
                    {'error': 'Cannot change role: This is the last superadmin user'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # If trying to change another superadmin's role
            if user != request.user:
                return Response(
                    {'error': 'Cannot change another superadmin\'s role'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        user.user_type = new_role
        user.save()
        
        serializer = UserSerializer(user)
        return Response(serializer.data)

    # Add a custom list method to handle pagination
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Use different serializers based on user type
        if not request.user.is_admin:
            # Use a minimal serializer if not admin
            serializer = UserSerializer(queryset, many=True, context={'request': request})
        else:
            serializer = self.get_serializer(queryset, many=True)
            
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Only superadmins can delete users
        if not request.user.is_superadmin:
            return Response(
                {'error': 'Only superadmins can delete users'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Prevent deleting superadmin users
        if user.user_type == 'superadmin':
            return Response(
                {'error': 'Cannot delete superadmin users'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Prevent self-deletion
        if user == request.user:
            return Response(
                {'error': 'Cannot delete your own account'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def send_form_link(self, request):
        if not request.user.is_admin:
            return Response({'error': 'Only administrators can send form links'}, status=403)
        
        try:
            candidate_email = request.data.get('candidate_email')
            form_id = request.data.get('form_id')
            message = request.data.get('message', '')
            
            if not candidate_email or not form_id:
                return Response({'error': 'Candidate email and form ID are required'}, status=400)
            
            # Get the form
            form = get_object_or_404(Form, id=form_id)
            
            # Create the form link with form ID as query parameter
            form_link = f"{settings.FRONTEND_URL}/login?formId={form_id}"
            
            # Prepare email content
            subject = f'Form Link: {form.title}'
            email_message = f"""
            {message}

            Please click the link below to access the form:
            {form_link}
            """
            
            # Send email
            send_mail(
                subject=subject,
                message=email_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[candidate_email],
                fail_silently=False,
            )
            
            return Response({'message': 'Form link sent successfully'})
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def complete_room_setup(self, request):
        user = request.user
        room_number = request.data.get('room_number')
        
        if not room_number:
            return Response({'error': 'Room number is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.room_number = room_number
        user.has_completed_setup = True
        user.save()
        
        serializer = self.get_serializer(user)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_form_link(request):
    if not request.user.is_admin:
        return Response({'error': 'Only administrators can send form links'}, status=403)
    
    try:
        candidate_email = request.data.get('candidate_email')
        form_id = request.data.get('form_id')
        message = request.data.get('message', '')
        
        if not candidate_email or not form_id:
            return Response({'error': 'Candidate email and form ID are required'}, status=400)
        
        # Get the form
        form = get_object_or_404(Form, id=form_id)
        
        # Create the form link with form ID as query parameter
        form_link = f"{settings.FRONTEND_URL}/login?formId={form_id}"
        
        # Prepare email content
        subject = f'Form Link: {form.title}'
        email_message = f"""
        {message}

        Please click the link below to access the form:
        {form_link}
        """
        
        # Send email
        send_mail(
            subject=subject,
            message=email_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[candidate_email],
            fail_silently=False,
        )
        
        return Response({'message': 'Form link sent successfully'})
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_room_setup(request):
    user = request.user
    room_number = request.data.get('room_number')
    
    if not room_number:
        return Response({'error': 'Room number is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    user.room_number = room_number
    user.has_completed_setup = True
    user.save()
    
    return Response({'message': 'Room setup completed successfully'})
