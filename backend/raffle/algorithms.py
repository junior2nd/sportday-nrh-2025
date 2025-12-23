import random
import hashlib
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from .models import Prize, RaffleParticipant, RaffleLog
from teams.models import Participant, Team


class RaffleSelector:
    """Class สำหรับจับสลาก"""
    
    def __init__(self, prize: Prize, rules: Dict[str, Any]):
        self.prize = prize
        self.rules = rules
        self.seed = self._generate_seed()
    
    def _generate_seed(self) -> str:
        """Generate seed value"""
        timestamp = datetime.now().isoformat()
        random_str = str(random.random())
        combined = f"{timestamp}_{random_str}_{self.prize.id}"
        return hashlib.sha256(combined.encode()).hexdigest()
    
    def get_eligible_participants(self) -> List[Participant]:
        """Get eligible participants based on rules"""
        raffle_event = self.prize.raffle_event
        event = raffle_event.event
        
        # Base queryset - all participants in the event
        participants = Participant.objects.filter(
            org_id=event.org_id,
            event_id=event.id,
            is_raffle_eligible=True  # Only participants with raffle eligibility
        )
        
        # Filter by team (if specified)
        if self.rules.get('filter_by_team'):
            team_ids = self.rules.get('team_ids', [])
            if team_ids:
                from teams.models import TeamMember
                participant_ids = TeamMember.objects.filter(
                    team_id__in=team_ids,
                    event_id=event.id  # Ensure team membership is for the correct event
                ).values_list('participant_id', flat=True)
                participants = participants.filter(id__in=participant_ids)
        
        # Filter by department (if specified)
        if self.rules.get('filter_by_department'):
            department_ids = self.rules.get('department_ids', [])
            if department_ids:
                participants = participants.filter(department_id__in=department_ids)
        
        return list(participants)
    
    def filter_excluded_participants(
        self,
        participants: List[Participant],
        exclude_participants: List[Participant]
    ) -> List[Participant]:
        """Filter out excluded participants"""
        exclude_ids = {p.id for p in exclude_participants}
        return [p for p in participants if p.id not in exclude_ids]
    
    def select(
        self,
        quantity: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Select winners
        Returns: {
            'winners': [Participant],
            'seed': str,
            'rule_snapshot': dict,
            'result': dict
        }
        """
        quantity = quantity or self.prize.quantity
        
        # Get eligible participants (already excludes opted-out)
        eligible = self.get_eligible_participants()
        
        # Exclude already selected if no_repeat_prize is enabled
        no_repeat = self.rules.get('no_repeat_prize', False) or self.prize.raffle_event.no_repeat_prize
        if no_repeat or self.rules.get('no_duplicate_participant', False):
            already_selected = RaffleParticipant.objects.filter(
                prize__raffle_event=self.prize.raffle_event
            ).values_list('participant_id', flat=True)
            eligible = [p for p in eligible if p.id not in already_selected]
        
        # Exclude by department (if rule says so)
        if self.rules.get('no_duplicate_department', False):
            already_selected_departments = RaffleParticipant.objects.filter(
                prize__raffle_event=self.prize.raffle_event
            ).values_list('participant__department_id', flat=True)
            already_selected_departments = set(already_selected_departments)
            
            # Filter out participants from already selected departments
            eligible = [
                p for p in eligible
                if not p.department_id or p.department_id not in already_selected_departments
            ]
        
        if len(eligible) < quantity:
            # Not enough eligible participants
            return {
                'success': False,
                'error': f'Not enough eligible participants. Required: {quantity}, Available: {len(eligible)}',
                'available_count': len(eligible)
            }
        
        # Set seed for reproducibility
        random.seed(self.seed)
        
        # Select winners
        selected = random.sample(eligible, quantity)
        
        # Create rule snapshot
        rule_snapshot = {
            'no_duplicate_participant': self.rules.get('no_duplicate_participant', False),
            'no_duplicate_department': self.rules.get('no_duplicate_department', False),
            'filter_by_team': self.rules.get('filter_by_team', False),
            'filter_by_department': self.rules.get('filter_by_department', False),
        }
        
        # Create result
        result = {
            'selected_count': len(selected),
            'eligible_count': len(eligible),
            'total_participants': Participant.objects.filter(
                org_id=self.prize.raffle_event.event.org_id,
                event_id=self.prize.raffle_event.event.id
            ).count()
        }
        
        return {
            'success': True,
            'winners': selected,
            'seed': self.seed,
            'rule_snapshot': rule_snapshot,
            'result': result
        }

