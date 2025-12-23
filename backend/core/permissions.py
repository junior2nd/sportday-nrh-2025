from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """
    Permission สำหรับ superadmin เท่านั้น
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and
            request.user.is_superadmin()
        )


class IsOrgAdmin(permissions.BasePermission):
    """
    Permission สำหรับ org_admin เท่านั้น
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_org_admin()


class IsOrgAdminOrReadOnly(permissions.BasePermission):
    """
    Permission ที่อนุญาตให้ org_admin แก้ไขได้ แต่ user อื่นอ่านได้
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Superadmin can do everything
        if request.user.is_superadmin():
            return True
        
        # Org admin can manage their org
        return request.user.is_org_admin()


class IsOrgMemberOrReadOnly(permissions.BasePermission):
    """
    Permission ที่อนุญาตให้สมาชิกใน org ดูได้ แต่แก้ไขได้เฉพาะ org_admin
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Superadmin can do everything
        if request.user.is_superadmin():
            return True
        
        # Org admin can manage
        return request.user.is_org_admin()


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Permission ที่อนุญาตให้ staff แก้ไขได้ แต่ viewer อ่านได้เท่านั้น
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Superadmin and org_admin can do everything
        if request.user.is_superadmin() or request.user.is_org_admin():
            return True
        
        # Staff can edit
        return request.user.role == 'staff'


class IsJudgeOrReadOnly(permissions.BasePermission):
    """
    Permission สำหรับกรรมการ (viewer) ให้ลงคะแนนได้
    - viewer (กรรมการ) ลงคะแนนได้เฉพาะ sports module
    - staff และ org_admin ดูและจัดการได้
    - superadmin ทำได้ทุกอย่าง
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Superadmin and org_admin can do everything
        if request.user.is_superadmin() or request.user.is_org_admin():
            return True
        
        # Staff can edit
        if request.user.role == 'staff':
            return True
        
        # Viewer (กรรมการ) can only update scores via update_score action
        if request.user.role == 'viewer':
            # อนุญาตเฉพาะ action update_score
            if hasattr(view, 'action') and view.action == 'update_score':
                return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        """Check object-level permission"""
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Superadmin and org_admin can do everything
        if request.user.is_superadmin() or request.user.is_org_admin():
            return True
        
        # Staff can edit
        if request.user.role == 'staff':
            return True
        
        # Viewer (กรรมการ) can only update scores
        if request.user.role == 'viewer':
            if hasattr(view, 'action') and view.action == 'update_score':
                return True
        
        return False


class IsRaffleOperator(permissions.BasePermission):
    """
    Permission สำหรับผู้ที่สามารถดำเนินการจับสลากได้
    - org_admin และ staff สามารถ spin และ save winners ได้
    - superadmin ทำได้ทุกอย่าง
    """
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Superadmin can do everything
        if request.user.is_superadmin():
            return True
        
        # Org admin and staff can operate raffle
        return request.user.is_org_admin() or request.user.role == 'staff'

