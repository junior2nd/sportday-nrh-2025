from django.db import models
from core.models import Organization, Event, Department


class Participant(models.Model):
    """ผู้เข้าร่วมกิจกรรม"""
    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='participants',
        verbose_name="หน่วยงาน"
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='participants',
        verbose_name="กิจกรรม"
    )
    name = models.CharField(max_length=200, verbose_name="ชื่อ")
    hospital_id = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="ID โรงพยาบาล",
        help_text="รหัสประจำตัวจากระบบโรงพยาบาล"
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='participants',
        verbose_name="หน่วยงาน"
    )
    is_raffle_eligible = models.BooleanField(
        default=True,
        verbose_name="มีสิทธิ์จับรางวัล",
        help_text="ถ้าเปิด หมายความว่ามีสิทธิ์จับรางวัล (ค่ามาตรฐาน: เปิด)"
    )
    metadata = models.JSONField(default=dict, blank=True, verbose_name="ข้อมูลเพิ่มเติม")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ผู้เข้าร่วม"
        verbose_name_plural = "ผู้เข้าร่วม"
        unique_together = [['org', 'event', 'name']]
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.event.name})"


class Team(models.Model):
    """ทีมสี"""
    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='teams',
        verbose_name="หน่วยงาน"
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='teams',
        verbose_name="กิจกรรม"
    )
    color_name = models.CharField(max_length=100, verbose_name="ชื่อสี")
    color_code = models.CharField(max_length=7, verbose_name="รหัสสี (HEX)", default="#000000")
    max_members = models.PositiveIntegerField(null=True, blank=True, verbose_name="จำนวนสมาชิกสูงสุด")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ทีม"
        verbose_name_plural = "ทีม"
        unique_together = [['org', 'event', 'color_name']]
        ordering = ['color_name']

    def __str__(self):
        return f"{self.event.name} - {self.color_name}"
    
    @property
    def member_count(self):
        """จำนวนสมาชิกในทีม"""
        return self.members.count()


class TeamMember(models.Model):
    """สมาชิกทีม"""
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name="ทีม"
    )
    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name='team_memberships',
        verbose_name="ผู้เข้าร่วม"
    )
    # Add event field to enforce: 1 คน = 1 ทีมต่อ Event
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='team_members',
        verbose_name="กิจกรรม",
        help_text="Event ที่ participant อยู่ในทีมนี้ (ต้องตรงกับ team.event)"
    )
    is_pinned = models.BooleanField(default=False, verbose_name="ล็อค (ไม่ให้ย้าย)")
    is_moved = models.BooleanField(default=False, verbose_name="ถูกย้าย")
    moved_from_team = models.ForeignKey(
        Team,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moved_members',
        verbose_name="ย้ายมาจากทีม"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "สมาชิกทีม"
        verbose_name_plural = "สมาชิกทีม"
        unique_together = [['team', 'participant']]
        # Enforce: 1 คน = 1 ทีมต่อ Event
        constraints = [
            models.UniqueConstraint(
                fields=['participant', 'event'],
                name='unique_participant_per_event'
            )
        ]
        ordering = ['created_at']
    
    def clean(self):
        """Validate that event matches team.event"""
        if self.team_id and self.event_id:
            if self.team.event_id != self.event_id:
                from django.core.exceptions import ValidationError
                raise ValidationError(f"Event {self.event_id} does not match team.event {self.team.event_id}")
    
    def save(self, *args, **kwargs):
        # Auto-set event from team if not provided
        if not self.event_id and self.team_id:
            self.event = self.team.event
        # Validate before saving
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.participant.name} - {self.team.color_name}"

