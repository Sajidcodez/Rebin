"""
User management API routes for ReBin Pro
Handles user profiles, preferences, achievements, and challenges
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, EmailStr
from loguru import logger

from utils.supabase_client import get_supabase_service

router = APIRouter()


class UserProfile(BaseModel):
    """User profile model"""
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: str
    last_seen: Optional[str] = None
    is_active: bool = True


class UserPreferences(BaseModel):
    """User preferences model"""
    theme: str = Field(default="light", description="UI theme: light, dark, auto")
    notifications_enabled: bool = Field(default=True)
    email_notifications: bool = Field(default=True)
    push_notifications: bool = Field(default=True)
    default_zip: Optional[str] = None
    avatar_preference: str = Field(default="eco-emma")
    language: str = Field(default="en")
    timezone: str = Field(default="UTC")
    units: str = Field(default="metric", description="metric or imperial")
    privacy_level: str = Field(default="standard", description="minimal, standard, enhanced")


class UserStats(BaseModel):
    """User statistics model"""
    total_items_sorted: int
    total_co2_saved: float
    total_points: int
    rank_position: Optional[int]
    streak_days: int
    achievement_count: int


class Achievement(BaseModel):
    """Achievement model"""
    id: int
    achievement_type: str
    achievement_data: Dict[str, Any]
    points: int
    earned_at: str


class Challenge(BaseModel):
    """Challenge model"""
    id: int
    title: str
    description: Optional[str]
    challenge_type: str
    target_items: Optional[int]
    target_co2: Optional[float]
    target_participants: Optional[int]
    start_date: Optional[str]
    end_date: Optional[str]
    is_active: bool
    is_featured: bool
    difficulty_level: str
    reward_points: int
    created_at: str


class ChallengeParticipation(BaseModel):
    """Challenge participation model"""
    id: int
    challenge_id: int
    user_id: str
    joined_at: str
    completed_at: Optional[str]
    progress_data: Dict[str, Any]
    points_earned: int
    challenge: Optional[Challenge] = None


@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_profile(user_id: str) -> UserProfile:
    """Get user profile by ID"""
    try:
        service = get_supabase_service()
        user = await service.get_user(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserProfile(
            id=user['id'],
            email=user['email'],
            full_name=user.get('full_name'),
            avatar_url=user.get('avatar_url'),
            created_at=user['created_at'],
            last_seen=user.get('last_seen'),
            is_active=user.get('is_active', True)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get user profile {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user profile")


@router.put("/profile/{user_id}", response_model=UserProfile)
async def update_user_profile(user_id: str, profile_data: Dict[str, Any]) -> UserProfile:
    """Update user profile"""
    try:
        service = get_supabase_service()
        
        # Update user data
        updated_user = await service.update_user(user_id, profile_data)
        
        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserProfile(
            id=updated_user['id'],
            email=updated_user['email'],
            full_name=updated_user.get('full_name'),
            avatar_url=updated_user.get('avatar_url'),
            created_at=updated_user['created_at'],
            last_seen=updated_user.get('last_seen'),
            is_active=updated_user.get('is_active', True)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user profile {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user profile")


@router.get("/preferences/{user_id}", response_model=UserPreferences)
async def get_user_preferences(user_id: str) -> UserPreferences:
    """Get user preferences"""
    try:
        service = get_supabase_service()
        preferences = await service.get_user_preferences(user_id)
        
        if not preferences:
            # Return default preferences if none exist
            return UserPreferences()
        
        return UserPreferences(
            theme=preferences.get('theme', 'light'),
            notifications_enabled=preferences.get('notifications_enabled', True),
            email_notifications=preferences.get('email_notifications', True),
            push_notifications=preferences.get('push_notifications', True),
            default_zip=preferences.get('default_zip'),
            avatar_preference=preferences.get('avatar_preference', 'eco-emma'),
            language=preferences.get('language', 'en'),
            timezone=preferences.get('timezone', 'UTC'),
            units=preferences.get('units', 'metric'),
            privacy_level=preferences.get('privacy_level', 'standard')
        )
        
    except Exception as e:
        logger.error(f"Failed to get user preferences {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user preferences")


@router.put("/preferences/{user_id}", response_model=UserPreferences)
async def update_user_preferences(user_id: str, preferences: UserPreferences) -> UserPreferences:
    """Update user preferences"""
    try:
        service = get_supabase_service()
        
        preferences_dict = preferences.dict()
        updated_preferences = await service.update_user_preferences(user_id, preferences_dict)
        
        if not updated_preferences:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserPreferences(
            theme=updated_preferences.get('theme', 'light'),
            notifications_enabled=updated_preferences.get('notifications_enabled', True),
            email_notifications=updated_preferences.get('email_notifications', True),
            push_notifications=updated_preferences.get('push_notifications', True),
            default_zip=updated_preferences.get('default_zip'),
            avatar_preference=updated_preferences.get('avatar_preference', 'eco-emma'),
            language=updated_preferences.get('language', 'en'),
            timezone=updated_preferences.get('timezone', 'UTC'),
            units=updated_preferences.get('units', 'metric'),
            privacy_level=updated_preferences.get('privacy_level', 'standard')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user preferences {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user preferences")


@router.get("/stats/{user_id}", response_model=UserStats)
async def get_user_stats(user_id: str) -> UserStats:
    """Get user statistics and leaderboard position"""
    try:
        service = get_supabase_service()
        
        # Get user rank data
        rank_data = await service.get_user_rank(user_id)
        
        if not rank_data:
            # Return default stats if user has no activity
            return UserStats(
                total_items_sorted=0,
                total_co2_saved=0.0,
                total_points=0,
                rank_position=None,
                streak_days=0,
                achievement_count=0
            )
        
        # Get achievement count
        achievements = await service.get_user_achievements(user_id)
        
        return UserStats(
            total_items_sorted=rank_data.get('total_items_sorted', 0),
            total_co2_saved=rank_data.get('total_co2_saved', 0.0),
            total_points=rank_data.get('total_points', 0),
            rank_position=rank_data.get('rank_position'),
            streak_days=rank_data.get('streak_days', 0),
            achievement_count=len(achievements)
        )
        
    except Exception as e:
        logger.error(f"Failed to get user stats {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user statistics")


@router.get("/achievements/{user_id}", response_model=List[Achievement])
async def get_user_achievements(user_id: str) -> List[Achievement]:
    """Get user achievements"""
    try:
        service = get_supabase_service()
        achievements = await service.get_user_achievements(user_id)
        
        return [
            Achievement(
                id=achievement['id'],
                achievement_type=achievement['achievement_type'],
                achievement_data=achievement.get('achievement_data', {}),
                points=achievement.get('points', 0),
                earned_at=achievement['earned_at']
            )
            for achievement in achievements
        ]
        
    except Exception as e:
        logger.error(f"Failed to get user achievements {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user achievements")


@router.get("/challenges", response_model=List[Challenge])
async def get_active_challenges(
    featured_only: bool = Query(default=False, description="Get only featured challenges")
) -> List[Challenge]:
    """Get active challenges"""
    try:
        service = get_supabase_service()
        
        if featured_only:
            challenges = await service.get_featured_challenges()
        else:
            challenges = await service.get_active_challenges()
        
        return [
            Challenge(
                id=challenge['id'],
                title=challenge['title'],
                description=challenge.get('description'),
                challenge_type=challenge['challenge_type'],
                target_items=challenge.get('target_items'),
                target_co2=challenge.get('target_co2'),
                target_participants=challenge.get('target_participants'),
                start_date=challenge.get('start_date'),
                end_date=challenge.get('end_date'),
                is_active=challenge.get('is_active', True),
                is_featured=challenge.get('is_featured', False),
                difficulty_level=challenge.get('difficulty_level', 'medium'),
                reward_points=challenge.get('reward_points', 0),
                created_at=challenge['created_at']
            )
            for challenge in challenges
        ]
        
    except Exception as e:
        logger.error(f"Failed to get challenges: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve challenges")


@router.post("/challenges/{challenge_id}/join")
async def join_challenge(challenge_id: int, user_id: str) -> Dict[str, Any]:
    """Join a challenge"""
    try:
        service = get_supabase_service()
        success = await service.join_challenge(user_id, challenge_id)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to join challenge")
        
        return {"status": "success", "message": "Successfully joined challenge"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to join challenge {challenge_id} for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to join challenge")


@router.get("/challenges/{user_id}/participating", response_model=List[ChallengeParticipation])
async def get_user_challenges(user_id: str) -> List[ChallengeParticipation]:
    """Get challenges user is participating in"""
    try:
        service = get_supabase_service()
        user_challenges = await service.get_user_challenges(user_id)
        
        return [
            ChallengeParticipation(
                id=participation['id'],
                challenge_id=participation['challenge_id'],
                user_id=participation['user_id'],
                joined_at=participation['joined_at'],
                completed_at=participation.get('completed_at'),
                progress_data=participation.get('progress_data', {}),
                points_earned=participation.get('points_earned', 0),
                challenge=Challenge(
                    id=participation['challenges']['id'],
                    title=participation['challenges']['title'],
                    description=participation['challenges'].get('description'),
                    challenge_type=participation['challenges']['challenge_type'],
                    target_items=participation['challenges'].get('target_items'),
                    target_co2=participation['challenges'].get('target_co2'),
                    target_participants=participation['challenges'].get('target_participants'),
                    start_date=participation['challenges'].get('start_date'),
                    end_date=participation['challenges'].get('end_date'),
                    is_active=participation['challenges'].get('is_active', True),
                    is_featured=participation['challenges'].get('is_featured', False),
                    difficulty_level=participation['challenges'].get('difficulty_level', 'medium'),
                    reward_points=participation['challenges'].get('reward_points', 0),
                    created_at=participation['challenges']['created_at']
                ) if participation.get('challenges') else None
            )
            for participation in user_challenges
        ]
        
    except Exception as e:
        logger.error(f"Failed to get user challenges {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user challenges")


@router.get("/activity/{user_id}")
async def get_user_activity(
    user_id: str,
    limit: int = Query(default=50, description="Number of activities to return"),
    offset: int = Query(default=0, description="Offset for pagination")
) -> List[Dict[str, Any]]:
    """Get user's sorting activity"""
    try:
        service = get_supabase_service()
        activities = await service.get_user_sort_events(user_id, limit, offset)
        return activities
        
    except Exception as e:
        logger.error(f"Failed to get user activity {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user activity")


@router.post("/feedback")
async def submit_feedback(
    user_id: str,
    sort_event_id: Optional[int] = None,
    feedback_type: str = "suggestion",
    rating: Optional[int] = None,
    comment: Optional[str] = None
) -> Dict[str, Any]:
    """Submit user feedback"""
    try:
        service = get_supabase_service()
        success = await service.submit_feedback(user_id, sort_event_id, feedback_type, rating, comment)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to submit feedback")
        
        return {"status": "success", "message": "Feedback submitted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")


@router.post("/last-seen/{user_id}")
async def update_last_seen(user_id: str) -> Dict[str, Any]:
    """Update user's last seen timestamp"""
    try:
        service = get_supabase_service()
        await service.update_user_last_seen(user_id)
        return {"status": "success", "message": "Last seen updated"}
        
    except Exception as e:
        logger.error(f"Failed to update last seen for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update last seen")
