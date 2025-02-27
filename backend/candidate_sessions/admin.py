from django.contrib import admin
from .models import CandidateSession, SessionTimeSlot, SessionAttendee

class SessionTimeSlotInline(admin.TabularInline):
    model = SessionTimeSlot
    extra = 1

class CandidateSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'candidate', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'candidate__email')
    inlines = [SessionTimeSlotInline]
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # If superuser, show all
        if request.user.is_superuser:
            return qs
        # If admin but not superuser, show only relevant sessions
        return qs

class SessionTimeSlotAdmin(admin.ModelAdmin):
    list_display = ('session', 'start_time', 'end_time', 'max_attendees')
    list_filter = ('session',)
    search_fields = ('session__title',)

class SessionAttendeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'time_slot', 'registered_at')
    list_filter = ('time_slot__session', 'registered_at')
    search_fields = ('user__email', 'time_slot__session__title')

admin.site.register(CandidateSession, CandidateSessionAdmin)
admin.site.register(SessionTimeSlot, SessionTimeSlotAdmin)
admin.site.register(SessionAttendee, SessionAttendeeAdmin)
