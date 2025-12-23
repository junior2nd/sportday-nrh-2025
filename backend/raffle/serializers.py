from rest_framework import serializers
from .models import RaffleEvent, Prize, RaffleParticipant, RaffleLog
from teams.serializers import ParticipantSerializer


class RaffleEventSerializer(serializers.ModelSerializer):
    event_name = serializers.SerializerMethodField()
    org_name = serializers.SerializerMethodField()
    
    def get_event_name(self, obj):
        try:
            if hasattr(obj, 'event') and obj.event:
                return obj.event.name
            elif hasattr(obj, 'event_id') and obj.event_id:
                from core.models import Event
                try:
                    event = Event.objects.get(id=obj.event_id)
                    return event.name
                except Event.DoesNotExist:
                    return None
        except (AttributeError, Exception):
            pass
        return None
    
    def get_org_name(self, obj):
        try:
            if hasattr(obj, 'org') and obj.org:
                return obj.org.name
            elif hasattr(obj, 'org_id') and obj.org_id:
                from core.models import Organization
                try:
                    org = Organization.objects.get(id=obj.org_id)
                    return org.name
                except Organization.DoesNotExist:
                    return None
        except (AttributeError, Exception):
            pass
        return None
    
    class Meta:
        model = RaffleEvent
        fields = [
            'id', 'org', 'org_name', 'event', 'event_name', 'name', 'description',
            'rules', 'no_repeat_prize', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PrizeSerializer(serializers.ModelSerializer):
    raffle_event_name = serializers.SerializerMethodField()
    selected_count = serializers.IntegerField(read_only=True)
    
    def get_raffle_event_name(self, obj):
        try:
            if hasattr(obj, 'raffle_event') and obj.raffle_event:
                return obj.raffle_event.name
            elif hasattr(obj, 'raffle_event_id') and obj.raffle_event_id:
                from .models import RaffleEvent
                try:
                    raffle_event = RaffleEvent.objects.get(id=obj.raffle_event_id)
                    return raffle_event.name
                except RaffleEvent.DoesNotExist:
                    return None
        except (AttributeError, Exception):
            pass
        return None
    
    class Meta:
        model = Prize
        fields = [
            'id', 'raffle_event', 'raffle_event_name', 'round_number', 'name',
            'quantity', 'rules', 'selected_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'selected_count']


class RaffleParticipantSerializer(serializers.ModelSerializer):
    participant_name = serializers.CharField(source='participant.name', read_only=True)
    participant_department = serializers.CharField(source='participant.department.name', read_only=True, allow_null=True)
    prize_name = serializers.CharField(source='prize.name', read_only=True)
    prize_round = serializers.IntegerField(source='prize.round_number', read_only=True)
    
    class Meta:
        model = RaffleParticipant
        fields = [
            'id', 'prize', 'prize_name', 'prize_round', 'participant', 'participant_name',
            'participant_department', 'selected_at', 'seed_value'
        ]
        read_only_fields = ['selected_at']


class RaffleLogSerializer(serializers.ModelSerializer):
    raffle_event_name = serializers.CharField(source='raffle_event.name', read_only=True)
    prize_name = serializers.CharField(source='prize.name', read_only=True)
    
    class Meta:
        model = RaffleLog
        fields = [
            'id', 'raffle_event', 'raffle_event_name', 'prize', 'prize_name',
            'seed', 'rule_snapshot', 'result', 'timestamp'
        ]
        read_only_fields = ['timestamp']

