from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import SportType, Tournament, Match, MatchTeam, MatchResult
from .serializers import (
    SportTypeSerializer, TournamentSerializer, MatchSerializer,
    MatchTeamSerializer, MatchResultSerializer
)
from .tournament_generator import RoundRobinGenerator, SingleEliminationGenerator
from .scoring import get_score_calculator
from core.permissions import IsOrgAdminOrReadOnly, IsStaffOrReadOnly, IsJudgeOrReadOnly
from core.utils import create_audit_log
from core.models import Organization
from rest_framework.permissions import IsAuthenticated


class SportTypeViewSet(viewsets.ModelViewSet):
    serializer_class = SportTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['org', 'is_active']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    permission_classes = [IsAuthenticated, IsOrgAdminOrReadOnly]
    
    def get_queryset(self):
        org_id = getattr(self.request, 'org_id', None)
        if org_id:
            return SportType.objects.filter(org_id=org_id)
        if self.request.user.is_superadmin():
            return SportType.objects.all()
        return SportType.objects.none()


class TournamentViewSet(viewsets.ModelViewSet):
    serializer_class = TournamentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['org', 'event', 'sport_type', 'status']
    search_fields = ['name']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated, IsOrgAdminOrReadOnly]
    
    def get_queryset(self):
        org_id = getattr(self.request, 'org_id', None)
        if org_id:
            queryset = Tournament.objects.filter(org_id=org_id)
            event_id = self.request.query_params.get('event')
            if event_id:
                queryset = queryset.filter(event_id=event_id)
            return queryset
        if self.request.user.is_superadmin():
            return Tournament.objects.all()
        return Tournament.objects.none()
    
    @action(detail=True, methods=['post'], url_path='generate-matches')
    def generate_matches(self, request, pk=None):
        """Generate matches for tournament"""
        tournament = self.get_object()
        team_ids = request.data.get('team_ids', [])
        
        if not team_ids:
            return Response(
                {'error': 'team_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from teams.models import Team
        teams = Team.objects.filter(id__in=team_ids, org_id=tournament.org_id)
        
        if teams.count() != len(team_ids):
            return Response(
                {'error': 'Some teams not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate matches based on format
        if tournament.format == 'round_robin':
            generator = RoundRobinGenerator(tournament, list(teams))
        elif tournament.format == 'single_elimination':
            generator = SingleEliminationGenerator(tournament, list(teams))
        else:
            return Response(
                {'error': f'Unsupported format: {tournament.format}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        matches = generator.generate()
        
        # Audit log
        create_audit_log(
            user=request.user,
            org=tournament.org,
            action='create',
            model='Match',
            changes={'tournament_id': tournament.id, 'matches_created': len(matches)},
            request=request
        )
        
        return Response({
            'success': True,
            'matches_created': len(matches),
            'matches': MatchSerializer(matches, many=True).data
        })


class MatchViewSet(viewsets.ModelViewSet):
    serializer_class = MatchSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tournament', 'status', 'round_number']
    ordering_fields = ['round_number', 'match_number', 'scheduled_at']
    ordering = ['round_number', 'match_number']
    permission_classes = [IsAuthenticated, IsJudgeOrReadOnly]
    
    def get_queryset(self):
        org_id = getattr(self.request, 'org_id', None)
        if org_id:
            return Match.objects.filter(tournament__org_id=org_id)
        if self.request.user.is_superadmin():
            return Match.objects.all()
        return Match.objects.none()
    
    @action(detail=True, methods=['post'], url_path='update-score')
    def update_score(self, request, pk=None):
        """Update match score"""
        match = self.get_object()
        scores = request.data.get('scores', {})  # {team_id: score_data}
        
        # Update scores
        for team_id, score_data in scores.items():
            match_team = match.match_teams.filter(team_id=team_id).first()
            if match_team:
                match_team.score = score_data
                match_team.save()
        
        # Calculate result
        calculator = get_score_calculator(match.tournament.sport_type)
        result = calculator.calculate(match)
        
        # Update match teams with results
        if 'winner' in result and result['winner']:
            for match_team in match.match_teams.all():
                if match_team.team_id == result['winner']:
                    match_team.result = 'win'
                else:
                    match_team.result = 'loss'
                match_team.save()
        elif result.get('is_draw'):
            for match_team in match.match_teams.all():
                match_team.result = 'draw'
                match_team.save()
        
        # Update match status
        match.status = 'completed'
        match.save()
        
        # Create match result
        match_result, created = MatchResult.objects.get_or_create(
            match=match,
            defaults={
                'result_data': result,
                'recorded_by': request.user
            }
        )
        
        # Broadcast via WebSocket
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'sports_{match.tournament.id}',
                {
                    'type': 'match_update',
                    'match_id': match.id,
                    'result': result
                }
            )
        
        # Audit log
        create_audit_log(
            user=request.user,
            org=match.tournament.org,
            action='update',
            model='Match',
            object_id=match.id,
            changes={'scores': scores, 'result': result},
            request=request
        )
        
        return Response({
            'success': True,
            'match': MatchSerializer(match).data,
            'result': result
        })


class MatchResultViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MatchResultSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['match__tournament']
    ordering_fields = ['recorded_at']
    ordering = ['-recorded_at']
    permission_classes = [IsAuthenticated, IsStaffOrReadOnly]
    
    def get_queryset(self):
        org_id = getattr(self.request, 'org_id', None)
        if org_id:
            return MatchResult.objects.filter(match__tournament__org_id=org_id)
        if self.request.user.is_superadmin():
            return MatchResult.objects.all()
        return MatchResult.objects.none()

