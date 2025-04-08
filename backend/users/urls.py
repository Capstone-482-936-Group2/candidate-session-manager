from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router and register our viewset
router = DefaultRouter()
router.register(r'list', views.UserViewSet)

# The API URLs are determined automatically by the router
urlpatterns = [
    path('', include(router.urls)),
    path('send-form-link/', views.send_form_link, name='send-form-link'),
]