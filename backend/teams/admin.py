from django.contrib import admin
from .models import Participant, Team, TeamMember


@admin.register(Participant)
class ParticipantAdmin(admin.ModelAdmin):
    list_display = ['name', 'event', 'department', 'org', 'created_at']
    list_filter = ['org', 'event', 'department', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['color_name', 'event', 'org', 'max_members', 'created_at']
    list_filter = ['org', 'event', 'created_at']
    search_fields = ['color_name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ['participant', 'team', 'is_pinned', 'is_moved', 'created_at']
    list_filter = ['team', 'is_pinned', 'is_moved', 'created_at']
    search_fields = ['participant__name']
    readonly_fields = ['created_at', 'updated_at']

