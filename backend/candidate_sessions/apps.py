"""
Django AppConfig for the candidate_sessions application.
This file configures the candidate sessions app and is automatically created by Django.
"""
from django.apps import AppConfig


class CandidateSessionsConfig(AppConfig):
    """
    Configuration class for the candidate_sessions app.
    Defines database field configuration and the application name.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'candidate_sessions'
