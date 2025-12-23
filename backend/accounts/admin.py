from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'org', 'role', 'is_active', 'is_staff']
    list_filter = ['role', 'org', 'is_active', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('NRSport Info', {'fields': ('org', 'role')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('NRSport Info', {'fields': ('org', 'role')}),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'first_name', 'last_name', 'phone']
    search_fields = ['user__username', 'first_name', 'last_name', 'phone']

