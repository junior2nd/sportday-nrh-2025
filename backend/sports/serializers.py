from rest_framework import serializers
from .models import SportType, Tournament, Match, MatchTeam, MatchResult
from teams.serializers import TeamSerializer


class SportTypeSerializer(serializers.ModelSerializer):
    org_name = serializers.CharField(source='org.name', read_only=True)
    
    class Meta:
        model = SportType
        fields = [
            'id', 'org', 'org_name', 'name', 'template_config', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TournamentSerializer(serializers.ModelSerializer):
    event_name = serializers.CharField(source='event.name', read_only=True)
    sport_type_name = serializers.CharField(source='sport_type.name', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Tournament
        fields = [
            'id', 'org', 'event', 'event_name', 'sport_type', 'sport_type_name',
            'name', 'format', 'format_display', 'status', 'status_display',
            'settings', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MatchTeamSerializer(serializers.ModelSerializer):
    team_color_name = serializers.CharField(source='team.color_name', read_only=True)
    team_color_code = serializers.CharField(source='team.color_code', read_only=True)
    
    class Meta:
        model = MatchTeam
        fields = [
            'id', 'match', 'team', 'team_color_name', 'team_color_code',
            'score', 'result', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MatchSerializer(serializers.ModelSerializer):
    tournament_name = serializers.CharField(source='tournament.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    match_teams = MatchTeamSerializer(many=True, read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id', 'tournament', 'tournament_name', 'round_number', 'match_number',
            'status', 'status_display', 'scheduled_at', 'started_at', 'completed_at',
            'match_teams', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MatchResultSerializer(serializers.ModelSerializer):
    match_info = MatchSerializer(source='match', read_only=True)
    recorded_by_username = serializers.CharField(source='recorded_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = MatchResult
        fields = [
            'id', 'match', 'match_info', 'result_data', 'recorded_at', 'recorded_by',
            'recorded_by_username'
        ]
        read_only_fields = ['recorded_at']

