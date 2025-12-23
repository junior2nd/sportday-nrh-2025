from django.urls import path
from . import views

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
]

