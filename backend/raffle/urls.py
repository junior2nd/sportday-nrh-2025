from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

"""
Raffle API URLs

Base URL: /api/raffle/

Available endpoints:

1. Events (RaffleEventViewSet)
   - GET    /api/raffle/events/                    - List all raffle events
   - POST   /api/raffle/events/                    - Create new raffle event
   - GET    /api/raffle/events/{id}/               - Get raffle event detail
   - PUT    /api/raffle/events/{id}/               - Update raffle event
   - DELETE /api/raffle/events/{id}/               - Delete raffle event

2. Prizes (PrizeViewSet)
   - GET    /api/raffle/prizes/                     - List all prizes
   - POST   /api/raffle/prizes/                     - Create new prize
   - GET    /api/raffle/prizes/{id}/                - Get prize detail
   - PUT    /api/raffle/prizes/{id}/                - Update prize
   - DELETE /api/raffle/prizes/{id}/                - Delete prize
   - POST   /api/raffle/prizes/{id}/select/        - Select winners for this prize
   - POST   /api/raffle/prizes/{id}/add-participants/ - Manually add participants to prize

3. Participants (RaffleParticipantViewSet)
   - GET    /api/raffle/participants/               - List all raffle participants (winners)
   - GET    /api/raffle/participants/{id}/          - Get raffle participant detail
   - DELETE /api/raffle/participants/{id}/         - Delete raffle participant

4. Eligible Participants
   - GET    /api/raffle/events/{id}/list-eligible-participants/
            List all eligible participants for a raffle event
            Returns: {success: true, count: number, results: Participant[]}
            Note: Uses Participant model directly with is_raffle_eligible field

5. Logs (RaffleLogViewSet)
   - GET    /api/raffle/logs/                       - List all raffle logs
   - GET    /api/raffle/logs/{id}/                  - Get raffle log detail

Query Parameters:
- Most list endpoints support filtering via query params (e.g., ?raffle_event=1)
- Use DjangoFilterBackend filterset_fields for filtering
"""

router = DefaultRouter()
router.register(r'events', views.RaffleEventViewSet, basename='raffle-event')
router.register(r'prizes', views.PrizeViewSet, basename='prize')
router.register(r'participants', views.RaffleParticipantViewSet, basename='raffle-participant')
# Note: eligible-participants endpoint removed - use Participant model directly with is_raffle_eligible field
router.register(r'logs', views.RaffleLogViewSet, basename='raffle-log')
router.register(r'control', views.RaffleControlViewSet, basename='raffle-control')

urlpatterns = [
    path('', include(router.urls)),
]

