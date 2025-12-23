from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'sport-types', views.SportTypeViewSet, basename='sport-type')
router.register(r'tournaments', views.TournamentViewSet, basename='tournament')
router.register(r'matches', views.MatchViewSet, basename='match')
router.register(r'match-results', views.MatchResultViewSet, basename='match-result')

urlpatterns = [
    path('', include(router.urls)),
]

