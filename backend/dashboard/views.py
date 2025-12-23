from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import Organization, Event, Department
from teams.models import Participant, Team, TeamMember
from raffle.models import RaffleEvent, Prize, RaffleParticipant
from sports.models import Tournament, Match, MatchResult
from core.permissions import IsOrgMemberOrReadOnly


class DashboardView(APIView):
    """Dashboard overview"""
    permission_classes = [IsAuthenticated, IsOrgMemberOrReadOnly]
    
    def get(self, request):
        org_id = getattr(request, 'org_id', None)
        
        if not org_id:
            if request.user.is_superadmin():
                # Superadmin sees all
                orgs = Organization.objects.all()
            else:
                return Response({'error': 'Organization context required'}, status=400)
        else:
            orgs = Organization.objects.filter(id=org_id)
        
        dashboard_data = []
        for org in orgs:
            events = Event.objects.filter(org_id=org.id)
            
            # Teams stats
            participants_count = Participant.objects.filter(org_id=org.id).count()
            teams_count = Team.objects.filter(org_id=org.id).count()
            team_members_count = TeamMember.objects.filter(team__org_id=org.id).count()
            
            # Raffle stats
            raffle_events_count = RaffleEvent.objects.filter(org_id=org.id).count()
            prizes_count = Prize.objects.filter(raffle_event__org_id=org.id).count()
            raffle_winners_count = RaffleParticipant.objects.filter(
                prize__raffle_event__org_id=org.id
            ).count()
            
            # Sports stats
            tournaments_count = Tournament.objects.filter(org_id=org.id).count()
            matches_count = Match.objects.filter(tournament__org_id=org.id).count()
            completed_matches_count = Match.objects.filter(
                tournament__org_id=org.id,
                status='completed'
            ).count()
            
            dashboard_data.append({
                'organization': {
                    'id': org.id,
                    'name': org.name,
                    'code': org.code
                },
                'events': {
                    'total': events.count(),
                    'active': events.filter(status='active').count(),
                    'completed': events.filter(status='completed').count()
                },
                'teams': {
                    'participants': participants_count,
                    'teams': teams_count,
                    'team_members': team_members_count
                },
                'raffle': {
                    'events': raffle_events_count,
                    'prizes': prizes_count,
                    'winners': raffle_winners_count
                },
                'sports': {
                    'tournaments': tournaments_count,
                    'matches': matches_count,
                    'completed_matches': completed_matches_count
                }
            })
        
        return Response({
            'success': True,
            'data': dashboard_data[0] if len(dashboard_data) == 1 else dashboard_data
        })


class DashboardStatsView(APIView):
    """Detailed dashboard statistics"""
    permission_classes = [IsAuthenticated, IsOrgMemberOrReadOnly]
    
    def get(self, request):
        org_id = getattr(request, 'org_id', None)
        event_id = request.query_params.get('event_id')
        
        if not org_id:
            return Response({'error': 'Organization context required'}, status=400)
        
        stats = {
            'organization': {
                'id': org_id,
                'departments_count': Department.objects.filter(org_id=org_id).count()
            }
        }
        
        if event_id:
            # Event-specific stats
            try:
                event = Event.objects.get(id=event_id, org_id=org_id)
            except Event.DoesNotExist:
                return Response({'error': 'Event not found'}, status=404)
            
            # Teams stats for event
            participants = Participant.objects.filter(org_id=org_id, event_id=event_id)
            teams = Team.objects.filter(org_id=org_id, event_id=event_id)
            
            stats['event'] = {
                'id': event.id,
                'name': event.name,
                'status': event.status
            }
            
            stats['teams'] = {
                'participants_count': participants.count(),
                'teams_count': teams.count(),
                'teams': [
                    {
                        'id': team.id,
                        'color_name': team.color_name,
                        'member_count': team.member_count
                    }
                    for team in teams
                ]
            }
            
            # Raffle stats for event
            raffle_events = RaffleEvent.objects.filter(org_id=org_id, event_id=event_id)
            stats['raffle'] = {
                'events_count': raffle_events.count(),
                'events': [
                    {
                        'id': re.id,
                        'name': re.name,
                        'prizes_count': re.prizes.count(),
                        'winners_count': RaffleParticipant.objects.filter(
                            prize__raffle_event=re
                        ).count()
                    }
                    for re in raffle_events
                ]
            }
            
            # Sports stats for event
            tournaments = Tournament.objects.filter(org_id=org_id, event_id=event_id)
            stats['sports'] = {
                'tournaments_count': tournaments.count(),
                'tournaments': [
                    {
                        'id': t.id,
                        'name': t.name,
                        'format': t.format,
                        'status': t.status,
                        'matches_count': t.matches.count(),
                        'completed_matches_count': t.matches.filter(status='completed').count()
                    }
                    for t in tournaments
                ]
            }
        
        return Response({
            'success': True,
            'stats': stats
        })

