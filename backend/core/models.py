from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
import json


class Organization(models.Model):
    """หน่วยงาน"""
    name = models.CharField(max_length=200, verbose_name="ชื่อหน่วยงาน")
    code = models.CharField(
        max_length=50,
        unique=True,
        validators=[RegexValidator(regex=r'^[a-zA-Z0-9_-]+$', message='Code must be alphanumeric with - or _')],
        verbose_name="รหัสหน่วยงาน"
    )
    is_active = models.BooleanField(default=True, verbose_name="เปิดใช้งาน")
    settings = models.JSONField(default=dict, blank=True, verbose_name="ตั้งค่าเพิ่มเติม")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "หน่วยงาน"
        verbose_name_plural = "หน่วยงาน"
        ordering = ['name']

    def __str__(self):
        return self.name


class Department(models.Model):
    """แผนก"""
    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='departments',
        verbose_name="หน่วยงาน"
    )
    name = models.CharField(max_length=200, verbose_name="ชื่อแผนก")
    code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        validators=[RegexValidator(regex=r'^[a-zA-Z0-9_-]+$', message='Code must be alphanumeric with - or _')],
        verbose_name="รหัสแผนก"
    )
    is_active = models.BooleanField(default=True, verbose_name="เปิดใช้งาน")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "แผนก"
        verbose_name_plural = "แผนก"
        # Note: unique_together with nullable code - multiple NULLs are allowed
        # We handle uniqueness validation in serializer for non-null codes
        unique_together = [['org', 'code']]
        ordering = ['name']
        constraints = [
            # Add database constraint that allows multiple NULLs
            # This is handled by Django's unique_together, but MySQL treats NULLs specially
        ]

    def __str__(self):
        return f"{self.org.name} - {self.name}"


class Event(models.Model):
    """กิจกรรม"""
    STATUS_CHOICES = [
        ('draft', 'ร่าง'),
        ('active', 'กำลังดำเนินการ'),
        ('completed', 'เสร็จสิ้น'),
        ('cancelled', 'ยกเลิก'),
    ]

    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name="หน่วยงาน"
    )
    name = models.CharField(max_length=200, verbose_name="ชื่อกิจกรรม")
    description = models.TextField(blank=True, verbose_name="รายละเอียด")
    start_date = models.DateTimeField(verbose_name="วันที่เริ่ม")
    end_date = models.DateTimeField(verbose_name="วันที่สิ้นสุด")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name="สถานะ"
    )
    settings = models.JSONField(default=dict, blank=True, verbose_name="ตั้งค่าเพิ่มเติม")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "กิจกรรม"
        verbose_name_plural = "กิจกรรม"
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.org.name} - {self.name}"


class ModuleRegistry(models.Model):
    """Module Registry - เปิด-ปิด module ระดับ global และ org"""
    MODULE_CHOICES = [
        ('teams', 'Color Team Management'),
        ('raffle', 'Raffle System'),
        ('sports', 'Sports Day System'),
    ]

    module = models.CharField(max_length=50, choices=MODULE_CHOICES, verbose_name="Module")
    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='module_registries',
        null=True,
        blank=True,
        verbose_name="หน่วยงาน (null = global)"
    )
    is_enabled = models.BooleanField(default=True, verbose_name="เปิดใช้งาน")
    settings = models.JSONField(default=dict, blank=True, verbose_name="ตั้งค่าเพิ่มเติม")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Module Registry"
        verbose_name_plural = "Module Registries"
        unique_together = [['module', 'org']]
        ordering = ['module', 'org']

    def __str__(self):
        if self.org:
            return f"{self.get_module_display()} - {self.org.name}"
        return f"{self.get_module_display()} (Global)"


class AuditLog(models.Model):
    """Audit Log - บันทึกการทำงาน"""
    ACTION_CHOICES = [
        ('create', 'สร้าง'),
        ('update', 'แก้ไข'),
        ('delete', 'ลบ'),
        ('view', 'ดู'),
        ('import', 'นำเข้า'),
        ('export', 'ส่งออก'),
        ('login', 'เข้าสู่ระบบ'),
        ('logout', 'ออกจากระบบ'),
    ]

    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='audit_logs',
        null=True,
        blank=True,
        verbose_name="หน่วยงาน"
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name="ผู้ใช้"
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name="การกระทำ")
    model = models.CharField(max_length=100, verbose_name="Model")
    object_id = models.PositiveIntegerField(null=True, blank=True, verbose_name="Object ID")
    changes = models.JSONField(default=dict, blank=True, verbose_name="การเปลี่ยนแปลง")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP Address")
    user_agent = models.TextField(blank=True, verbose_name="User Agent")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="เวลา")

    class Meta:
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['org', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['model', 'object_id']),
        ]

    def __str__(self):
        return f"{self.get_action_display()} - {self.model} - {self.timestamp}"


class LoginPageSettings(models.Model):
    """ตั้งค่าหน้า Login - แก้ไขได้จาก Django Admin"""
    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='login_settings',
        null=True,
        blank=True,
        verbose_name="หน่วยงาน (null = global)"
    )
    
    # Background Image
    background_image = models.CharField(
        max_length=500,
        blank=True,
        default='/images/login-bg.png',
        verbose_name="Background Image Path",
        help_text="Path to background image (e.g., /images/login-bg.png)"
    )
    
    # Logo Settings
    show_logo = models.BooleanField(
        default=True,
        verbose_name="แสดง Logo"
    )
    logo_text = models.CharField(
        max_length=10,
        blank=True,
        default='N',
        verbose_name="Logo Text",
        help_text="ตัวอักษรที่แสดงใน logo (ถ้าไม่มี logo image)"
    )
    logo_image = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="Logo Image Path",
        help_text="Path to logo image (ถ้ามี, จะใช้แทน logo text)"
    )
    
    # Title and Subtitle
    title = models.CharField(
        max_length=200,
        default='NRSport',
        verbose_name="หัวข้อหลัก"
    )
    subtitle = models.CharField(
        max_length=500,
        default='ระบบกลางสำหรับจัดกิจกรรมหน่วยงาน',
        verbose_name="คำอธิบาย"
    )
    
    # Overlay Settings
    overlay_opacity = models.FloatField(
        default=0.5,
        verbose_name="Overlay Opacity",
        help_text="ความเข้มของ overlay (0.0 - 1.0)"
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name="เปิดใช้งาน"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ตั้งค่าหน้า Login"
        verbose_name_plural = "ตั้งค่าหน้า Login"
        unique_together = [['org']]
        ordering = ['org', '-created_at']

    def __str__(self):
        if self.org:
            return f"Login Settings - {self.org.name}"
        return "Login Settings (Global)"

