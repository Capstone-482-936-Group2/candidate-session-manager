from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'user_type']
        read_only_fields = ['id']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_superadmin = self.context.get('is_superadmin', False)
        
        if not request or not request.user.is_authenticated:
            # Unauthenticated users see very limited data
            allowed_fields = ['id', 'username', 'first_name', 'last_name']
            return {k: v for k, v in data.items() if k in allowed_fields}
            
        if not is_superadmin:
            # Non-superadmins don't see email for other users
            # and only see user_type for non-superadmin users
            if instance.id != request.user.id:
                if instance.user_type == 'superadmin':
                    # Hide superadmin users completely from non-superadmins
                    return None
                
        return data

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'user_type']
    
    def create(self, validated_data):
        # Create the user without a password
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            user_type=validated_data.get('user_type', 'candidate')
        )
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'user_type']
        read_only_fields = ['email', 'username']  # These fields can't be changed
