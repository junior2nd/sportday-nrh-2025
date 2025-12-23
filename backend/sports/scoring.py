from typing import Dict, Any, List, Optional
from .models import Match, MatchTeam, SportType


class ScoreCalculator:
    """Base class for score calculation"""
    
    def __init__(self, sport_type: SportType):
        self.sport_type = sport_type
        self.config = sport_type.template_config
    
    def calculate(self, match: Match) -> Dict[str, Any]:
        """Calculate match result"""
        raise NotImplementedError


class NumericScoreCalculator(ScoreCalculator):
    """Numeric score calculator (e.g., basketball, football)"""
    
    def calculate(self, match: Match) -> Dict[str, Any]:
        """Calculate result based on numeric scores"""
        match_teams = match.match_teams.all()
        
        if len(match_teams) < 2:
            return {'error': 'Not enough teams in match'}
        
        scores = {}
        for match_team in match_teams:
            score_value = match_team.score.get('value', 0)
            scores[match_team.team_id] = {
                'team_id': match_team.team_id,
                'team_name': match_team.team.color_name,
                'score': score_value
            }
        
        # Determine winner
        sorted_scores = sorted(scores.items(), key=lambda x: x[1]['score'], reverse=True)
        
        if sorted_scores[0][1]['score'] > sorted_scores[1][1]['score']:
            winner_id = sorted_scores[0][0]
            result = {
                'winner': winner_id,
                'winner_name': scores[winner_id]['team_name'],
                'scores': scores,
                'is_draw': False
            }
        elif sorted_scores[0][1]['score'] == sorted_scores[1][1]['score']:
            result = {
                'winner': None,
                'scores': scores,
                'is_draw': True
            }
        else:
            winner_id = sorted_scores[0][0]
            result = {
                'winner': winner_id,
                'winner_name': scores[winner_id]['team_name'],
                'scores': scores,
                'is_draw': False
            }
        
        return result


class SetBasedScoreCalculator(ScoreCalculator):
    """Set-based score calculator (e.g., volleyball, tennis)"""
    
    def calculate(self, match: Match) -> Dict[str, Any]:
        """Calculate result based on sets won"""
        match_teams = match.match_teams.all()
        
        if len(match_teams) < 2:
            return {'error': 'Not enough teams in match'}
        
        sets_won = {}
        total_sets = self.config.get('sets_to_win', 3)
        
        for match_team in match_teams:
            sets = match_team.score.get('sets', [])
            sets_won_count = sum(1 for s in sets if s.get('won', False))
            sets_won[match_team.team_id] = {
                'team_id': match_team.team_id,
                'team_name': match_team.team.color_name,
                'sets_won': sets_won_count,
                'sets': sets
            }
        
        # Determine winner
        sorted_sets = sorted(sets_won.items(), key=lambda x: x[1]['sets_won'], reverse=True)
        
        if sorted_sets[0][1]['sets_won'] >= total_sets:
            winner_id = sorted_sets[0][0]
            result = {
                'winner': winner_id,
                'winner_name': sets_won[winner_id]['team_name'],
                'sets_won': sets_won,
                'is_draw': False
            }
        else:
            result = {
                'winner': None,
                'sets_won': sets_won,
                'is_draw': True,
                'message': 'Match not completed'
            }
        
        return result


class TimeBasedScoreCalculator(ScoreCalculator):
    """Time-based score calculator (e.g., racing, swimming)"""
    
    def calculate(self, match: Match) -> Dict[str, Any]:
        """Calculate result based on time"""
        match_teams = match.match_teams.all()
        
        if len(match_teams) < 2:
            return {'error': 'Not enough teams in match'}
        
        times = {}
        for match_team in match_teams:
            time_value = match_team.score.get('time', None)  # in seconds
            times[match_team.team_id] = {
                'team_id': match_team.team_id,
                'team_name': match_team.team.color_name,
                'time': time_value
            }
        
        # Determine winner (lowest time wins)
        sorted_times = sorted(
            [t for t in times.items() if t[1]['time'] is not None],
            key=lambda x: x[1]['time']
        )
        
        if sorted_times:
            winner_id = sorted_times[0][0]
            result = {
                'winner': winner_id,
                'winner_name': times[winner_id]['team_name'],
                'times': times,
                'is_draw': False
            }
        else:
            result = {
                'winner': None,
                'times': times,
                'is_draw': True,
                'message': 'No times recorded'
            }
        
        return result


def get_score_calculator(sport_type: SportType) -> ScoreCalculator:
    """Factory function to get appropriate score calculator"""
    scoring_type = sport_type.template_config.get('scoring_type', 'numeric')
    
    if scoring_type == 'numeric':
        return NumericScoreCalculator(sport_type)
    elif scoring_type == 'set-based':
        return SetBasedScoreCalculator(sport_type)
    elif scoring_type == 'time-based':
        return TimeBasedScoreCalculator(sport_type)
    else:
        return NumericScoreCalculator(sport_type)  # Default

