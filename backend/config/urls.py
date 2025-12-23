from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin Panel
    path('admin/', admin.site.urls),
    
    # API Endpoints
    # Authentication & User Management
    path('api/auth/', include('accounts.urls')),  # /api/auth/login/, /api/auth/me/, etc.
    
    # Core Models (Organizations, Events, Departments, etc.)
    path('api/core/', include('core.urls')),  # /api/core/organizations/, /api/core/events/, etc.
    
    # Teams & Participants
    path('api/teams/', include('teams.urls')),  # /api/teams/participants/, /api/teams/teams/, etc.
    
    # Raffle System
    # See raffle/urls.py for detailed endpoint documentation
    path('api/raffle/', include('raffle.urls')),  # /api/raffle/events/, /api/raffle/prizes/, etc.
    
    # Sports & Tournaments
    path('api/sports/', include('sports.urls')),  # /api/sports/tournaments/, etc.
    
    # Dashboard & Statistics
    path('api/dashboard/', include('dashboard.urls')),  # /api/dashboard/, /api/dashboard/stats/, etc.
    
    # DRF Browsable API
    path('api-auth/', include('rest_framework.urls')),
]

# Static and media files (if DEBUG=True)
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

