import mimetypes
from pathlib import Path
from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, Http404
from django.urls import path, re_path, include

FRONTEND_DIST = Path(settings.BASE_DIR).parent / 'frontend' / 'dist'


def serve_frontend(request, resource_path=''):
    if not FRONTEND_DIST.exists():
        raise Http404("Frontend dist not found")
    clean_path = resource_path.strip('/')
    if clean_path:
        candidate = (FRONTEND_DIST / clean_path).resolve()
        if str(candidate).startswith(str(FRONTEND_DIST.resolve())) and candidate.is_file():
            content_type, _ = mimetypes.guess_type(str(candidate))
            return FileResponse(open(candidate, 'rb'), content_type=content_type or 'application/octet-stream')
    index_file = FRONTEND_DIST / 'index.html'
    if index_file.is_file():
        return FileResponse(open(index_file, 'rb'), content_type='text/html; charset=utf-8')
    raise Http404("index.html not found")


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
    re_path(r'^(?P<resource_path>.*)$', serve_frontend),
]
