"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet, send_form_link
from candidate_sessions.views import (
    SessionViewSet, 
    CandidateSectionViewSet, 
    SessionTimeSlotViewSet, 
    SessionAttendeeViewSet,
    TimeSlotTemplateViewSet,
    LocationTypeViewSet,
    LocationViewSet,
    FormViewSet,
    FormSubmissionViewSet,
    FacultyAvailabilityViewSet,
    AvailabilityInvitationViewSet
)
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'seasons', SessionViewSet, basename='season')
router.register(r'candidate-sections', CandidateSectionViewSet, basename='candidate-section')
router.register(r'timeslots', SessionTimeSlotViewSet, basename='timeslot')
router.register(r'attendees', SessionAttendeeViewSet, basename='attendee')
router.register(r'timeslot-templates', TimeSlotTemplateViewSet, basename='timeslot-template')
router.register(r'location-types', LocationTypeViewSet, basename='location-type')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'forms', FormViewSet, basename='form')
router.register(r'form-submissions', FormSubmissionViewSet, basename='form-submission')
router.register(r'faculty-availability', FacultyAvailabilityViewSet, basename='faculty-availability')
router.register(r'availability-invitations', AvailabilityInvitationViewSet, basename='availability-invitation')

# API URLs
api_urlpatterns = [
    path('', include(router.urls)),
    path('users/', include('users.urls')),  # User authentication URLs
    path('users/send-form-link/', send_form_link, name='send-form-link'),  # Add the send-form-link endpoint directly
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('allauth.urls')),
    path('api/', include(api_urlpatterns)),  # All API routes under /api/
    path('api-auth/', include('rest_framework.urls')),
]

# Add this at the end of the file, after urlpatterns
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
