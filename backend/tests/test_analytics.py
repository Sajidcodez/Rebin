"""
Test suite for analytics API endpoints
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import json
from datetime import datetime, timedelta

from main import app
from utils.supabase_client import get_supabase_service

client = TestClient(app)


class TestAnalyticsAPI:
    """Test analytics API endpoints"""
    
    @pytest.fixture
    def mock_supabase_service(self):
        """Mock Supabase service for testing"""
        with patch('utils.supabase_client.get_supabase_service') as mock:
            service = Mock()
            mock.return_value = service
            yield service
    
    def test_get_analytics_trends_success(self, mock_supabase_service):
        """Test successful analytics trends retrieval"""
        # Mock data
        mock_events = [
            {
                'id': 1,
                'user_id': 'user1',
                'zip': '10001',
                'items_json': ['plastic bottle'],
                'decision': 'recycling',
                'co2e_saved': 0.1,
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'id': 2,
                'user_id': 'user2',
                'zip': '10001',
                'items_json': ['food waste'],
                'decision': 'compost',
                'co2e_saved': 0.05,
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        mock_supabase_service.client.table.return_value.select.return_value.gte.return_value.execute.return_value.data = mock_events
        
        response = client.get("/analytics/trends?time_period=7d")
        
        assert response.status_code == 200
        data = response.json()
        assert data['period'] == '7d'
        assert data['total_items'] == 2
        assert data['total_co2_saved'] == 0.15
        assert data['total_users'] == 2
        assert data['recycling_rate'] == 50.0
    
    def test_get_analytics_trends_with_filters(self, mock_supabase_service):
        """Test analytics trends with ZIP code and user filters"""
        mock_events = [
            {
                'id': 1,
                'user_id': 'user1',
                'zip': '10001',
                'items_json': ['plastic bottle'],
                'decision': 'recycling',
                'co2e_saved': 0.1,
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        mock_supabase_service.client.table.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value.data = mock_events
        
        response = client.get("/analytics/trends?time_period=7d&zip_code=10001&user_id=user1")
        
        assert response.status_code == 200
        data = response.json()
        assert data['total_items'] == 1
    
    def test_get_environmental_impact_user_specific(self, mock_supabase_service):
        """Test environmental impact calculation for specific user"""
        mock_events = [
            {
                'id': 1,
                'user_id': 'user1',
                'items_json': ['plastic bottle'],
                'decision': 'recycling',
                'co2e_saved': 0.1,
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'id': 2,
                'user_id': 'user1',
                'items_json': ['food waste'],
                'decision': 'compost',
                'co2e_saved': 0.05,
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        mock_achievements = [
            {
                'id': 1,
                'achievement_type': 'first_sort',
                'points': 10,
                'earned_at': datetime.utcnow().isoformat()
            }
        ]
        
        mock_rank_data = {
            'user_id': 'user1',
            'total_items_sorted': 2,
            'total_co2_saved': 0.15,
            'total_points': 18,
            'rank_position': 5
        }
        
        # Mock service calls
        mock_supabase_service.client.table.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value.data = mock_events
        mock_supabase_service.get_user_achievements.return_value = mock_achievements
        mock_supabase_service.get_user_rank.return_value = mock_rank_data
        
        response = client.get("/analytics/impact?user_id=user1&days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data['user_id'] == 'user1'
        assert data['total_co2_saved'] == 0.15
        assert data['total_items_sorted'] == 2
        assert data['recycling_percentage'] == 50.0
        assert data['compost_percentage'] == 50.0
        assert data['trash_percentage'] == 0.0
        assert len(data['achievements']) == 1
        assert data['rank'] == 5
    
    def test_get_leaderboard_success(self, mock_supabase_service):
        """Test leaderboard retrieval"""
        mock_leaderboard = [
            {
                'user_id': 'user1',
                'user_name': 'John Doe',
                'avatar_url': None,
                'total_items_sorted': 100,
                'total_co2_saved': 5.0,
                'total_points': 500,
                'rank_position': 1
            },
            {
                'user_id': 'user2',
                'user_name': 'Jane Smith',
                'avatar_url': None,
                'total_items_sorted': 80,
                'total_co2_saved': 4.0,
                'total_points': 400,
                'rank_position': 2
            }
        ]
        
        mock_supabase_service.get_leaderboard.return_value = mock_leaderboard
        mock_supabase_service.get_user.return_value = {
            'id': 'user1',
            'full_name': 'John Doe',
            'avatar_url': None
        }
        
        response = client.get("/analytics/leaderboard?limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]['user_name'] == 'John Doe'
        assert data[0]['rank_position'] == 1
        assert data[0]['total_points'] == 500
    
    def test_get_recent_activity(self, mock_supabase_service):
        """Test recent activity retrieval"""
        mock_activities = [
            {
                'id': 1,
                'user_id': 'user1',
                'full_name': 'John Doe',
                'items_json': ['plastic bottle'],
                'decision': 'recycling',
                'co2e_saved': 0.1,
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        mock_supabase_service.get_recent_activity.return_value = mock_activities
        
        response = client.get("/analytics/recent-activity?limit=20")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['full_name'] == 'John Doe'
    
    def test_track_analytics_event(self, mock_supabase_service):
        """Test analytics event tracking"""
        event_data = {
            'event_type': 'image_upload',
            'event_data': {
                'file_size': 1024000,
                'file_type': 'image/jpeg'
            },
            'user_id': 'user1',
            'session_id': 'session123'
        }
        
        mock_supabase_service.track_event.return_value = None
        
        response = client.post("/analytics/track-event", json=event_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'success'
        mock_supabase_service.track_event.assert_called_once()
    
    def test_analytics_trends_invalid_period(self):
        """Test analytics trends with invalid time period"""
        response = client.get("/analytics/trends?time_period=invalid")
        
        # Should still work but use default period
        assert response.status_code == 200
    
    def test_environmental_impact_no_user_data(self, mock_supabase_service):
        """Test environmental impact when user has no data"""
        mock_supabase_service.client.table.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value.data = []
        mock_supabase_service.get_user_achievements.return_value = []
        mock_supabase_service.get_user_rank.return_value = None
        
        response = client.get("/analytics/impact?user_id=nonexistent&days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data['total_co2_saved'] == 0.0
        assert data['total_items_sorted'] == 0
        assert data['rank'] is None
    
    def test_leaderboard_time_period_filter(self, mock_supabase_service):
        """Test leaderboard with time period filter"""
        mock_events = [
            {
                'id': 1,
                'user_id': 'user1',
                'items_json': ['plastic bottle'],
                'decision': 'recycling',
                'co2e_saved': 0.1,
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        mock_supabase_service.client.table.return_value.select.return_value.gte.return_value.execute.return_value.data = mock_events
        mock_supabase_service.get_user.return_value = {
            'id': 'user1',
            'full_name': 'John Doe',
            'avatar_url': None
        }
        
        response = client.get("/analytics/leaderboard?time_period=7d&limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]['user_name'] == 'John Doe'
    
    def test_analytics_error_handling(self, mock_supabase_service):
        """Test error handling in analytics endpoints"""
        # Mock service to raise an exception
        mock_supabase_service.client.table.side_effect = Exception("Database error")
        
        response = client.get("/analytics/trends")
        
        assert response.status_code == 500
        data = response.json()
        assert "Failed to retrieve analytics data" in data['detail']
    
    def test_trend_analysis_calculation(self, mock_supabase_service):
        """Test trend analysis calculations"""
        # Mock current period events
        current_events = [
            {
                'id': 1,
                'user_id': 'user1',
                'items_json': ['plastic bottle'],
                'decision': 'recycling',
                'co2e_saved': 0.1,
                'created_at': datetime.utcnow().isoformat()
            },
            {
                'id': 2,
                'user_id': 'user2',
                'items_json': ['food waste'],
                'decision': 'compost',
                'co2e_saved': 0.05,
                'created_at': datetime.utcnow().isoformat()
            }
        ]
        
        # Mock previous period events (fewer items)
        previous_events = [
            {
                'id': 3,
                'user_id': 'user1',
                'items_json': ['plastic bottle'],
                'decision': 'recycling',
                'co2e_saved': 0.1,
                'created_at': (datetime.utcnow() - timedelta(days=10)).isoformat()
            }
        ]
        
        # Mock the service calls
        def mock_execute():
            result = Mock()
            result.data = current_events
            return result
        
        mock_supabase_service.client.table.return_value.select.return_value.gte.return_value.execute.side_effect = mock_execute
        
        response = client.get("/analytics/trends?time_period=7d")
        
        assert response.status_code == 200
        data = response.json()
        assert 'trends' in data
        assert 'items_trend' in data['trends']
        assert 'co2_trend' in data['trends']
