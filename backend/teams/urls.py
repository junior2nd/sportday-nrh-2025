from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'participants', views.ParticipantViewSet, basename='participant')
router.register(r'teams', views.TeamViewSet, basename='team')
router.register(r'members', views.TeamMemberViewSet, basename='team-member')

urlpatterns = [
    path('', include(router.urls)),
]

