from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta
import json

from loguru import logger
from supabase import create_client

from schemas import EventCreateRequest
from utils.settings import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

_supabase = None


def supabase():
    """
    Lazy initialize Supabase client.
    """
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("Supabase configuration missing")
        _supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _supabase


class SupabaseService:
    """Enhanced Supabase service with comprehensive database operations"""
    
    def __init__(self):
        self.client = supabase()
    
    # =============================================
    # USER MANAGEMENT
    # =============================================
    
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        try:
            result = self.client.table('users').insert(user_data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            raise
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            result = self.client.table('users').select('*').eq('id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get user {user_id}: {e}")
            return None
    
    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update user information"""
        try:
            result = self.client.table('users').update(updates).eq('id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to update user {user_id}: {e}")
            raise
    
    async def update_user_last_seen(self, user_id: str):
        """Update user's last seen timestamp"""
        try:
            self.client.table('users').update({'last_seen': datetime.utcnow().isoformat()}).eq('id', user_id).execute()
        except Exception as e:
            logger.warning(f"Failed to update last seen for user {user_id}: {e}")
    
    # =============================================
    # USER PREFERENCES
    # =============================================
    
    async def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user preferences"""
        try:
            result = self.client.table('user_preferences').select('*').eq('user_id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get preferences for user {user_id}: {e}")
            return None
    
    async def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Update user preferences"""
        try:
            preferences['user_id'] = user_id
            result = self.client.table('user_preferences').upsert(preferences, on_conflict='user_id').execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to update preferences for user {user_id}: {e}")
            raise
    
    # =============================================
    # SORT EVENTS
    # =============================================
    
    async def insert_sort_event(self, payload: EventCreateRequest) -> int:
        """Insert a sort event row"""
        try:
            row = {
                "user_id": payload.user_id,
                "zip": payload.zip,
                "items_json": payload.items_json,
                "decision": payload.decision,
                "co2e_saved": payload.co2e_saved,
            }
            result = self.client.table("sort_events").insert(row).execute()
            inserted = result.data[0]
            
            # Check and award achievements
            if payload.user_id:
                await self.check_user_achievements(payload.user_id)
            
            return int(inserted["id"])
        except Exception as e:
            logger.error(f"Failed to insert sort event: {e}")
            raise
    
    async def get_user_sort_events(self, user_id: str, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get user's sort events"""
        try:
            result = self.client.table('sort_events').select('*').eq('user_id', user_id).order('created_at', desc=True).range(offset, offset + limit - 1).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get sort events for user {user_id}: {e}")
            return []
    
    async def get_recent_activity(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent sorting activity across all users"""
        try:
            result = self.client.table('recent_activity').select('*').limit(limit).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get recent activity: {e}")
            return []
    
    # =============================================
    # ACHIEVEMENTS
    # =============================================
    
    async def get_user_achievements(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's achievements"""
        try:
            result = self.client.table('achievements').select('*').eq('user_id', user_id).order('earned_at', desc=True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get achievements for user {user_id}: {e}")
            return []
    
    async def check_user_achievements(self, user_id: str):
        """Check and award achievements for a user"""
        try:
            # Call the database function to check achievements
            result = self.client.rpc('check_achievements', {'user_uuid': user_id}).execute()
            logger.info(f"Checked achievements for user {user_id}")
        except Exception as e:
            logger.warning(f"Failed to check achievements for user {user_id}: {e}")
    
    # =============================================
    # LEADERBOARD
    # =============================================
    
    async def get_leaderboard(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get leaderboard data"""
        try:
            result = self.client.table('leaderboard').select('*').order('total_points', desc=True).limit(limit).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get leaderboard: {e}")
            return []
    
    async def get_user_rank(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's rank and stats"""
        try:
            result = self.client.table('leaderboard').select('*').eq('user_id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get rank for user {user_id}: {e}")
            return None
    
    # =============================================
    # CHALLENGES
    # =============================================
    
    async def get_active_challenges(self) -> List[Dict[str, Any]]:
        """Get active challenges"""
        try:
            result = self.client.table('challenges').select('*').eq('is_active', True).order('created_at', desc=True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get active challenges: {e}")
            return []
    
    async def get_featured_challenges(self) -> List[Dict[str, Any]]:
        """Get featured challenges"""
        try:
            result = self.client.table('challenges').select('*').eq('is_active', True).eq('is_featured', True).order('created_at', desc=True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get featured challenges: {e}")
            return []
    
    async def join_challenge(self, user_id: str, challenge_id: int) -> bool:
        """Join a challenge"""
        try:
            result = self.client.table('challenge_participants').insert({
                'user_id': user_id,
                'challenge_id': challenge_id
            }).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Failed to join challenge {challenge_id} for user {user_id}: {e}")
            return False
    
    async def get_user_challenges(self, user_id: str) -> List[Dict[str, Any]]:
        """Get challenges user is participating in"""
        try:
            result = self.client.table('challenge_participants').select('*, challenges(*)').eq('user_id', user_id).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get challenges for user {user_id}: {e}")
            return []
    
    # =============================================
    # ANALYTICS
    # =============================================
    
    async def track_event(self, user_id: Optional[str], event_type: str, event_data: Dict[str, Any], session_id: Optional[str] = None):
        """Track an analytics event"""
        try:
            event = {
                'user_id': user_id,
                'session_id': session_id,
                'event_type': event_type,
                'event_data': event_data,
                'timestamp': datetime.utcnow().isoformat()
            }
            self.client.table('analytics_events').insert(event).execute()
        except Exception as e:
            logger.warning(f"Failed to track event {event_type}: {e}")
    
    async def get_user_analytics(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get user analytics for the last N days"""
        try:
            start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            # Get sort events
            sort_events = self.client.table('sort_events').select('*').eq('user_id', user_id).gte('created_at', start_date).execute()
            
            # Get analytics events
            analytics_events = self.client.table('analytics_events').select('*').eq('user_id', user_id).gte('timestamp', start_date).execute()
            
            return {
                'sort_events': sort_events.data or [],
                'analytics_events': analytics_events.data or [],
                'period_days': days
            }
        except Exception as e:
            logger.error(f"Failed to get analytics for user {user_id}: {e}")
            return {'sort_events': [], 'analytics_events': [], 'period_days': days}
    
    # =============================================
    # FEEDBACK
    # =============================================
    
    async def submit_feedback(self, user_id: str, sort_event_id: Optional[int], feedback_type: str, rating: Optional[int] = None, comment: Optional[str] = None) -> bool:
        """Submit user feedback"""
        try:
            feedback_data = {
                'user_id': user_id,
                'sort_event_id': sort_event_id,
                'feedback_type': feedback_type,
                'rating': rating,
                'comment': comment
            }
            result = self.client.table('feedback').insert(feedback_data).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Failed to submit feedback: {e}")
            return False
    
    # =============================================
    # POLICIES
    # =============================================
    
    async def get_policy_by_zip(self, zip_code: str) -> Optional[Dict[str, Any]]:
        """Get recycling policy by ZIP code"""
        try:
            result = self.client.table('policies').select('*').eq('zip', zip_code).eq('is_active', True).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Failed to get policy for ZIP {zip_code}: {e}")
            return None
    
    async def get_all_policies(self) -> List[Dict[str, Any]]:
        """Get all active policies"""
        try:
            result = self.client.table('policies').select('*').eq('is_active', True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Failed to get policies: {e}")
            return []
    
    # =============================================
    # REAL-TIME SUBSCRIPTIONS
    # =============================================
    
    def subscribe_to_leaderboard_updates(self, callback):
        """Subscribe to leaderboard updates"""
        try:
            return self.client.table('leaderboard').on('UPDATE', callback).subscribe()
        except Exception as e:
            logger.error(f"Failed to subscribe to leaderboard updates: {e}")
            return None
    
    def subscribe_to_user_events(self, user_id: str, callback):
        """Subscribe to user's sort events"""
        try:
            return self.client.table('sort_events').on('INSERT', callback).eq('user_id', user_id).subscribe()
        except Exception as e:
            logger.error(f"Failed to subscribe to user events for {user_id}: {e}")
            return None
    
    def subscribe_to_challenges(self, callback):
        """Subscribe to challenge updates"""
        try:
            return self.client.table('challenges').on('*', callback).subscribe()
        except Exception as e:
            logger.error(f"Failed to subscribe to challenges: {e}")
            return None


# Global service instance
_supabase_service = None

def get_supabase_service() -> SupabaseService:
    """Get the global Supabase service instance"""
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service


async def ensure_seed_policies() -> None:
    """
    Ensure two policy rows exist (NYC, SF).
    """
    try:
        service = get_supabase_service()
        existing = service.client.table("policies").select("*").in_("zip", ["10001", "94103"]).execute()
        found_zips = {row["zip"] for row in existing.data} if existing.data else set()

        seeds: List[Dict[str, Any]] = []
        if "10001" not in found_zips:
            seeds.append(
                {"zip": "10001", "rules_json": {"recycling": ["plastic #1-2", "paper"], "compost": ["food", "yard"], "trash": ["styrofoam"]}}
            )
        if "94103" not in found_zips:
            seeds.append(
                {"zip": "94103", "rules_json": {"recycling": ["glass", "paper", "metal"], "compost": ["food", "soiled paper"], "trash": ["film plastic"]}}
            )
        if seeds:
            service.client.table("policies").upsert(seeds, on_conflict="zip").execute()
            logger.info("Seeded policies for NYC and SF")
        else:
            logger.info("Policies already seeded")
    except Exception as exc:  # noqa: BLE001
        logger.error(f"Policy seed check failed: {exc}")


async def insert_sort_event(payload: EventCreateRequest) -> int:
    """
    Insert a sort event row using the enhanced service.
    """
    service = get_supabase_service()
    return await service.insert_sort_event(payload)
