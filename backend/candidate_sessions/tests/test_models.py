from django.test import TestCase
from django.contrib.auth import get_user_model
from candidate_sessions.models import Form, FormField, FormSubmission

class FormSubmissionSaveTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass'
        )
        self.form = Form.objects.create(
            title="Test Form",
            created_by=self.user
        )
        self.field = FormField.objects.create(
            form=self.form,
            type='text',
            label='Test Field',
            required=True
        )

    def test_form_submission_save_sets_form_version(self):
        print("TEST_RUNNING")
        submission = FormSubmission(
            form=self.form,
            submitted_by=self.user,
            answers={'Test Field': 'Some answer'},
            is_completed=True
        )
        self.assertEqual(submission.form_version, {})
        submission.save()
        self.assertIn('fields', submission.form_version)
        self.assertIn(str(self.field.id), submission.form_version['fields'])
        field_meta = submission.form_version['fields'][str(self.field.id)]
        self.assertEqual(field_meta['type'], 'text')
        self.assertEqual(field_meta['label'], 'Test Field')
        self.assertEqual(field_meta['required'], True)

    def test_form_submission_save_sets_form_version_with_print(self):
        submission = FormSubmission(
            form=self.form,
            submitted_by=self.user,
            answers={'Test Field': 'Some answer'},
            is_completed=True
        )
        self.assertEqual(submission.form_version, {})
        submission.save()
        self.assertIn('fields', submission.form_version)
        self.assertIn(str(self.field.id), submission.form_version['fields'])
        field_meta = submission.form_version['fields'][str(self.field.id)]
        self.assertEqual(field_meta['type'], 'text')
        self.assertEqual(field_meta['label'], 'Test Field')
        self.assertEqual(field_meta['required'], True)

        if not submission.form_version:
            print("COVERAGE_HIT")
            submission.form_version = {
                'fields': {
                    str(field.id): {
                        'type': field.type,
                        'label': field.label,
                        'required': field.required
                    }
                    for field in self.form.form_fields.all()
                }
            }
