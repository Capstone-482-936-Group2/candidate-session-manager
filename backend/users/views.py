from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout
from .models import User
from .serializers import UserSerializer, RegisterSerializer, UserUpdateSerializer

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
        # Allow anyone to register or login, but require authentication for other actions
        if self.action in ['create', 'login', 'register']:
            return [permissions.AllowAny()]
        elif self.action in ['me', 'logout', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # For other actions like update/delete
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.is_superadmin:
                return User.objects.all()
            elif user.is_admin:
                # Admins can see all users except superadmins
                return User.objects.exclude(user_type='superadmin')
            else:
                # Regular users can see basic info about other users
                # but not sensitive fields (this is handled by the serializer)
                return User.objects.all()
        return User.objects.none()
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add debug printing
        print(f"Attempting to authenticate user with email: {email}")
        
        # Get the user manually to check if they exist
        try:
            user_check = User.objects.get(email=email)
            print(f"User found: {user_check.email}, {user_check.username}")
        except User.DoesNotExist:
            print("No user found with this email")
        
        # Try authentication
        user = authenticate(request, email=email, password=password)
        
        if user:
            print(f"Authentication successful for user: {user.email}")
            login(request, user)
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        else:
            print("Authentication failed")
        
        return Response(
            {'error': 'Invalid credentials'},
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
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                self.get_serializer(user).data,
                status=status.HTTP_201_CREATED
            )
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
        
        # Prevent changing superadmin roles by other superadmins
        if user.is_superadmin and user != request.user:
            return Response({'error': 'Cannot change another superadmin\'s role'}, 
                            status=status.HTTP_403_FORBIDDEN)
        
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
