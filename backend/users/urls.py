from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewset
router = DefaultRouter()
router.register(r'', views.UserViewSet, basename='users')

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
]