from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from candidate_sessions.models import Form, FormField, FormFieldOption

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with a sample form'

    def handle(self, *args, **options):
        self.stdout.write('Seeding sample form...')
        
        # Get or create a superuser to be the creator of the form
        try:
            creator = User.objects.filter(is_superuser=True).first()
            if not creator:
                self.stdout.write(self.style.ERROR('No superuser found. Please create a superuser first.'))
                return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error finding superuser: {str(e)}'))
            return
        
        # Create a sample form if not exists
        if not Form.objects.filter(title='20XX-20XX CSE Faculty Candidates').exists():
            form = Form.objects.create(
                title='20XX-20XX CSE Faculty Candidates',
                description='Information Gathering for Upcoming CSE @ TAMU Visit',
                is_active=True,
                created_by=creator
            )
            
            # Add form fields
            fields = [
                # Basic Information
                {
                    'type': 'date_range',
                    'label': 'Please list your primary possible date range for your visit',
                    'required': True,
                    'help_text': 'Please list a possible date range for your visit',
                    'options': []
                },
                {
                    'type': 'date_range',
                    'label': 'Please list your secondary possible date range for your visit',
                    'required': True,
                    'help_text': 'Please list a possible date range for your visit',
                    'options': []
                },
                {
                    'type': 'date_range',
                    'label': 'Please list your third possible date range for your visit',
                    'required': True,
                    'help_text': 'Please list a possible date range for your visit',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'First Name',
                    'required': True,
                    'help_text': 'Please enter your first name',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Last Name',
                    'required': True,
                    'help_text': 'Please enter your last name',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Current Title',
                    'required': True,
                    'help_text': 'Please enter your current title',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Current Department',
                    'required': True,
                    'help_text': 'Please enter your current department',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Current Institution',
                    'required': True,
                    'help_text': 'Please enter your current institution',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Email',
                    'required': True,
                    'help_text': 'Please enter your email address',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Cell Number',
                    'required': True,
                    'help_text': 'Please enter a valid phone number.',
                    'options': []
                },
                {
                    'type': 'textarea',
                    'label': 'Research/Teaching Interests',
                    'required': True,
                    'help_text': 'Briefly describe your research interests. (1 - 2 sentences)s',
                    'options': []
                },
                # Travel Assistance
                {
                    'type': 'radio',
                    'label': 'Would you like assistance in booking your travel, including air, car rental, or shuttle service? Please note that your lodging will automatically be reserved by the department.',
                    'required': True,
                    'help_text': 'Select your travel assistance preference',
                    'options': [
                        'Yes, I will need help with ALL travel arrangements.',
                        'Yes, I will need help with SOME of my travel arrangements.',
                        'No, I will book ALL travel arrangements and will submit for reimbursement.'
                    ]
                },
                # Travel Information
                {
                    'type': 'text',
                    'label': 'Full Name (as it appears on your passport)',
                    'required': True,
                    'help_text': 'Please enter your full name as it appears on your passport',
                    'options': []
                },
                {
                    'type': 'date',
                    'label': 'Date of Birth (MM/DD/YEAR)',
                    'required': True,
                    'help_text': 'Please enter your date of birth',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Country of Residence',
                    'required': True,
                    'help_text': 'Please enter your country of residence',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Preferred Airport',
                    'required': True,
                    'help_text': 'Please enter your preferred airport',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Any Frequent Flier Info',
                    'required': False,
                    'help_text': 'Please enter any frequent flier information',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Optional-Known Traveler #',
                    'required': False,
                    'help_text': 'Please enter your Known Traveler Number if applicable',
                    'options': []
                },
                # Presentation Information
                {
                    'type': 'text',
                    'label': 'Talk Title',
                    'required': True,
                    'help_text': 'Please enter the title of your talk',
                    'options': []
                },
                {
                    'type': 'textarea',
                    'label': 'Abstract',
                    'required': True,
                    'help_text': 'Please limit to 500 words or less',
                    'options': []
                },
                {
                    'type': 'textarea',
                    'label': 'Biography',
                    'required': True,
                    'help_text': 'Please limit to 250 words or less',
                    'options': []
                },
                # Consent Questions
                {
                    'type': 'radio',
                    'label': 'Your talk will be videotaped and shared with department faculty who are not able to attend in person. Do you agree to this?',
                    'required': True,
                    'help_text': '',
                    'options': ['Yes', 'No']
                },
                {
                    'type': 'radio',
                    'label': 'Your visit will be advertised as a "Faculty Candidate Visit." Do you agree to this? If no is selected, your visit and talk will identify you as a Guest Lecturer and Department Visitor.',
                    'required': True,
                    'help_text': '',
                    'options': ['Yes', 'No']
                },
                # Additional Information
                {
                    'type': 'text',
                    'label': 'What type of food to you prefer? Please limit to three (3).',
                    'required': True,
                    'help_text': 'Example: American, Chinese, Mexican, Indian, Japanese/Sushi, Korean, Italian, French, etc.',
                    'options': []
                },
                {
                    'type': 'text',
                    'label': 'Do you have any dietary restrictions or preferences?',
                    'required': False,
                    'help_text': 'ie. Vegan, Vegetarian, Kosher, etc.',
                    'options': []
                },
                {
                    'type': 'select',
                    'label': 'If time allows, would you be interested in one of the following?',
                    'required': False,
                    'help_text': 'Please select an option if interested',
                    'options': ['Campus Tour', 'Community Tour w/Realtor', 'Not at this time']
                },
                {
                    'type': 'textarea',
                    'label': 'Please list up to FOUR (4) faculty members you would most like to meet with during your on-site visit. (NO guarantees, but an invitation will be extended.)',
                    'required': False,
                    'help_text': 'Please list faculty members you would like to meet. <a href="https://engineering.tamu.edu/cse/profiles/index.html#Faculty" target="_blank">View faculty</a>',
                    'options': []
                }
            ]
            
            for field_data in fields:
                field = FormField.objects.create(
                    form=form,
                    type=field_data['type'],
                    label=field_data['label'],
                    required=field_data['required'],
                    help_text=field_data['help_text']
                )
                
                # Create options for fields that need them
                for i, option_label in enumerate(field_data['options']):
                    FormFieldOption.objects.create(
                        field=field,
                        label=option_label,
                        order=i
                    )
            
            self.stdout.write(self.style.SUCCESS('Created sample form with fields'))
        else:
            self.stdout.write(self.style.SUCCESS('Sample form already exists'))
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded data')) 