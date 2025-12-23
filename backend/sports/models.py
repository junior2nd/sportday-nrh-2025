from django.db import models
from core.models import Organization, Event
from teams.models import Team


class SportType(models.Model):
    """ชนิดกีฬา (Template)"""
    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='sport_types',
        verbose_name="หน่วยงาน"
    )
    name = models.CharField(max_length=200, verbose_name="ชื่อกีฬา")
    template_config = models.JSONField(default=dict, verbose_name="Template Configuration")
    is_active = models.BooleanField(default=True, verbose_name="เปิดใช้งาน")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ชนิดกีฬา"
        verbose_name_plural = "ชนิดกีฬา"
        unique_together = [['org', 'name']]
        ordering = ['name']

    def __str__(self):
        return f"{self.org.name} - {self.name}"


class Tournament(models.Model):
    """การแข่งขัน"""
    FORMAT_CHOICES = [
        ('round_robin', 'Round Robin'),
        ('single_elimination', 'Single Elimination'),
        ('double_elimination', 'Double Elimination'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'ร่าง'),
        ('active', 'กำลังแข่งขัน'),
        ('completed', 'เสร็จสิ้น'),
        ('cancelled', 'ยกเลิก'),
    ]

    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='tournaments',
        verbose_name="หน่วยงาน"
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='tournaments',
        verbose_name="กิจกรรม"
    )
    sport_type = models.ForeignKey(
        SportType,
        on_delete=models.CASCADE,
        related_name='tournaments',
        verbose_name="ชนิดกีฬา"
    )
    name = models.CharField(max_length=200, verbose_name="ชื่อการแข่งขัน")
    format = models.CharField(max_length=50, choices=FORMAT_CHOICES, verbose_name="รูปแบบ")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name="สถานะ")
    settings = models.JSONField(default=dict, blank=True, verbose_name="ตั้งค่าเพิ่มเติม")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "การแข่งขัน"
        verbose_name_plural = "การแข่งขัน"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event.name} - {self.name}"


class Match(models.Model):
    """นัดแข่งขัน"""
    STATUS_CHOICES = [
        ('scheduled', 'กำหนดการ'),
        ('in_progress', 'กำลังแข่งขัน'),
        ('completed', 'เสร็จสิ้น'),
        ('cancelled', 'ยกเลิก'),
    ]

    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name='matches',
        verbose_name="การแข่งขัน"
    )
    round_number = models.PositiveIntegerField(verbose_name="รอบที่")
    match_number = models.PositiveIntegerField(verbose_name="นัดที่")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', verbose_name="สถานะ")
    scheduled_at = models.DateTimeField(null=True, blank=True, verbose_name="เวลาที่กำหนด")
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="เวลาเริ่ม")
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name="เวลาเสร็จ")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "นัดแข่งขัน"
        verbose_name_plural = "นัดแข่งขัน"
        unique_together = [['tournament', 'round_number', 'match_number']]
        ordering = ['round_number', 'match_number']

    def __str__(self):
        return f"{self.tournament.name} - รอบที่ {self.round_number} นัดที่ {self.match_number}"


class MatchTeam(models.Model):
    """ทีมในนัด"""
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='match_teams',
        verbose_name="นัด"
    )
    team = models.ForeignKey(
        Team,
        on_delete=models.CASCADE,
        related_name='match_participations',
        verbose_name="ทีม"
    )
    score = models.JSONField(default=dict, blank=True, verbose_name="คะแนน")
    result = models.CharField(max_length=50, blank=True, verbose_name="ผลการแข่งขัน")  # win, loss, draw
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ทีมในนัด"
        verbose_name_plural = "ทีมในนัด"
        unique_together = [['match', 'team']]
        ordering = ['created_at']

    def __str__(self):
        return f"{self.match} - {self.team.color_name}"


class MatchResult(models.Model):
    """ผลการแข่งขัน"""
    match = models.OneToOneField(
        Match,
        on_delete=models.CASCADE,
        related_name='result',
        verbose_name="นัด"
    )
    result_data = models.JSONField(default=dict, verbose_name="ข้อมูลผลการแข่งขัน")
    recorded_at = models.DateTimeField(auto_now_add=True, verbose_name="เวลาบันทึก")
    recorded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_match_results',
        verbose_name="บันทึกโดย"
    )

    class Meta:
        verbose_name = "ผลการแข่งขัน"
        verbose_name_plural = "ผลการแข่งขัน"
        ordering = ['-recorded_at']

    def __str__(self):
        return f"Result: {self.match}"

