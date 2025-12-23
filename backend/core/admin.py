from django.contrib import admin
from .models import Organization, Department, Event, ModuleRegistry, AuditLog, LoginPageSettings


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'org', 'is_active', 'created_at']
    list_filter = ['org', 'is_active', 'created_at']
    search_fields = ['name', 'code']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['name', 'org', 'start_date', 'end_date', 'status', 'created_at']
    list_filter = ['org', 'status', 'start_date']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'start_date'


@admin.register(ModuleRegistry)
class ModuleRegistryAdmin(admin.ModelAdmin):
    list_display = ['module', 'org', 'is_enabled', 'created_at']
    list_filter = ['module', 'is_enabled', 'org']
    search_fields = ['module']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'model', 'user', 'org', 'timestamp']
    list_filter = ['action', 'model', 'org', 'timestamp']
    search_fields = ['model', 'user__username']
    readonly_fields = ['org', 'user', 'action', 'model', 'object_id', 'changes', 'ip_address', 'user_agent', 'timestamp']
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(LoginPageSettings)
class LoginPageSettingsAdmin(admin.ModelAdmin):
    list_display = ['org', 'title', 'show_logo', 'is_active', 'created_at']
    list_filter = ['is_active', 'org', 'created_at']
    search_fields = ['title', 'subtitle']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('ข้อมูลพื้นฐาน', {
            'fields': ('org', 'is_active')
        }),
        ('Background Image', {
            'fields': ('background_image', 'overlay_opacity')
        }),
        ('Logo', {
            'fields': ('show_logo', 'logo_text', 'logo_image')
        }),
        ('ข้อความ', {
            'fields': ('title', 'subtitle')
        }),
        ('ข้อมูลระบบ', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

