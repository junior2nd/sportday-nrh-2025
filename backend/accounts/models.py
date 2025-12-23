from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from core.models import Organization


class UserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('Username is required')
        
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')

        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractUser):
    """User Model with role and organization"""
    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('org_admin', 'Organization Admin'),
        ('staff', 'Staff'),
        ('viewer', 'Viewer'),
    ]

    email = models.EmailField(unique=True, blank=True, null=True)
    org = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name="หน่วยงาน"
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='viewer',
        verbose_name="บทบาท"
    )
    objects = UserManager()
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        
    def __str__(self):
        return self.username
    
    def has_admin_access(self):
        """ตรวจสอบว่าใช่ Admin หรือไม่"""
        return self.is_staff and self.is_superuser
    
    def is_superadmin(self):
        """ตรวจสอบว่าใช่ Super Admin หรือไม่"""
        return self.role == 'superadmin' or (self.is_staff and self.is_superuser)
    
    def is_org_admin(self):
        """ตรวจสอบว่าใช่ Organization Admin หรือไม่"""
        return self.role == 'org_admin'
    
    def can_manage_org(self, org_id):
        """ตรวจสอบว่าสามารถจัดการ org นี้ได้หรือไม่"""
        if self.is_superadmin():
            return True
        if self.is_org_admin() and self.org_id == org_id:
            return True
        return False


class Profile(models.Model):
    """Profile Model แยกจาก User"""
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    
    # ข้อมูลส่วนตัว
    first_name = models.CharField(max_length=100, blank=True, verbose_name="ชื่อ")
    last_name = models.CharField(max_length=100, blank=True, verbose_name="นามสกุล")
    phone = models.CharField(max_length=20, blank=True, verbose_name="เบอร์โทร")
    address = models.TextField(blank=True, verbose_name="ที่อยู่")
    date_of_birth = models.DateField(null=True, blank=True, verbose_name="วันเกิด")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name="รูปโปรไฟล์")
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Profile'
        verbose_name_plural = 'Profiles'
    
    def __str__(self):
        return f"Profile of {self.user.username}"


# Signal เพื่อสร้าง Profile อัตโนมัติเมื่อสร้าง User
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

