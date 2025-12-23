from typing import List, Dict, Any
from .models import Tournament, Match, MatchTeam
from teams.models import Team


class TournamentGenerator:
    """Base class for tournament generation"""
    
    def __init__(self, tournament: Tournament, teams: List[Team]):
        self.tournament = tournament
        self.teams = teams
    
    def generate(self) -> List[Match]:
        """Generate matches for tournament"""
        raise NotImplementedError


class RoundRobinGenerator(TournamentGenerator):
    """Round Robin tournament generator"""
    
    def generate(self) -> List[Match]:
        """Generate round robin matches"""
        matches = []
        teams_list = list(self.teams)
        num_teams = len(teams_list)
        
        if num_teams < 2:
            return matches
        
        # Round robin: each team plays every other team
        round_number = 1
        match_number = 1
        
        for i in range(num_teams - 1):
            for j in range(i + 1, num_teams):
                match = Match.objects.create(
                    tournament=self.tournament,
                    round_number=round_number,
                    match_number=match_number,
                    status='scheduled'
                )
                
                # Create MatchTeam for each team
                MatchTeam.objects.create(match=match, team=teams_list[i])
                MatchTeam.objects.create(match=match, team=teams_list[j])
                
                matches.append(match)
                match_number += 1
            
            round_number += 1
        
        return matches


class SingleEliminationGenerator(TournamentGenerator):
    """Single Elimination tournament generator"""
    
    def generate(self) -> List[Match]:
        """Generate single elimination matches"""
        matches = []
        teams_list = list(self.teams)
        num_teams = len(teams_list)
        
        if num_teams < 2:
            return matches
        
        # Calculate number of rounds needed
        import math
        num_rounds = math.ceil(math.log2(num_teams))
        
        # First round: pair up teams
        round_number = 1
        match_number = 1
        current_teams = teams_list.copy()
        
        # If odd number of teams, one team gets a bye
        if num_teams % 2 == 1:
            # Add a bye team (will be handled in match result)
            pass
        
        # Generate first round matches
        for i in range(0, len(current_teams) - 1, 2):
            match = Match.objects.create(
                tournament=self.tournament,
                round_number=round_number,
                match_number=match_number,
                status='scheduled'
            )
            
            MatchTeam.objects.create(match=match, team=current_teams[i])
            if i + 1 < len(current_teams):
                MatchTeam.objects.create(match=match, team=current_teams[i + 1])
            
            matches.append(match)
            match_number += 1
        
        # Generate subsequent rounds (will be created when previous round completes)
        # This is a simplified version - in production, you'd create matches dynamically
        
        return matches

