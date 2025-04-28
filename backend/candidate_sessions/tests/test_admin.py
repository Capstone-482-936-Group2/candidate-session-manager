from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.admin.sites import AdminSite
from candidate_sessions.models import Session
from candidate_sessions.admin import SessionAdmin

class MockRequest:
    def __init__(self, user):
        self.user = user

class SessionAdminTest(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.user_model = get_user_model()
        self.superuser = self.user_model.objects.create_user(
            username='superuser', email='super@example.com', password='pass', is_superuser=True, is_staff=True
        )
        self.staff_user = self.user_model.objects.create_user(
            username='staff', email='staff@example.com', password='pass', is_superuser=False, is_staff=True
        )
        self.session_admin = SessionAdmin(Session, self.site)
        # Create a session for testing
        Session.objects.create(
            title="Test Session",
            start_date="2024-01-01",
            end_date="2024-01-02",
            created_by=self.superuser
        )

    def test_get_queryset_superuser(self):
        request = MockRequest(self.superuser)
        qs = self.session_admin.get_queryset(request)
        self.assertEqual(list(qs), list(Session.objects.all()))

    def test_get_queryset_staff(self):
        request = MockRequest(self.staff_user)
        qs = self.session_admin.get_queryset(request)
        self.assertEqual(list(qs), list(Session.objects.all())) 