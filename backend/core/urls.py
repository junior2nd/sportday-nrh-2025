from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'organizations', views.OrganizationViewSet, basename='organization')
router.register(r'departments', views.DepartmentViewSet, basename='department')
router.register(r'events', views.EventViewSet, basename='event')
router.register(r'modules', views.ModuleRegistryViewSet, basename='module')
router.register(r'audit-logs', views.AuditLogViewSet, basename='audit-log')
router.register(r'import', views.ImportViewSet, basename='import')
router.register(r'login-settings', views.LoginPageSettingsViewSet, basename='login-settings')

urlpatterns = [
    path('', include(router.urls)),
]

