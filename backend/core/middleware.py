from django.utils.deprecation import MiddlewareMixin
from core.models import ModuleRegistry
from django.conf import settings


class OrgContextMiddleware(MiddlewareMixin):
    """
    Middleware สำหรับจัดการ org context
    - อ่าน org_id จาก header หรือ query parameter
    - ตั้งค่า request.org_id สำหรับใช้ใน views
    """
    
    def process_request(self, request):
        # ตั้งค่า org_id จาก header หรือ query parameter
        org_id = None
        
        # ตรวจสอบจาก header
        org_id_header = request.headers.get('X-Org-ID')
        if org_id_header:
            try:
                org_id = int(org_id_header)
            except (ValueError, TypeError):
                pass
        
        # ตรวจสอบจาก query parameter
        if not org_id:
            org_id_param = request.GET.get('org_id')
            if org_id_param:
                try:
                    org_id = int(org_id_param)
                except (ValueError, TypeError):
                    pass
        
        # ถ้า user มี org ให้ใช้ org ของ user
        if not org_id and hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.org_id:
                org_id = request.user.org_id
        
        # ตั้งค่าใน request
        request.org_id = org_id
        
        return None


class ModuleAccessMiddleware(MiddlewareMixin):
    """
    Middleware สำหรับตรวจสอบว่า module เปิดใช้งานหรือไม่
    """
    
    def process_request(self, request):
        # ตรวจสอบเฉพาะ API requests
        if not request.path.startswith('/api/'):
            return None
        
        # ตรวจสอบว่าเป็น module endpoint หรือไม่
        path_parts = request.path.strip('/').split('/')
        if len(path_parts) >= 3 and path_parts[0] == 'api':
            module_name = path_parts[1]  # teams, raffle, sports
            
            # Core endpoints ไม่ต้องตรวจสอบ
            if module_name in ['auth', 'core', 'dashboard']:
                return None
            
            # ตรวจสอบว่า module เปิดใช้งานหรือไม่
            org_id = getattr(request, 'org_id', None)
            
            # ตรวจสอบ global module
            global_module = ModuleRegistry.objects.filter(
                module=module_name,
                org__isnull=True,
                is_enabled=True
            ).exists()
            
            # ถ้ายังไม่มี global module record ให้อนุญาต (จะตรวจสอบใน view level แทน)
            # หรือถ้าอยู่ใน DEBUG mode ให้อนุญาต
            if not global_module:
                # ถ้ายังไม่มี ModuleRegistry record ให้อนุญาต
                # (จะตรวจสอบใน view level แทน)
                # หรือถ้าอยู่ใน DEBUG mode ให้อนุญาต
                if settings.DEBUG:
                    return None
                
                # ตรวจสอบว่ามี ModuleRegistry record หรือไม่ (แม้จะ is_enabled=False)
                has_module_record = ModuleRegistry.objects.filter(
                    module=module_name,
                    org__isnull=True
                ).exists()
                
                # ถ้ายังไม่มี record เลย ให้อนุญาต (จะตรวจสอบใน view level แทน)
                if not has_module_record:
                    return None
                
                # ถ้ามี record แต่ is_enabled=False ให้ return 403
                from django.http import JsonResponse
                return JsonResponse({
                    'detail': f'Module {module_name} is not enabled globally'
                }, status=403)
            
            # ถ้ามี org_id ตรวจสอบ org-level
            if org_id:
                org_module = ModuleRegistry.objects.filter(
                    module=module_name,
                    org_id=org_id,
                    is_enabled=True
                ).exists()
                
                if not org_module:
                    # ตรวจสอบว่าเป็น global module หรือไม่
                    if not ModuleRegistry.objects.filter(
                        module=module_name,
                        org__isnull=True,
                        is_enabled=True
                    ).exists():
                        # ถ้าไม่มี global module และไม่มี org module ให้ return 403
                        # (การตรวจสอบ superadmin จะทำใน view level แทน)
                        from django.http import JsonResponse
                        return JsonResponse({
                            'detail': f'Module {module_name} is not enabled for this organization'
                        }, status=403)
        
        return None

