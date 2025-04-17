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
from .models import User, CandidateProfile
from .serializers import UserSerializer, RegisterSerializer, UserUpdateSerializer, CandidateProfileSerializer
import json
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from candidate_sessions.models import Form
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import boto3
import logging
import time
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
import os
from django.utils import timezone
from dateutil.parser import parse
from datetime import datetime
from django.utils.dateparse import parse_date
from django.http import FileResponse, HttpResponseNotFound
import urllib.parse
import tempfile


logger = logging.getLogger(__name__)

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
        elif self.action in ['me', 'list', 'retrieve', 'complete_candidate_setup']:
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
        context['include_profile'] = self.request.query_params.get('include_profile', False)
        return context
    
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    
    @action(detail=False, methods=['post'])
    def google_login(self, request):
        try:
            # Check if request.data is a QueryDict, dict, or something else
            print(f"Request data type: {type(request.data)}")
            print(f"Request data contents: {request.data}")
            
            # Handle different types of request.data
            if hasattr(request.data, 'get'):
                token = request.data.get('credential')
                print(f"Got token using get(): {token}")
            elif isinstance(request.data, dict):
                token = request.data.get('credential')
                print(f"Got token from dict: {token}")
            else:
                # Fallback if request.data is neither a dict nor has get method
                print("request.data has no get method and is not a dict")
                try:
                    # Try to access as a string directly
                    if 'credential' in request.data:
                        token = request.data['credential']
                        print(f"Got token via direct access: {token}")
                    else:
                        # Last resort - try to parse the entire body as the token
                        token = request.data
                        print(f"Using entire request.data as token: {token}")
                except Exception as e:
                    print(f"Error accessing token: {str(e)}")
                    token = None
            
            if not token:
                return Response(
                    {'error': 'Token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Print debug information
            print(f"Content-Type: {request.content_type}")
            print(f"Using client ID: {settings.GOOGLE_CLIENT_ID}")
            print(f"Token type: {type(token)}")
            print(f"Token first 20 chars: {token[:20] if isinstance(token, str) else 'Not a string'}")
            
            # Verify the token - we're being extra careful with the parsing
            try:
                idinfo = id_token.verify_oauth2_token(
                    token,
                    requests.Request(),
                    settings.GOOGLE_CLIENT_ID,
                    clock_skew_in_seconds=10
                )
                print("Token successfully verified!")
            except Exception as e:
                print(f"Token verification error: {str(e)}")
                print(f"Token value causing error: {token}")
                return Response(
                    {'error': f'Token verification failed: {str(e)}'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Get user info from the verified token
            email = idinfo['email']
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')

            # Get or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'user_type': 'candidate',
                    'has_completed_setup': False
                }
            )

            # Create or update social account
            social_account, _ = SocialAccount.objects.update_or_create(
                provider='google',
                uid=email,
                defaults={
                    'user': user,
                    'extra_data': idinfo
                }
            )

            # Log the user in
            backend = get_backends()[0]
            user.backend = f"{backend.__module__}.{backend.__class__.__name__}"
            login(request, user)
            
            # Return user data
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
    def complete_candidate_setup(self, request):
        try:
            user = request.user
            logger.info(f"Starting candidate setup completion for user {user.email}")
            
            # Get or create candidate profile
            profile, created = CandidateProfile.objects.get_or_create(
                user=user
            )

            # Handle date_of_birth first
            date_of_birth = request.data.get('date_of_birth')
            if date_of_birth:
                try:
                    # Try parsing as date string first
                    parsed_date = parse_date(date_of_birth)
                    if not parsed_date:
                        # If parse_date returns None, try datetime parsing and convert to date
                        parsed_date = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
                    profile.date_of_birth = parsed_date
                except (ValueError, TypeError) as e:
                    return Response(
                        {'error': f'Invalid date format for date_of_birth. Please use YYYY-MM-DD format: {str(e)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Update other fields
            fields_to_update = [
                'current_title', 'current_department', 'current_institution',
                'research_interests', 'cell_number', 'travel_assistance',
                'passport_name', 'country_of_residence', 'gender',
                'gender_custom', 'preferred_airport', 'frequent_flyer_info',
                'known_traveler_number', 'talk_title', 'abstract', 'biography',
                'videotape_permission', 'advertisement_permission', 'extra_tours',
                'preferred_visit_dates'
            ]

            for field in fields_to_update:
                if field in request.data:
                    setattr(profile, field, request.data[field])

            # Handle arrays
            profile.food_preferences = request.data.get('food_preferences', [])
            profile.dietary_restrictions = request.data.get('dietary_restrictions', [])
            profile.preferred_faculty = request.data.get('preferred_faculty', [])

            try:
                profile.save()
                logger.info(f"Successfully saved profile for user {user.email}")
                
                # Check if we have a local headshot and need to move it to S3
                if profile.headshot and os.path.exists(profile.headshot.path):
                    logger.info(f"Transferring headshot to S3 for user {user.email}")
                    
                    try:
                        # Get local file path
                        local_path = profile.headshot.path
                        filename = os.path.basename(local_path)
                        
                        # Configure S3 client
                        s3_client = boto3.client(
                            's3',
                            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                            region_name=settings.AWS_S3_REGION_NAME
                        )
                        
                        # Upload to S3
                        s3_path = f'candidate_headshots/{filename}'
                        with open(local_path, 'rb') as file_data:
                            s3_client.upload_fileobj(
                                file_data, 
                                settings.AWS_STORAGE_BUCKET_NAME, 
                                s3_path
                            )
                        
                        # Update the URL in the database
                        s3_url = f"https://{settings.AWS_STORAGE_BUCKET_NAME}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{s3_path}"
                        logger.info(f"File uploaded to S3: {s3_url}")
                        
                        # Remove the local file
                        os.remove(local_path)
                        logger.info(f"Removed local file: {local_path}")
                        
                    except Exception as s3_error:
                        logger.error(f"Error transferring file to S3: {str(s3_error)}")
                        # Continue with setup completion even if S3 transfer fails
                
                # Mark setup as completed
                user.has_completed_setup = True
                user.save()
                
                # Log the response data
                response_data = {
                    'message': 'Candidate setup completed successfully',
                    'profile': CandidateProfileSerializer(profile).data
                }
                logger.info(f"Sending response: {response_data}")
                
                return Response(response_data)

            except Exception as e:
                logger.error(f"Error saving profile: {str(e)}")
                return Response(
                    {'error': f'Error saving profile: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Error in complete_candidate_setup: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

    @action(detail=False, methods=['post'])
    def test_s3(self, request):
        try:
            # Test direct boto3 connection
            s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME
            )
            
            # Log connection success
            logger.info("Successfully connected to S3")
            
            # Create a test file
            test_content = b"This is a test file"
            test_path = "test/test_file.txt"
            
            # Try to upload using Django's storage
            path = default_storage.save(test_path, ContentFile(test_content))
            
            # Get the URL of the uploaded file
            url = default_storage.url(path)
            
            # Try to read the file back to verify
            file_content = default_storage.open(path).read()
            
            # Clean up - delete the test file
            default_storage.delete(path)
            
            return Response({
                'message': 'S3 configuration is working correctly',
                'test_file_url': url,
                'connection_test': 'Successful',
                'upload_test': 'Successful',
                'read_test': 'Successful',
                'delete_test': 'Successful'
            })
            
        except Exception as e:
            logger.error(f"S3 test failed: {str(e)}")
            return Response({
                'error': f'S3 configuration test failed: {str(e)}',
                'details': {
                    'bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'region': settings.AWS_S3_REGION_NAME,
                    'access_key_present': bool(settings.AWS_ACCESS_KEY_ID),
                    'secret_key_present': bool(settings.AWS_SECRET_ACCESS_KEY)
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser])
    def upload_headshot(self, request):
        try:
            logger.info("Starting headshot upload")
            
            if 'headshot' not in request.FILES:
                return Response(
                    {'error': 'No headshot file provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            headshot = request.FILES['headshot']
            
            # Validate file type and size
            if not headshot.content_type.startswith('image/'):
                return Response(
                    {'error': 'File must be an image'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if headshot.size > 5 * 1024 * 1024:
                return Response(
                    {'error': 'File size must be less than 5MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get or create profile with minimal required data
            profile, created = CandidateProfile.objects.get_or_create(
                user=request.user,
                defaults={
                    'current_title': 'Pending Setup',
                    'current_department': 'Pending Setup',
                    'current_institution': 'Pending Setup',
                    'research_interests': 'Pending Setup',
                    'cell_number': 'Pending',
                    'travel_assistance': 'none',
                    'passport_name': 'Pending Setup',
                    'date_of_birth': timezone.now().date(),
                    'country_of_residence': 'Pending Setup',
                    'gender': 'prefer_not_to_say',
                    'preferred_airport': 'Pending Setup',
                    'talk_title': 'Pending Setup',
                    'abstract': 'Pending Setup',
                    'biography': 'Pending Setup'
                }
            )

            # Update headshot
            if profile.headshot:
                profile.headshot.delete(save=False)
            
            profile.headshot = headshot
            profile.save()

            return Response({
                'url': profile.headshot.url,
                'message': 'Headshot uploaded successfully'
            })

        except Exception as e:
            logger.error(f"Error in upload_headshot: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def download_headshot(self, request):
        """
        Download a candidate's headshot from S3
        """
        url = request.query_params.get('url')
        if not url:
            return Response({'error': 'No URL provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Parse the URL to extract the key
            if 'amazonaws.com' in url:
                # Extract the S3 key from the URL
                path_parts = url.split('.com/')
                if len(path_parts) < 2:
                    return Response({'error': 'Invalid S3 URL format'}, status=status.HTTP_400_BAD_REQUEST)
                
                s3_key = path_parts[1]
                filename = s3_key.split('/')[-1]
                
                # Configure S3 client
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME
                )
                
                # Create a temporary file with a secure, platform-appropriate path
                with tempfile.NamedTemporaryFile(delete=False, suffix=f'_{filename}') as temp_file:
                    temp_path = temp_file.name
                    
                # Download to the temporary file
                s3_client.download_file(
                    settings.AWS_STORAGE_BUCKET_NAME,
                    s3_key,
                    temp_path
                )
                
                # Return file response
                response = FileResponse(
                    open(temp_path, 'rb'),
                    as_attachment=True,
                    filename=filename
                )
                
                # Clean up will happen when the response is closed
                def cleanup_temp_file():
                    if os.path.exists(temp_path):
                        try:
                            os.unlink(temp_path)
                        except:
                            pass
                
                response.close = cleanup_temp_file
                
                return response
            else:
                # If it's not an S3 URL, try to find it locally
                filename = url.split('/')[-1]
                file_path = os.path.join(settings.MEDIA_ROOT, 'candidate_headshots', filename)
                
                # Check if file exists
                if not os.path.exists(file_path):
                    return Response({'error': 'File not found'}, status=status.HTTP_404_NOT_FOUND)
                
                # Return file response
                response = FileResponse(
                    open(file_path, 'rb'),
                    as_attachment=True,
                    filename=filename
                )
                return response
            
        except Exception as e:
            logger.error(f"Error downloading headshot: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_s3_upload(request):
    try:
        # Test direct boto3 connection
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        
        # Log connection success
        logger.info("Successfully connected to S3")
        
        # Create a test file
        test_content = b"This is a test file"
        test_path = "test/test_file.txt"
        
        # Try to upload using Django's storage
        path = default_storage.save(test_path, ContentFile(test_content))
        
        # Get the URL of the uploaded file
        url = default_storage.url(path)
        
        # Try to read the file back to verify
        file_content = default_storage.open(path).read()
        
        # Clean up - delete the test file
        default_storage.delete(path)
        
        return Response({
            'message': 'S3 configuration is working correctly',
            'test_file_url': url,
            'connection_test': 'Successful',
            'upload_test': 'Successful',
            'read_test': 'Successful',
            'delete_test': 'Successful'
        })
        
    except Exception as e:
        logger.error(f"S3 test failed: {str(e)}")
        return Response({
            'error': f'S3 configuration test failed: {str(e)}',
            'details': {
                'bucket': settings.AWS_STORAGE_BUCKET_NAME,
                'region': settings.AWS_S3_REGION_NAME,
                # Don't log the actual credentials
                'access_key_present': bool(settings.AWS_ACCESS_KEY_ID),
                'secret_key_present': bool(settings.AWS_SECRET_ACCESS_KEY)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_headshot(request):
    try:
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES['file']
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            return Response(
                {'error': 'File must be an image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (5MB limit)
        if file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'File size must be less than 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create candidate profile
        profile, created = CandidateProfile.objects.get_or_create(
            user=request.user
        )

        # Delete old headshot if it exists
        if profile.headshot:
            profile.headshot.delete(save=False)

        # Save new headshot
        profile.headshot = file
        profile.save()

        return Response({
            'url': profile.headshot.url,
            'message': 'Headshot uploaded successfully'
        })

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
