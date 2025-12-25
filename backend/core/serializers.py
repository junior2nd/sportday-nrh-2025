from rest_framework import serializers
from .models import Organization, Department, Event, ModuleRegistry, AuditLog, LoginPageSettings


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'code', 'is_active', 'settings', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class DepartmentSerializer(serializers.ModelSerializer):
    org_name = serializers.CharField(source='org.name', read_only=True)
    
    class Meta:
        model = Department
        fields = ['id', 'org', 'org_name', 'name', 'code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'code': {'required': False, 'allow_blank': True, 'allow_null': True},
        }
    
    def validate_code(self, value):
        """Validate code format if provided"""
        # Handle None, empty string, or whitespace-only strings
        # If value is not provided (None) or empty string, return None
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        
        # Validate format if value is provided
        if isinstance(value, str):
            value = value.strip()
            import re
            if not re.match(r'^[a-zA-Z0-9_-]+$', value):
                raise serializers.ValidationError('รหัสหน่วยงานต้องเป็นตัวอักษร ตัวเลข หรือเครื่องหมาย - และ _ เท่านั้น')
            return value
        
        return value
    
    def validate(self, attrs):
        """Custom validation for unique_together with nullable code"""
        org = attrs.get('org') or (self.instance.org if self.instance else None)
        code = attrs.get('code')
        
        # Only validate uniqueness if code is provided and not None/empty
        if org and code:
            # Check for duplicate code within same org
            queryset = Department.objects.filter(org=org, code=code)
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError({
                    'code': 'รหัสหน่วยงานนี้มีอยู่ในหน่วยงานนี้แล้ว'
                })
        
        return attrs


class EventSerializer(serializers.ModelSerializer):
    org_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    def get_org_name(self, obj):
        return obj.org.name if obj.org else None
    
    class Meta:
        model = Event
        fields = [
            'id', 'org', 'org_name', 'name', 'description', 'start_date', 'end_date',
            'status', 'status_display', 'settings', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ModuleRegistrySerializer(serializers.ModelSerializer):
    org_name = serializers.CharField(source='org.name', read_only=True, allow_null=True)
    module_display = serializers.CharField(source='get_module_display', read_only=True)
    
    class Meta:
        model = ModuleRegistry
        fields = [
            'id', 'module', 'module_display', 'org', 'org_name', 'is_enabled',
            'settings', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    org_name = serializers.CharField(source='org.name', read_only=True, allow_null=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)


class LoginPageSettingsSerializer(serializers.ModelSerializer):
    org_name = serializers.CharField(source='org.name', read_only=True, allow_null=True)
    
    class Meta:
        model = LoginPageSettings
        fields = [
            'id', 'org', 'org_name', 'background_image', 'show_logo',
            'logo_text', 'logo_image', 'title', 'subtitle', 'overlay_opacity',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'org', 'org_name', 'user', 'user_username', 'action', 'action_display',
            'model', 'object_id', 'changes', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']

