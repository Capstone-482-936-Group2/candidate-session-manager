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
        
        # If not admin, remove sensitive fields for other users
        if request and not request.user.is_admin and instance.id != request.user.id:
            # Keep only basic info for other users
            allowed_fields = ['id', 'username', 'first_name', 'last_name']
            return {k: v for k, v in data.items() if k in allowed_fields}
            
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password2', 'first_name', 'last_name']
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return data
    
    def create(self, validated_data):
        # Remove password2 as it's not needed for user creation
        validated_data.pop('password2')
        
        # Get the password and remove it from validated_data
        password = validated_data.pop('password')
        
        # Create the user without the password
        user = User.objects.create_user(
            **validated_data, 
            password=password  # Pass password separately
        )
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'user_type']
        read_only_fields = ['email', 'username']  # These fields can't be changed
