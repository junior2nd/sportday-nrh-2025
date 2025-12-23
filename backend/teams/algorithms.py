import random
from typing import List, Dict, Any
from .models import Participant, Team, TeamMember
from core.models import Department


class TeamAssignmentAlgorithm:
    """Base class for team assignment algorithms"""
    
    def __init__(self, participants: List[Participant], teams: List[Team]):
        self.participants = participants
        self.teams = teams
    
    def assign(self) -> List[Dict[str, Any]]:
        """Assign participants to teams. Returns list of assignments"""
        raise NotImplementedError


class RandomAssignment(TeamAssignmentAlgorithm):
    """Random assignment algorithm"""
    
    def assign(self) -> List[Dict[str, Any]]:
        """Randomly assign participants to teams"""
        assignments = []
        participants_list = list(self.participants)
        random.shuffle(participants_list)
        
        team_index = 0
        for participant in participants_list:
            team = self.teams[team_index % len(self.teams)]
            assignments.append({
                'participant': participant,
                'team': team
            })
            team_index += 1
        
        return assignments


class BalancedByDepartmentAssignment(TeamAssignmentAlgorithm):
    """Balanced assignment by department"""
    
    def assign(self) -> List[Dict[str, Any]]:
        """Assign participants to teams, balancing by department"""
        assignments = []
        
        # Group participants by department
        by_department = {}
        no_department = []
        
        for participant in self.participants:
            if participant.department_id:
                dept_id = participant.department_id
                if dept_id not in by_department:
                    by_department[dept_id] = []
                by_department[dept_id].append(participant)
            else:
                no_department.append(participant)
        
        # Distribute each department across teams
        team_index = 0
        for dept_id, dept_participants in by_department.items():
            random.shuffle(dept_participants)
            for participant in dept_participants:
                team = self.teams[team_index % len(self.teams)]
                assignments.append({
                    'participant': participant,
                    'team': team
                })
                team_index += 1
        
        # Distribute participants without department
        random.shuffle(no_department)
        for participant in no_department:
            team = self.teams[team_index % len(self.teams)]
            assignments.append({
                'participant': participant,
                'team': team
            })
            team_index += 1
        
        return assignments


class RuleBasedAssignment(TeamAssignmentAlgorithm):
    """Rule-based assignment"""
    
    def __init__(self, participants: List[Participant], teams: List[Team], rules: Dict[str, Any]):
        super().__init__(participants, teams)
        self.rules = rules
    
    def assign(self) -> List[Dict[str, Any]]:
        """Assign participants to teams based on rules"""
        assignments = []
        
        # Rule: no_same_department_in_team
        if self.rules.get('no_same_department_in_team', False):
            # Group by department
            by_department = {}
            no_department = []
            
            for participant in self.participants:
                if participant.department_id:
                    dept_id = participant.department_id
                    if dept_id not in by_department:
                        by_department[dept_id] = []
                    by_department[dept_id].append(participant)
                else:
                    no_department.append(participant)
            
            # Distribute ensuring no same department in same team
            team_assignments = {team.id: [] for team in self.teams}
            team_index = 0
            
            # Distribute each department member to different teams
            for dept_id, dept_participants in by_department.items():
                random.shuffle(dept_participants)
                for i, participant in enumerate(dept_participants):
                    team = self.teams[i % len(self.teams)]
                    team_assignments[team.id].append(participant)
            
            # Distribute participants without department
            random.shuffle(no_department)
            for participant in no_department:
                # Find team with least members
                team_id = min(team_assignments.keys(), key=lambda tid: len(team_assignments[tid]))
                team_assignments[team_id].append(participant)
            
            # Convert to assignment list
            for team_id, participants_list in team_assignments.items():
                team = next(t for t in self.teams if t.id == team_id)
                for participant in participants_list:
                    assignments.append({
                        'participant': participant,
                        'team': team
                    })
        else:
            # Fallback to random if no specific rule
            random_alg = RandomAssignment(self.participants, self.teams)
            assignments = random_alg.assign()
        
        return assignments

