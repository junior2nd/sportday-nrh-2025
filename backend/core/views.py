from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import Organization, Department, Event, ModuleRegistry, AuditLog, LoginPageSettings
from .serializers import (
    OrganizationSerializer, DepartmentSerializer, EventSerializer,
    ModuleRegistrySerializer, AuditLogSerializer, LoginPageSettingsSerializer
)
from .permissions import IsSuperAdmin, IsOrgAdminOrReadOnly, IsOrgMemberOrReadOnly
from .utils import ImportProcessor, create_audit_log
from rest_framework.permissions import IsAuthenticated


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSuperAdmin()]
        return [IsAuthenticated()]


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['org', 'is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    permission_classes = [IsAuthenticated, IsOrgAdminOrReadOnly]
    
    def get_queryset(self):
        # Filter by org_id from middleware context
        org_id = getattr(self.request, 'org_id', None)
        if org_id:
            return Department.objects.filter(org_id=org_id)
        # Superadmin can see all
        if self.request.user.is_superadmin():
            return Department.objects.all()
        return Department.objects.none()
    
    def perform_create(self, serializer):
        """Override to add audit log on create"""
        department = serializer.save()
        org = department.org
        
        # Create audit log in background - don't let it fail the request
        try:
            create_audit_log(
                user=self.request.user,
                org=org,
                action='create',
                model='Department',
                object_id=department.id,
                changes={'name': department.name, 'code': department.code},
                request=self.request
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'Failed to create audit log for Department {department.id}: {e}')
            # Don't re-raise - audit log failure shouldn't fail the create operation
    
    def perform_update(self, serializer):
        """Override to add audit log on update"""
        old_department = self.get_object()
        department = serializer.save()
        org = department.org
        
        changes = {}
        if old_department.name != department.name:
            changes['name'] = {'old': old_department.name, 'new': department.name}
        if old_department.code != department.code:
            changes['code'] = {'old': old_department.code, 'new': department.code}
        if old_department.is_active != department.is_active:
            changes['is_active'] = {'old': old_department.is_active, 'new': department.is_active}
        
        if changes:
            try:
                create_audit_log(
                    user=self.request.user,
                    org=org,
                    action='update',
                    model='Department',
                    object_id=department.id,
                    changes=changes,
                    request=self.request
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Failed to create audit log for Department {department.id}: {e}')
    
    def destroy(self, request, *args, **kwargs):
        """Override to handle delete with reason and audit log"""
        department = self.get_object()
        org = department.org
        
        # Get delete reason from request body
        reason = request.data.get('reason', '')
        if not reason or len(reason.strip()) < 10:
            return Response(
                {'detail': 'กรุณาระบุเหตุผลในการลบ (อย่างน้อย 10 ตัวอักษร)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store department data before deletion
        department_data = {
            'id': department.id,
            'name': department.name,
            'code': department.code,
            'org': department.org.name if department.org else None,
        }
        
        # Create audit log before deletion
        create_audit_log(
            user=request.user,
            org=org,
            action='delete',
            model='Department',
            object_id=department.id,
            changes={
                'deleted_item': department_data,
                'delete_reason': reason.strip(),
            },
            request=request
        )
        
        # Delete the department
        self.perform_destroy(department)
        
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['org', 'status']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-start_date']
    permission_classes = [IsAuthenticated, IsOrgAdminOrReadOnly]
    
    def get_queryset(self):
        # Filter by org_id from middleware context
        org_id = getattr(self.request, 'org_id', None)
        if org_id:
            return Event.objects.filter(org_id=org_id)
        # Superadmin can see all
        if self.request.user.is_superadmin():
            return Event.objects.all()
        return Event.objects.none()
    
    def perform_create(self, serializer):
        """Override to add audit log on create"""
        event = serializer.save()
        org_id = getattr(self.request, 'org_id', None)
        org = event.org if event.org else (Organization.objects.get(id=org_id) if org_id else None)
        
        create_audit_log(
            user=self.request.user,
            org=org,
            action='create',
            model='Event',
            object_id=event.id,
            changes={'name': event.name, 'status': event.status},
            request=self.request
        )
    
    def perform_update(self, serializer):
        """Override to add audit log on update"""
        old_event = self.get_object()
        event = serializer.save()
        org = event.org
        
        # Track changes
        changes = {}
        if old_event.name != event.name:
            changes['name'] = {'old': old_event.name, 'new': event.name}
        if old_event.status != event.status:
            changes['status'] = {'old': old_event.status, 'new': event.status}
        if old_event.start_date != event.start_date:
            changes['start_date'] = {'old': str(old_event.start_date), 'new': str(event.start_date)}
        if old_event.end_date != event.end_date:
            changes['end_date'] = {'old': str(old_event.end_date), 'new': str(event.end_date)}
        
        create_audit_log(
            user=self.request.user,
            org=org,
            action='update',
            model='Event',
            object_id=event.id,
            changes=changes,
            request=self.request
        )
    
    def destroy(self, request, *args, **kwargs):
        """Override to handle delete with reason and audit log"""
        event = self.get_object()
        org = event.org
        
        # Get delete reason from request body
        reason = request.data.get('reason', '')
        if not reason or len(reason.strip()) < 10:
            return Response(
                {'detail': 'กรุณาระบุเหตุผลในการลบ (อย่างน้อย 10 ตัวอักษร)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store event data before deletion
        event_data = {
            'id': event.id,
            'name': event.name,
            'org': event.org.name if event.org else None,
            'status': event.status,
            'start_date': str(event.start_date),
            'end_date': str(event.end_date),
        }
        
        # Create audit log before deletion
        create_audit_log(
            user=request.user,
            org=org,
            action='delete',
            model='Event',
            object_id=event.id,
            changes={
                'deleted_item': event_data,
                'delete_reason': reason.strip(),
            },
            request=request
        )
        
        # Delete the event
        self.perform_destroy(event)
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        """Update event status"""
        event = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'status': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = ['draft', 'active', 'completed', 'cancelled']
        if new_status not in valid_statuses:
            return Response(
                {'status': [f'Invalid status. Must be one of: {", ".join(valid_statuses)}']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = event.status
        event.status = new_status
        event.save()
        
        # Audit log
        create_audit_log(
            user=request.user,
            org=event.org,
            action='update',
            model='Event',
            object_id=event.id,
            changes={'status': {'old': old_status, 'new': new_status}},
            request=request
        )
        
        serializer = self.get_serializer(event)
        return Response(serializer.data)


class ModuleRegistryViewSet(viewsets.ModelViewSet):
    serializer_class = ModuleRegistrySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['module', 'org', 'is_enabled']
    search_fields = ['module']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Filter by org_id from middleware context
        org_id = getattr(self.request, 'org_id', None)
        if org_id:
            # Return both global and org-specific modules
            return ModuleRegistry.objects.filter(
                models.Q(org_id=org_id) | models.Q(org__isnull=True)
            )
        # Superadmin can see all
        if self.request.user.is_superadmin():
            return ModuleRegistry.objects.all()
        return ModuleRegistry.objects.none()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSuperAdmin()]
        return [IsAuthenticated()]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['org', 'user', 'action', 'model']
    search_fields = ['model', 'user__username']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    permission_classes = [IsAuthenticated, IsOrgMemberOrReadOnly]
    
    def get_queryset(self):
        # Filter by org_id from middleware context
        org_id = getattr(self.request, 'org_id', None)
        if org_id:
            return AuditLog.objects.filter(org_id=org_id)
        # Superadmin can see all
        if self.request.user.is_superadmin():
            return AuditLog.objects.all()
        return AuditLog.objects.none()


class ImportViewSet(viewsets.ViewSet):
    """ViewSet สำหรับจัดการ import ไฟล์"""
    permission_classes = [IsAuthenticated, IsOrgAdminOrReadOnly]
    
    @action(detail=False, methods=['post'], url_path='preview')
    def preview(self, request):
        """Preview ไฟล์ก่อน import"""
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        limit = int(request.data.get('limit', 10))
        
        processor = ImportProcessor(file)
        result = processor.preview(limit=limit)
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='validate-mapping')
    def validate_mapping(self, request):
        """Validate column mapping"""
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        column_mapping = request.data.get('column_mapping', {})
        
        if not column_mapping:
            return Response(
                {'error': 'column_mapping is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        processor = ImportProcessor(file)
        processor.read_file()
        result = processor.validate_mapping(column_mapping)
        
        return Response(result, status=status.HTTP_200_OK)


class LoginPageSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet สำหรับจัดการตั้งค่าหน้า Login"""
    serializer_class = LoginPageSettingsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Get settings for current org or global
        org_id = getattr(self.request, 'org_id', None)
        if org_id:
            # Try to get org-specific settings first, then global
            settings = LoginPageSettings.objects.filter(
                models.Q(org_id=org_id) | models.Q(org__isnull=True),
                is_active=True
            ).order_by('-org_id')  # Org-specific first
            return settings
        # Superadmin can see all
        if self.request.user.is_superadmin():
            return LoginPageSettings.objects.all()
        # Return global settings only
        return LoginPageSettings.objects.filter(org__isnull=True, is_active=True)
    
    def get_permissions(self):
        # Allow public access to 'current' action
        if self.action == 'current':
            return []
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsSuperAdmin()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'], url_path='current')
    def current(self, request):
        """Get current login page settings (public endpoint, no auth required)"""
        # Try to get org-specific settings if org_id is provided
        org_id = request.query_params.get('org_id')
        if org_id:
            try:
                settings = LoginPageSettings.objects.filter(
                    models.Q(org_id=org_id) | models.Q(org__isnull=True),
                    is_active=True
                ).order_by('-org_id').first()
                if settings:
                    serializer = self.get_serializer(settings)
                    return Response(serializer.data)
            except ValueError:
                pass
        
        # Get global settings
        settings = LoginPageSettings.objects.filter(org__isnull=True, is_active=True).first()
        if settings:
            serializer = self.get_serializer(settings)
            return Response(serializer.data)
        
        # Return default values if no settings found
        return Response({
            'background_image': '/images/login-bg.png',
            'show_logo': True,
            'logo_text': 'N',
            'logo_image': '',
            'title': 'NRSport',
            'subtitle': 'ระบบกลางสำหรับจัดกิจกรรมหน่วยงาน',
            'overlay_opacity': 0.5,
        })
