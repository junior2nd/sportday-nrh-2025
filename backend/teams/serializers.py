from rest_framework import serializers
from .models import Participant, Team, TeamMember
from core.serializers import DepartmentSerializer


class ParticipantSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    team_name = serializers.SerializerMethodField()
    team_color_code = serializers.SerializerMethodField()
    
    def get_team_name(self, obj):
        """Get team name for this participant in the event"""
        try:
            team_member = obj.team_memberships.filter(event_id=obj.event_id).first()
            if team_member and team_member.team:
                return team_member.team.color_name
        except:
            pass
        return None
    
    def get_team_color_code(self, obj):
        """Get team color code for this participant in the event"""
        try:
            team_member = obj.team_memberships.filter(event_id=obj.event_id).first()
            if team_member and team_member.team:
                return team_member.team.color_code
        except:
            pass
        return None
    
    class Meta:
        model = Participant
        fields = [
            'id', 'org', 'event', 'event_name', 'name', 'hospital_id', 'department', 'department_name',
            'is_raffle_eligible', 'team_name', 'team_color_code',
            'metadata', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TeamSerializer(serializers.ModelSerializer):
    event_name = serializers.SerializerMethodField()
    org_name = serializers.SerializerMethodField()
    member_count = serializers.IntegerField(read_only=True)
    
    def get_event_name(self, obj):
        return obj.event.name if obj.event else None
    
    def get_org_name(self, obj):
        return obj.org.name if obj.org else None
    
    class Meta:
        model = Team
        fields = [
            'id', 'org', 'org_name', 'event', 'event_name', 'color_name', 'color_code',
            'max_members', 'member_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'member_count']


class TeamMemberSerializer(serializers.ModelSerializer):
    participant_name = serializers.CharField(source='participant.name', read_only=True)
    participant_department = serializers.CharField(source='participant.department.name', read_only=True, allow_null=True)
    team_color_name = serializers.CharField(source='team.color_name', read_only=True)
    team_color_code = serializers.CharField(source='team.color_code', read_only=True)
    
    class Meta:
        model = TeamMember
        fields = [
            'id', 'team', 'team_color_name', 'team_color_code', 'participant', 'participant_name',
            'participant_department', 'event', 'is_pinned', 'is_moved', 'moved_from_team', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class TeamDetailSerializer(TeamSerializer):
    """Team with members"""
    members = TeamMemberSerializer(many=True, read_only=True)
    
    class Meta(TeamSerializer.Meta):
        fields = TeamSerializer.Meta.fields + ['members']

