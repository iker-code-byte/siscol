from django.contrib import admin
from django.urls import path, include

api_patterns = [
    path('', include('apps.accounts.urls')),
    path('', include('apps.academics.urls')),
    path('', include('apps.audit.urls')),
    path('', include('apps.grades.urls')),
    path('', include('apps.attendance.urls')),
    path('', include('apps.qa.urls')),
    path('', include('apps.guardians.urls')),
    path('', include('apps.alerts.urls')),
    path('', include('apps.notifications.urls')),
    path('', include('apps.reports.urls')),
]

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include(api_patterns)),
]
