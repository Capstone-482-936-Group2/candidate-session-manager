from rest_framework import serializers
from .models import User, CandidateProfile
from django.conf import settings

# Define CandidateProfileSerializer first
class CandidateProfileSerializer(serializers.ModelSerializer):
    headshot_url = serializers.SerializerMethodField()

    class Meta:
        model = CandidateProfile
        fields = [
            'current_title',
            'current_department',
            'current_institution',
            'research_interests',
            'cell_number',
            'travel_assistance',
            'passport_name',
            'date_of_birth',
            'country_of_residence',
            'gender',
            'gender_custom',
            'preferred_airport',
            'frequent_flyer_info',
            'known_traveler_number',
            'talk_title',
            'abstract',
            'biography',
            'headshot_url',
            'videotape_permission',
            'advertisement_permission',
            'food_preferences',
            'dietary_restrictions',
            'extra_tours',
            'preferred_faculty',
            'has_completed_setup',
            'preferred_visit_dates'
        ]

    def get_headshot_url(self, obj):
        if obj.headshot:
            return obj.headshot.url
        return None

# Then define UserSerializer that uses it
class UserSerializer(serializers.ModelSerializer):
    candidate_profile = CandidateProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                 'user_type', 'room_number', 'has_completed_setup', 
                 'candidate_profile']
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
                    # Instead of returning None, return limited data
                    return {
                        'id': instance.id,
                        'first_name': instance.first_name,
                        'last_name': instance.last_name,
                        'user_type': instance.user_type
                    }
            
        return data

# Keep the existing RegisterSerializer and UserUpdateSerializer
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'user_type', 'room_number', 'has_completed_setup']
    
    def create(self, validated_data):
        # Create the user without a password
        user = User.objects.create_user(
            username=validated_data['email'],  # Use email as username
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            user_type=validated_data.get('user_type', 'candidate'),
            room_number=validated_data.get('room_number', ''),
            has_completed_setup=validated_data.get('has_completed_setup', False)
        )
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                 'user_type', 'room_number', 'has_completed_setup']
        read_only_fields = ['email', 'username']
