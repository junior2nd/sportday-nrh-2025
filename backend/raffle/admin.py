from django.contrib import admin
from .models import RaffleEvent, Prize, RaffleParticipant, RaffleLog


@admin.register(RaffleEvent)
class RaffleEventAdmin(admin.ModelAdmin):
    list_display = ['name', 'event', 'org', 'created_at']
    list_filter = ['org', 'event', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Prize)
class PrizeAdmin(admin.ModelAdmin):
    list_display = ['name', 'raffle_event', 'round_number', 'quantity', 'created_at']
    list_filter = ['raffle_event', 'round_number', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RaffleParticipant)
class RaffleParticipantAdmin(admin.ModelAdmin):
    list_display = ['participant', 'prize', 'selected_at']
    list_filter = ['prize', 'selected_at']
    search_fields = ['participant__name']
    readonly_fields = ['selected_at']


@admin.register(RaffleLog)
class RaffleLogAdmin(admin.ModelAdmin):
    list_display = ['raffle_event', 'prize', 'timestamp']
    list_filter = ['raffle_event', 'prize', 'timestamp']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'

