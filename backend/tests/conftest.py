"""
Pytest configuration and fixtures for ReBin Pro backend tests
"""

import pytest
import asyncio
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
import os
import sys

# Add the backend directory to the path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from main import app


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client for testing."""
    with patch('utils.supabase_client.supabase') as mock:
        mock_client = Mock()
        mock.return_value = mock_client
        yield mock_client


@pytest.fixture
def mock_openrouter_client():
    """Mock OpenRouter client for testing."""
    with patch('utils.openrouter_client.OpenRouterClient') as mock:
        mock_client = Mock()
        mock.return_value = mock_client
        yield mock_client


@pytest.fixture
def mock_elevenlabs_client():
    """Mock ElevenLabs client for testing."""
    with patch('utils.elevenlabs_client.ElevenLabsClient') as mock:
        mock_client = Mock()
        mock.return_value = mock_client
        yield mock_client


@pytest.fixture
def sample_sort_event():
    """Sample sort event data for testing."""
    return {
        'user_id': 'test-user-123',
        'zip': '10001',
        'items_json': ['plastic bottle', 'aluminum can'],
        'decision': 'recycling',
        'co2e_saved': 0.15
    }


@pytest.fixture
def sample_inference_response():
    """Sample inference response for testing."""
    return {
        'items': [
            {'label': 'plastic bottle', 'confidence': 0.95},
            {'label': 'aluminum can', 'confidence': 0.88}
        ],
        'zip': '10001'
    }


@pytest.fixture
def sample_explanation_response():
    """Sample explanation response for testing."""
    return {
        'decisions': [
            {
                'label': 'plastic bottle',
                'bin': 'recycling',
                'explanation': 'Plastic bottles can be recycled in most areas.',
                'eco_tip': 'Remove the cap before recycling.'
            },
            {
                'label': 'aluminum can',
                'bin': 'recycling',
                'explanation': 'Aluminum cans are highly recyclable.',
                'eco_tip': 'Rinse the can before recycling.'
            }
        ]
    }


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        'id': 'test-user-123',
        'email': 'test@example.com',
        'full_name': 'Test User',
        'avatar_url': 'https://example.com/avatar.jpg',
        'created_at': '2024-01-01T00:00:00Z',
        'last_seen': '2024-01-15T12:00:00Z',
        'is_active': True
    }


@pytest.fixture
def sample_user_preferences():
    """Sample user preferences for testing."""
    return {
        'id': 'pref-123',
        'user_id': 'test-user-123',
        'theme': 'dark',
        'notifications_enabled': True,
        'email_notifications': True,
        'push_notifications': False,
        'default_zip': '10001',
        'avatar_preference': 'eco-emma',
        'language': 'en',
        'timezone': 'UTC',
        'units': 'metric',
        'privacy_level': 'standard'
    }


@pytest.fixture
def sample_achievement():
    """Sample achievement data for testing."""
    return {
        'id': 1,
        'user_id': 'test-user-123',
        'achievement_type': 'first_sort',
        'achievement_data': {'items_sorted': 1},
        'points': 10,
        'earned_at': '2024-01-01T00:00:00Z'
    }


@pytest.fixture
def sample_challenge():
    """Sample challenge data for testing."""
    return {
        'id': 1,
        'title': 'Recycling Rookie',
        'description': 'Sort your first 10 items correctly',
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


@pytest.fixture
def sample_leaderboard_entry():
    """Sample leaderboard entry for testing."""
    return {
        'user_id': 'test-user-123',
        'user_name': 'Test User',
        'avatar_url': None,
        'total_items_sorted': 100,
        'total_co2_saved': 5.0,
        'total_points': 500,
        'rank_position': 1
    }


@pytest.fixture
def mock_file_upload():
    """Mock file upload for testing."""
    return {
        'file': ('test-image.jpg', b'fake-image-data', 'image/jpeg'),
        'zip': '10001'
    }


@pytest.fixture(autouse=True)
def setup_test_environment():
    """Set up test environment variables."""
    os.environ['ENVIRONMENT'] = 'test'
    os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
    os.environ['SUPABASE_SERVICE_ROLE_KEY'] = 'test-key'
    os.environ['OPENROUTER_API_KEY'] = 'test-openrouter-key'
    os.environ['ELEVENLABS_API_KEY'] = 'test-elevenlabs-key'
    os.environ['FRONTEND_ORIGIN'] = 'http://localhost:3000'
    
    yield
    
    # Cleanup after test
    test_env_vars = [
        'ENVIRONMENT', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
        'OPENROUTER_API_KEY', 'ELEVENLABS_API_KEY', 'FRONTEND_ORIGIN'
    ]
    for var in test_env_vars:
        if var in os.environ:
            del os.environ[var]


@pytest.fixture
def mock_analytics_data():
    """Mock analytics data for testing."""
    return {
        'period': '7d',
        'total_items': 150,
        'total_co2_saved': 7.5,
        'total_users': 25,
        'recycling_rate': 75.0,
        'trends': {
            'items_trend': {
                'current': 150,
                'previous': 120,
                'change_percentage': 25.0
            },
            'co2_trend': {
                'current': 7.5,
                'previous': 6.0,
                'change_percentage': 25.0
            }
        },
        'top_items': [
            {'item': 'plastic bottle', 'count': 45},
            {'item': 'aluminum can', 'count': 32},
            {'item': 'food waste', 'count': 28}
        ],
        'geographic_distribution': {
            'top_zip_codes': [
                {'zip': '10001', 'count': 25},
                {'zip': '94103', 'count': 18}
            ],
            'total_locations': 15
        },
        'time_series': [
            {'date': '2024-01-15', 'items_count': 20, 'co2_saved': 1.0},
            {'date': '2024-01-16', 'items_count': 25, 'co2_saved': 1.25}
        ]
    }


@pytest.fixture
def mock_impact_data():
    """Mock environmental impact data for testing."""
    return {
        'user_id': 'test-user-123',
        'total_co2_saved': 5.5,
        'total_items_sorted': 110,
        'recycling_percentage': 70.0,
        'compost_percentage': 20.0,
        'trash_percentage': 10.0,
        'environmental_impact': {
            'co2_equivalent_kg': 5.5,
            'trees_planted_equivalent': 0.55,
            'energy_saved_kwh': 13.75,
            'water_saved_liters': 550
        },
        'achievements': [
            {
                'id': 1,
                'achievement_type': 'first_sort',
                'points': 10,
                'earned_at': '2024-01-01T00:00:00Z'
            }
        ],
        'rank': 5
    }


# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers."""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers based on test names."""
    for item in items:
        # Add slow marker to tests that might take longer
        if "integration" in item.nodeid or "e2e" in item.nodeid:
            item.add_marker(pytest.mark.slow)
        
        # Add unit marker to unit tests
        if "test_" in item.nodeid and "integration" not in item.nodeid:
            item.add_marker(pytest.mark.unit)
