from django.test import TestCase, RequestFactory
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from users.admin import CustomUserAdmin
from users.models import User, CandidateProfile

class CustomUserAdminTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.site = AdminSite()
        self.admin = CustomUserAdmin(User, self.site)
        
        # Create a superuser and regular admin
        self.superuser = User.objects.create_superuser(
            username="superadmin",
            email="superadmin@example.com",
            password="password"
        )
        
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password",
            is_staff=True,
            is_superuser=False,
            user_type="admin"
        )
        
        # Create regular users of different types
        self.regular_user = User.objects.create_user(
            username="regular",
            email="regular@example.com",
            password="password",
            user_type="candidate"
        )
    
    def test_get_queryset_superuser(self):
        """Test superusers can see all users including other superusers"""
        request = self.factory.get('/admin/users/user/')
        request.user = self.superuser
        
        qs = self.admin.get_queryset(request)
        
        self.assertEqual(qs.count(), 3)  # Should see all users
        self.assertTrue(qs.filter(is_superuser=True).exists())
    
    def test_get_queryset_admin(self):
        """Test regular admins cannot see superusers"""
        request = self.factory.get('/admin/users/user/')
        request.user = self.admin_user
        
        qs = self.admin.get_queryset(request)
        
        self.assertEqual(qs.count(), 2)  # Should only see admin and regular users
        self.assertFalse(qs.filter(is_superuser=True).exists())
    
    def test_get_readonly_fields_superuser(self):
        """Test superusers don't have additional readonly fields"""
        request = self.factory.get('/admin/users/user/1/change/')
        request.user = self.superuser
        
        readonly_fields = self.admin.get_readonly_fields(request)
        
        self.assertEqual(readonly_fields, ())  # Default empty tuple
    
    def test_get_readonly_fields_admin(self):
        """Test regular admins have is_superuser and user_permissions as readonly"""
        request = self.factory.get('/admin/users/user/1/change/')
        request.user = self.admin_user
        
        readonly_fields = self.admin.get_readonly_fields(request)
        
        self.assertEqual(set(readonly_fields), {'is_superuser', 'user_permissions'})
    
    def test_save_model_new_user_no_username(self):
        """Test that username is set to email when creating user without username"""
        request = self.factory.post('/admin/users/user/add/')
        request.user = self.superuser
        
        # Create new user without username
        obj = User(
            email="newuser@example.com",
            user_type="faculty"
        )
        form = None  # Form not needed for this test
        
        # Should set username to email
        self.admin.save_model(request, obj, form, False)
        
        self.assertEqual(obj.username, "newuser@example.com") 