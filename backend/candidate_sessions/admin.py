from django.contrib import admin
from .models import Session, CandidateSection, SessionTimeSlot, SessionAttendee, Location, LocationType

class SessionTimeSlotInline(admin.TabularInline):
    model = SessionTimeSlot
    extra = 1

class SessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_date', 'end_date', 'created_by', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If superuser, show all
        if request.user.is_superuser:
            return qs
        # If admin but not superuser, show only relevant sessions
        return qs

class CandidateSectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'session', 'candidate', 'location', 'created_at')
    list_filter = ('session', 'created_at')
    search_fields = ('title', 'candidate__email', 'session__title')
    inlines = [SessionTimeSlotInline]

class SessionTimeSlotAdmin(admin.ModelAdmin):
    list_display = ('candidate_section', 'start_time', 'end_time', 'max_attendees')
    list_filter = ('candidate_section__session',)
    search_fields = ('candidate_section__title', 'candidate_section__session__title')

class SessionAttendeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'time_slot', 'registered_at')
    list_filter = ('time_slot__candidate_section__session', 'registered_at')
    search_fields = ('user__email', 'time_slot__candidate_section__title')

class LocationTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_by', 'created_at')
    search_fields = ('name',)

class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'location_type', 'address', 'created_by', 'created_at')
    list_filter = ('location_type',)
    search_fields = ('name', 'address')

admin.site.register(Session, SessionAdmin)
admin.site.register(CandidateSection, CandidateSectionAdmin)
admin.site.register(SessionTimeSlot, SessionTimeSlotAdmin)
admin.site.register(SessionAttendee, SessionAttendeeAdmin)
admin.site.register(LocationType, LocationTypeAdmin)
admin.site.register(Location, LocationAdmin)
