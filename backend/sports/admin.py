from django.contrib import admin
from .models import SportType, Tournament, Match, MatchTeam, MatchResult


@admin.register(SportType)
class SportTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'org', 'is_active', 'created_at']
    list_filter = ['org', 'is_active', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ['name', 'event', 'sport_type', 'format', 'status', 'created_at']
    list_filter = ['org', 'event', 'sport_type', 'format', 'status', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ['tournament', 'round_number', 'match_number', 'status', 'scheduled_at']
    list_filter = ['tournament', 'status', 'round_number', 'created_at']
    search_fields = ['tournament__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MatchTeam)
class MatchTeamAdmin(admin.ModelAdmin):
    list_display = ['match', 'team', 'result', 'created_at']
    list_filter = ['match__tournament', 'result', 'created_at']
    search_fields = ['team__color_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MatchResult)
class MatchResultAdmin(admin.ModelAdmin):
    list_display = ['match', 'recorded_at', 'recorded_by']
    list_filter = ['recorded_at']
    readonly_fields = ['recorded_at']

