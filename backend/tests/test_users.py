"""
Test suite for user management API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import json
from datetime import datetime

from main import app
from utils.supabase_client import get_supabase_service

client = TestClient(app)


class TestUsersAPI:
    """Test user management API endpoints"""
    
    @pytest.fixture
    def mock_supabase_service(self):
        """Mock Supabase service for testing"""
        with patch('utils.supabase_client.get_supabase_service') as mock:
            service = Mock()
            mock.return_value = service
            yield service
    
    def test_get_user_profile_success(self, mock_supabase_service):
        """Test successful user profile retrieval"""
        mock_user = {
            'id': 'user123',
            'email': 'test@example.com',
            'full_name': 'John Doe',
            'avatar_url': 'https://example.com/avatar.jpg',
            'created_at': '2024-01-01T00:00:00Z',
            'last_seen': '2024-01-15T12:00:00Z',
            'is_active': True
        }
        
        mock_supabase_service.get_user.return_value = mock_user
        
        response = client.get("/users/profile/user123")
        
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 'user123'
        assert data['email'] == 'test@example.com'
        assert data['full_name'] == 'John Doe'
        assert data['avatar_url'] == 'https://example.com/avatar.jpg'
        assert data['is_active'] is True
    
    def test_get_user_profile_not_found(self, mock_supabase_service):
        """Test user profile not found"""
        mock_supabase_service.get_user.return_value = None
        
        response = client.get("/users/profile/nonexistent")
        
        assert response.status_code == 404
        data = response.json()
        assert "User not found" in data['detail']
    
    def test_update_user_profile_success(self, mock_supabase_service):
        """Test successful user profile update"""
        update_data = {
            'full_name': 'John Updated',
            'avatar_url': 'https://example.com/new-avatar.jpg'
        }
        
        updated_user = {
            'id': 'user123',
            'email': 'test@example.com',
            'full_name': 'John Updated',
            'avatar_url': 'https://example.com/new-avatar.jpg',
            'created_at': '2024-01-01T00:00:00Z',
            'last_seen': '2024-01-15T12:00:00Z',
            'is_active': True
        }
        
        mock_supabase_service.update_user.return_value = updated_user
        
        response = client.put("/users/profile/user123", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data['full_name'] == 'John Updated'
        assert data['avatar_url'] == 'https://example.com/new-avatar.jpg'
        mock_supabase_service.update_user.assert_called_once_with('user123', update_data)
    
    def test_get_user_preferences_success(self, mock_supabase_service):
        """Test successful user preferences retrieval"""
        mock_preferences = {
            'id': 'pref123',
            'user_id': 'user123',
            'theme': 'dark',
            'notifications_enabled': True,
            'email_notifications': False,
            'push_notifications': True,
            'default_zip': '10001',
            'avatar_preference': 'eco-emma',
            'language': 'en',
            'timezone': 'UTC',
            'units': 'metric',
            'privacy_level': 'standard'
        }
        
        mock_supabase_service.get_user_preferences.return_value = mock_preferences
        
        response = client.get("/users/preferences/user123")
        
        assert response.status_code == 200
        data = response.json()
        assert data['theme'] == 'dark'
        assert data['notifications_enabled'] is True
        assert data['email_notifications'] is False
        assert data['default_zip'] == '10001'
    
    def test_get_user_preferences_defaults(self, mock_supabase_service):
        """Test user preferences with default values when none exist"""
        mock_supabase_service.get_user_preferences.return_value = None
        
        response = client.get("/users/preferences/user123")
        
        assert response.status_code == 200
        data = response.json()
        assert data['theme'] == 'light'
        assert data['notifications_enabled'] is True
        assert data['email_notifications'] is True
        assert data['avatar_preference'] == 'eco-emma'
    
    def test_update_user_preferences_success(self, mock_supabase_service):
        """Test successful user preferences update"""
        preferences_data = {
            'theme': 'dark',
            'notifications_enabled': False,
            'default_zip': '90210',
            'avatar_preference': 'green-gary'
        }
        
        updated_preferences = {
            'id': 'pref123',
            'user_id': 'user123',
            'theme': 'dark',
            'notifications_enabled': False,
            'email_notifications': True,
            'push_notifications': True,
            'default_zip': '90210',
            'avatar_preference': 'green-gary',
            'language': 'en',
            'timezone': 'UTC',
            'units': 'metric',
            'privacy_level': 'standard'
        }
        
        mock_supabase_service.update_user_preferences.return_value = updated_preferences
        
        response = client.put("/users/preferences/user123", json=preferences_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data['theme'] == 'dark'
        assert data['notifications_enabled'] is False
        assert data['default_zip'] == '90210'
        assert data['avatar_preference'] == 'green-gary'
    
    def test_get_user_stats_success(self, mock_supabase_service):
        """Test successful user statistics retrieval"""
        mock_rank_data = {
            'user_id': 'user123',
            'total_items_sorted': 150,
            'total_co2_saved': 7.5,
            'total_points': 750,
            'rank_position': 5,
            'streak_days': 12
        }
        
        mock_achievements = [
            {
                'id': 1,
                'achievement_type': 'first_sort',
                'points': 10,
                'earned_at': '2024-01-01T00:00:00Z'
            },
            {
                'id': 2,
                'achievement_type': 'sorting_novice',
                'points': 50,
                'earned_at': '2024-01-05T00:00:00Z'
            }
        ]
        
        mock_supabase_service.get_user_rank.return_value = mock_rank_data
        mock_supabase_service.get_user_achievements.return_value = mock_achievements
        
        response = client.get("/users/stats/user123")
        
        assert response.status_code == 200
        data = response.json()
        assert data['total_items_sorted'] == 150
        assert data['total_co2_saved'] == 7.5
        assert data['total_points'] == 750
        assert data['rank_position'] == 5
        assert data['streak_days'] == 12
        assert data['achievement_count'] == 2
    
    def test_get_user_stats_no_data(self, mock_supabase_service):
        """Test user statistics when user has no data"""
        mock_supabase_service.get_user_rank.return_value = None
        mock_supabase_service.get_user_achievements.return_value = []
        
        response = client.get("/users/stats/user123")
        
        assert response.status_code == 200
        data = response.json()
        assert data['total_items_sorted'] == 0
        assert data['total_co2_saved'] == 0.0
        assert data['total_points'] == 0
        assert data['rank_position'] is None
        assert data['streak_days'] == 0
        assert data['achievement_count'] == 0
    
    def test_get_user_achievements_success(self, mock_supabase_service):
        """Test successful user achievements retrieval"""
        mock_achievements = [
            {
                'id': 1,
                'achievement_type': 'first_sort',
                'achievement_data': {'items_sorted': 1},
                'points': 10,
                'earned_at': '2024-01-01T00:00:00Z'
            },
            {
                'id': 2,
                'achievement_type': 'eco_warrior',
                'achievement_data': {'co2_saved': 1.0},
                'points': 100,
                'earned_at': '2024-01-10T00:00:00Z'
            }
        ]
        
        mock_supabase_service.get_user_achievements.return_value = mock_achievements
        
        response = client.get("/users/achievements/user123")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]['achievement_type'] == 'first_sort'
        assert data[0]['points'] == 10
        assert data[1]['achievement_type'] == 'eco_warrior'
        assert data[1]['points'] == 100
    
    def test_get_active_challenges_success(self, mock_supabase_service):
        """Test successful active challenges retrieval"""
        mock_challenges = [
            {
                'id': 1,
                'title': 'Recycling Rookie',
                'description': 'Sort your first 10 items',
                'challenge_type': 'recycling',
                'target_items': 10,
                'target_co2': 0.5,
                'start_date': '2024-01-01T00:00:00Z',
                'end_date': '2024-01-31T23:59:59Z',
                'is_active': True,
                'is_featured': True,
                'difficulty_level': 'easy',
                'reward_points': 50,
                'created_at': '2024-01-01T00:00:00Z'
            }
        ]
        
        mock_supabase_service.get_active_challenges.return_value = mock_challenges
        
        response = client.get("/users/challenges")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['title'] == 'Recycling Rookie'
        assert data[0]['challenge_type'] == 'recycling'
        assert data[0]['is_active'] is True
        assert data[0]['is_featured'] is True
    
    def test_get_featured_challenges_only(self, mock_supabase_service):
        """Test retrieval of featured challenges only"""
        mock_challenges = [
            {
                'id': 1,
                'title': 'Featured Challenge',
                'challenge_type': 'recycling',
                'is_active': True,
                'is_featured': True,
                'difficulty_level': 'medium',
                'reward_points': 100,
                'created_at': '2024-01-01T00:00:00Z'
            }
        ]
        
        mock_supabase_service.get_featured_challenges.return_value = mock_challenges
        
        response = client.get("/users/challenges?featured_only=true")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['is_featured'] is True
    
    def test_join_challenge_success(self, mock_supabase_service):
        """Test successful challenge joining"""
        mock_supabase_service.join_challenge.return_value = True
        
        response = client.post("/users/challenges/1/join", json={'user_id': 'user123'})
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'success'
        mock_supabase_service.join_challenge.assert_called_once_with('user123', 1)
    
    def test_join_challenge_failure(self, mock_supabase_service):
        """Test challenge joining failure"""
        mock_supabase_service.join_challenge.return_value = False
        
        response = client.post("/users/challenges/1/join", json={'user_id': 'user123'})
        
        assert response.status_code == 400
        data = response.json()
        assert "Failed to join challenge" in data['detail']
    
    def test_get_user_challenges_success(self, mock_supabase_service):
        """Test successful user challenges retrieval"""
        mock_user_challenges = [
            {
                'id': 1,
                'challenge_id': 1,
                'user_id': 'user123',
                'joined_at': '2024-01-01T00:00:00Z',
                'completed_at': None,
                'progress_data': {'items_sorted': 5},
                'points_earned': 25,
                'challenges': {
                    'id': 1,
                    'title': 'Recycling Rookie',
                    'description': 'Sort your first 10 items',
                    'challenge_type': 'recycling',
                    'target_items': 10,
                    'target_co2': 0.5,
                    'start_date': '2024-01-01T00:00:00Z',
                    'end_date': '2024-01-31T23:59:59Z',
                    'is_active': True,
                    'is_featured': True,
                    'difficulty_level': 'easy',
                    'reward_points': 50,
                    'created_at': '2024-01-01T00:00:00Z'
                }
            }
        ]
        
        mock_supabase_service.get_user_challenges.return_value = mock_user_challenges
        
        response = client.get("/users/challenges/user123/participating")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['challenge_id'] == 1
        assert data[0]['points_earned'] == 25
        assert data[0]['challenge']['title'] == 'Recycling Rookie'
    
    def test_get_user_activity_success(self, mock_supabase_service):
        """Test successful user activity retrieval"""
        mock_activities = [
            {
                'id': 1,
                'user_id': 'user123',
                'zip': '10001',
                'items_json': ['plastic bottle'],
                'decision': 'recycling',
                'co2e_saved': 0.1,
                'created_at': '2024-01-15T12:00:00Z'
            }
        ]
        
        mock_supabase_service.get_user_sort_events.return_value = mock_activities
        
        response = client.get("/users/activity/user123?limit=50&offset=0")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['user_id'] == 'user123'
        assert data[0]['decision'] == 'recycling'
    
    def test_submit_feedback_success(self, mock_supabase_service):
        """Test successful feedback submission"""
        feedback_data = {
            'user_id': 'user123',
            'sort_event_id': 1,
            'feedback_type': 'correct',
            'rating': 5,
            'comment': 'Great accuracy!'
        }
        
        mock_supabase_service.submit_feedback.return_value = True
        
        response = client.post("/users/feedback", json=feedback_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'success'
        mock_supabase_service.submit_feedback.assert_called_once_with(
            'user123', 1, 'correct', 5, 'Great accuracy!'
        )
    
    def test_submit_feedback_failure(self, mock_supabase_service):
        """Test feedback submission failure"""
        feedback_data = {
            'user_id': 'user123',
            'feedback_type': 'suggestion'
        }
        
        mock_supabase_service.submit_feedback.return_value = False
        
        response = client.post("/users/feedback", json=feedback_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "Failed to submit feedback" in data['detail']
    
    def test_update_last_seen_success(self, mock_supabase_service):
        """Test successful last seen update"""
        mock_supabase_service.update_user_last_seen.return_value = None
        
        response = client.post("/users/last-seen/user123")
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'success'
        mock_supabase_service.update_user_last_seen.assert_called_once_with('user123')
    
    def test_user_api_error_handling(self, mock_supabase_service):
        """Test error handling in user API endpoints"""
        # Mock service to raise an exception
        mock_supabase_service.get_user.side_effect = Exception("Database error")
        
        response = client.get("/users/profile/user123")
        
        assert response.status_code == 500
        data = response.json()
        assert "Failed to retrieve user profile" in data['detail']
