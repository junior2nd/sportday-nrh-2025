from django.db import models
from django.conf import settings
from core.models import Organization, Event
from teams.models import Participant, Team


class RaffleEvent(models.Model):
    """การจับสลาก"""
    org = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='raffle_events',
        verbose_name="หน่วยงาน"
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='raffle_events',
        verbose_name="กิจกรรม"
    )
    name = models.CharField(max_length=200, verbose_name="ชื่อการจับสลาก")
    description = models.TextField(blank=True, verbose_name="รายละเอียด")
    rules = models.JSONField(default=dict, blank=True, verbose_name="กติกา")
    no_repeat_prize = models.BooleanField(
        default=False,
        verbose_name="ไม่รับรางวัลซ้ำ",
        help_text="ถ้าเปิด ผู้ที่ได้รับรางวัลแล้วจะไม่ถูกเลือกอีก"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "การจับสลาก"
        verbose_name_plural = "การจับสลาก"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event.name} - {self.name}"


class Prize(models.Model):
    """ของรางวัล"""
    raffle_event = models.ForeignKey(
        RaffleEvent,
        on_delete=models.CASCADE,
        related_name='prizes',
        verbose_name="การจับสลาก"
    )
    round_number = models.PositiveIntegerField(verbose_name="รอบที่")
    name = models.CharField(max_length=200, verbose_name="ชื่อรางวัล")
    quantity = models.PositiveIntegerField(default=1, verbose_name="จำนวน")
    rules = models.JSONField(default=dict, blank=True, verbose_name="กติกา")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "ของรางวัล"
        verbose_name_plural = "ของรางวัล"
        ordering = ['round_number', 'name']
        unique_together = [['raffle_event', 'round_number', 'name']]

    @property
    def selected_count(self):
        """จำนวนผู้ได้รับรางวัล"""
        return self.selected_participants.count()

    def __str__(self):
        return f"{self.raffle_event.name} - รอบที่ {self.round_number}: {self.name}"


class RaffleParticipant(models.Model):
    """ผู้เข้าร่วมจับสลาก"""
    prize = models.ForeignKey(
        Prize,
        on_delete=models.CASCADE,
        related_name='selected_participants',
        verbose_name="รางวัล"
    )
    participant = models.ForeignKey(
        Participant,
        on_delete=models.CASCADE,
        related_name='raffle_selections',
        verbose_name="ผู้เข้าร่วม"
    )
    selected_at = models.DateTimeField(auto_now_add=True, verbose_name="เวลาที่ถูกเลือก")
    seed_value = models.CharField(max_length=100, blank=True, verbose_name="Seed value สำหรับตรวจสอบ")

    class Meta:
        verbose_name = "ผู้ถูกเลือก"
        verbose_name_plural = "ผู้ถูกเลือก"
        unique_together = [['prize', 'participant']]
        ordering = ['selected_at']

    def __str__(self):
        return f"{self.prize.name} - {self.participant.name}"


class RaffleLog(models.Model):
    """Log การจับสลาก"""
    raffle_event = models.ForeignKey(
        RaffleEvent,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name="การจับสลาก"
    )
    prize = models.ForeignKey(
        Prize,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name="รางวัล"
    )
    seed = models.CharField(max_length=100, verbose_name="Seed value")
    rule_snapshot = models.JSONField(default=dict, verbose_name="Snapshot ของกติกา")
    result = models.JSONField(default=dict, verbose_name="ผลการจับสลาก")
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name="เวลา")

    class Meta:
        verbose_name = "Raffle Log"
        verbose_name_plural = "Raffle Logs"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.raffle_event.name} - {self.prize.name} - {self.timestamp}"

