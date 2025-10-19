"""
Analytics API routes for ReBin Pro
Provides comprehensive analytics and insights
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from loguru import logger

from utils.supabase_client import get_supabase_service
from utils.settings import get_current_user_id  # We'll implement this

router = APIRouter()


class AnalyticsRequest(BaseModel):
    """Request model for analytics queries"""
    time_period: str = Field(default="7d", description="Time period: 1d, 7d, 30d, 90d, 1y")
    zip_code: Optional[str] = Field(default=None, description="Filter by ZIP code")
    user_id: Optional[str] = Field(default=None, description="Filter by user ID")


class AnalyticsResponse(BaseModel):
    """Response model for analytics data"""
    period: str
    total_items: int
    total_co2_saved: float
    total_users: int
    recycling_rate: float
    trends: Dict[str, Any]
    top_items: List[Dict[str, Any]]
    geographic_distribution: Dict[str, Any]
    time_series: List[Dict[str, Any]]


class ImpactResponse(BaseModel):
    """Response model for environmental impact"""
    user_id: Optional[str]
    total_co2_saved: float
    total_items_sorted: int
    recycling_percentage: float
    compost_percentage: float
    trash_percentage: float
    environmental_impact: Dict[str, Any]
    achievements: List[Dict[str, Any]]
    rank: Optional[int]


class TrendData(BaseModel):
    """Trend analysis data"""
    metric: str
    current_value: float
    previous_value: float
    change_percentage: float
    trend_direction: str  # "up", "down", "stable"


@router.get("/trends", response_model=AnalyticsResponse)
async def get_analytics_trends(
    time_period: str = Query(default="7d", description="Time period: 1d, 7d, 30d, 90d, 1y"),
    zip_code: Optional[str] = Query(default=None, description="Filter by ZIP code"),
    user_id: Optional[str] = Query(default=None, description="Filter by user ID")
) -> AnalyticsResponse:
    """Get recycling trends and patterns"""
    try:
        service = get_supabase_service()
        
        # Calculate date range
        days = {
            "1d": 1, "7d": 7, "30d": 30, 
            "90d": 90, "1y": 365
        }.get(time_period, 7)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Build query filters
        query = service.client.table('sort_events').select('*')
        if zip_code:
            query = query.eq('zip', zip_code)
        if user_id:
            query = query.eq('user_id', user_id)
        
        # Get sort events for the period
        result = query.gte('created_at', start_date.isoformat()).execute()
        events = result.data or []
        
        # Calculate metrics
        total_items = len(events)
        total_co2_saved = sum(event.get('co2e_saved', 0) for event in events)
        
        # Calculate recycling rate
        recycling_events = [e for e in events if e.get('decision') == 'recycling']
        recycling_rate = (len(recycling_events) / total_items * 100) if total_items > 0 else 0
        
        # Get unique users
        unique_users = len(set(event.get('user_id') for event in events if event.get('user_id')))
        
        # Analyze trends
        trends = await _analyze_trends(service, events, days)
        
        # Get top items
        top_items = await _get_top_items(events)
        
        # Geographic distribution
        geo_dist = await _get_geographic_distribution(events)
        
        # Time series data
        time_series = await _get_time_series_data(events, days)
        
        return AnalyticsResponse(
            period=time_period,
            total_items=total_items,
            total_co2_saved=total_co2_saved,
            total_users=unique_users,
            recycling_rate=recycling_rate,
            trends=trends,
            top_items=top_items,
            geographic_distribution=geo_dist,
            time_series=time_series
        )
        
    except Exception as e:
        logger.error(f"Failed to get analytics trends: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve analytics data")


@router.get("/impact", response_model=ImpactResponse)
async def get_environmental_impact(
    user_id: Optional[str] = Query(default=None, description="User ID for personal impact"),
    days: int = Query(default=30, description="Number of days to analyze")
) -> ImpactResponse:
    """Calculate environmental impact metrics"""
    try:
        service = get_supabase_service()
        
        if user_id:
            # Get user-specific data
            start_date = datetime.utcnow() - timedelta(days=days)
            result = service.client.table('sort_events').select('*').eq('user_id', user_id).gte('created_at', start_date.isoformat()).execute()
            events = result.data or []
            
            # Calculate user metrics
            total_co2_saved = sum(event.get('co2e_saved', 0) for event in events)
            total_items_sorted = len(events)
            
            # Calculate decision percentages
            decisions = [event.get('decision') for event in events]
            recycling_count = decisions.count('recycling')
            compost_count = decisions.count('compost')
            trash_count = decisions.count('trash')
            
            recycling_percentage = (recycling_count / total_items_sorted * 100) if total_items_sorted > 0 else 0
            compost_percentage = (compost_count / total_items_sorted * 100) if total_items_sorted > 0 else 0
            trash_percentage = (trash_count / total_items_sorted * 100) if total_items_sorted > 0 else 0
            
            # Get user achievements
            achievements = await service.get_user_achievements(user_id)
            
            # Get user rank
            rank_data = await service.get_user_rank(user_id)
            rank = rank_data.get('rank_position') if rank_data else None
            
        else:
            # Get global data
            start_date = datetime.utcnow() - timedelta(days=days)
            result = service.client.table('sort_events').select('*').gte('created_at', start_date.isoformat()).execute()
            events = result.data or []
            
            total_co2_saved = sum(event.get('co2e_saved', 0) for event in events)
            total_items_sorted = len(events)
            
            decisions = [event.get('decision') for event in events]
            recycling_count = decisions.count('recycling')
            compost_count = decisions.count('compost')
            trash_count = decisions.count('trash')
            
            recycling_percentage = (recycling_count / total_items_sorted * 100) if total_items_sorted > 0 else 0
            compost_percentage = (compost_count / total_items_sorted * 100) if total_items_sorted > 0 else 0
            trash_percentage = (trash_count / total_items_sorted * 100) if total_items_sorted > 0 else 0
            
            achievements = []
            rank = None
        
        # Calculate environmental impact
        environmental_impact = {
            "co2_equivalent_kg": total_co2_saved,
            "trees_planted_equivalent": total_co2_saved * 0.1,  # Rough estimate
            "energy_saved_kwh": total_co2_saved * 2.5,  # Rough estimate
            "water_saved_liters": total_co2_saved * 100,  # Rough estimate
        }
        
        return ImpactResponse(
            user_id=user_id,
            total_co2_saved=total_co2_saved,
            total_items_sorted=total_items_sorted,
            recycling_percentage=recycling_percentage,
            compost_percentage=compost_percentage,
            trash_percentage=trash_percentage,
            environmental_impact=environmental_impact,
            achievements=achievements,
            rank=rank
        )
        
    except Exception as e:
        logger.error(f"Failed to get environmental impact: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate environmental impact")


@router.get("/leaderboard")
async def get_leaderboard(
    limit: int = Query(default=50, description="Number of users to return"),
    time_period: str = Query(default="all", description="Time period: 1d, 7d, 30d, all")
) -> List[Dict[str, Any]]:
    """Get leaderboard data"""
    try:
        service = get_supabase_service()
        
        if time_period == "all":
            leaderboard = await service.get_leaderboard(limit)
        else:
            # Get leaderboard for specific time period
            days = {"1d": 1, "7d": 7, "30d": 30}.get(time_period, 30)
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Get recent events and calculate rankings
            result = service.client.table('sort_events').select('*').gte('created_at', start_date.isoformat()).execute()
            events = result.data or []
            
            # Calculate user stats for the period
            user_stats = {}
            for event in events:
                user_id = event.get('user_id')
                if not user_id:
                    continue
                    
                if user_id not in user_stats:
                    user_stats[user_id] = {
                        'user_id': user_id,
                        'total_items_sorted': 0,
                        'total_co2_saved': 0,
                        'total_points': 0
                    }
                
                user_stats[user_id]['total_items_sorted'] += 1
                user_stats[user_id]['total_co2_saved'] += event.get('co2e_saved', 0)
                
                # Calculate points based on decision
                decision = event.get('decision', 'trash')
                if decision == 'recycling':
                    user_stats[user_id]['total_points'] += 10
                elif decision == 'compost':
                    user_stats[user_id]['total_points'] += 8
                else:
                    user_stats[user_id]['total_points'] += 2
            
            # Sort by points and limit
            leaderboard = sorted(user_stats.values(), key=lambda x: x['total_points'], reverse=True)[:limit]
            
            # Add rank positions
            for i, user in enumerate(leaderboard):
                user['rank_position'] = i + 1
        
        # Get user details for leaderboard
        enriched_leaderboard = []
        for entry in leaderboard:
            user_id = entry.get('user_id')
            if user_id:
                user = await service.get_user(user_id)
                if user:
                    entry['user_name'] = user.get('full_name', 'Anonymous')
                    entry['avatar_url'] = user.get('avatar_url')
                else:
                    entry['user_name'] = 'Anonymous'
                    entry['avatar_url'] = None
            
            enriched_leaderboard.append(entry)
        
        return enriched_leaderboard
        
    except Exception as e:
        logger.error(f"Failed to get leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve leaderboard")


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(default=20, description="Number of recent activities to return")
) -> List[Dict[str, Any]]:
    """Get recent sorting activity"""
    try:
        service = get_supabase_service()
        activities = await service.get_recent_activity(limit)
        return activities
        
    except Exception as e:
        logger.error(f"Failed to get recent activity: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recent activity")


@router.post("/track-event")
async def track_analytics_event(
    event_type: str,
    event_data: Dict[str, Any],
    user_id: Optional[str] = None,
    session_id: Optional[str] = None
):
    """Track an analytics event"""
    try:
        service = get_supabase_service()
        await service.track_event(user_id, event_type, event_data, session_id)
        return {"status": "success", "message": "Event tracked successfully"}
        
    except Exception as e:
        logger.error(f"Failed to track event: {e}")
        raise HTTPException(status_code=500, detail="Failed to track event")


# Helper functions

async def _analyze_trends(service, events: List[Dict], days: int) -> Dict[str, Any]:
    """Analyze trends from events data"""
    if not events:
        return {}
    
    # Compare with previous period
    previous_start = datetime.utcnow() - timedelta(days=days * 2)
    previous_end = datetime.utcnow() - timedelta(days=days)
    
    previous_events = service.client.table('sort_events').select('*').gte('created_at', previous_start.isoformat()).lt('created_at', previous_end.isoformat()).execute()
    previous_data = previous_events.data or []
    
    current_total = len(events)
    previous_total = len(previous_data)
    
    current_co2 = sum(e.get('co2e_saved', 0) for e in events)
    previous_co2 = sum(e.get('co2e_saved', 0) for e in previous_data)
    
    return {
        "items_trend": {
            "current": current_total,
            "previous": previous_total,
            "change_percentage": ((current_total - previous_total) / previous_total * 100) if previous_total > 0 else 0
        },
        "co2_trend": {
            "current": current_co2,
            "previous": previous_co2,
            "change_percentage": ((current_co2 - previous_co2) / previous_co2 * 100) if previous_co2 > 0 else 0
        }
    }


async def _get_top_items(events: List[Dict]) -> List[Dict[str, Any]]:
    """Get top sorted items"""
    item_counts = {}
    
    for event in events:
        items = event.get('items_json', [])
        if isinstance(items, list):
            for item in items:
                if isinstance(item, str):
                    item_counts[item] = item_counts.get(item, 0) + 1
                elif isinstance(item, dict):
                    label = item.get('label', 'unknown')
                    item_counts[label] = item_counts.get(label, 0) + 1
    
    # Sort by count and return top 10
    sorted_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return [{"item": item, "count": count} for item, count in sorted_items]


async def _get_geographic_distribution(events: List[Dict]) -> Dict[str, Any]:
    """Get geographic distribution of events"""
    zip_counts = {}
    
    for event in events:
        zip_code = event.get('zip')
        if zip_code:
            zip_counts[zip_code] = zip_counts.get(zip_code, 0) + 1
    
    # Sort by count and return top 10
    sorted_zips = sorted(zip_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "top_zip_codes": [{"zip": zip_code, "count": count} for zip_code, count in sorted_zips],
        "total_locations": len(zip_counts)
    }


async def _get_time_series_data(events: List[Dict], days: int) -> List[Dict[str, Any]]:
    """Get time series data for charts"""
    # Group events by day
    daily_counts = {}
    daily_co2 = {}
    
    for event in events:
        created_at = event.get('created_at')
        if created_at:
            # Parse date and get day
            try:
                event_date = datetime.fromisoformat(created_at.replace('Z', '+00:00')).date()
                day_key = event_date.isoformat()
                
                daily_counts[day_key] = daily_counts.get(day_key, 0) + 1
                daily_co2[day_key] = daily_co2.get(day_key, 0) + event.get('co2e_saved', 0)
            except:
                continue
    
    # Create time series data
    time_series = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=i)).date()
        day_key = date.isoformat()
        
        time_series.append({
            "date": day_key,
            "items_count": daily_counts.get(day_key, 0),
            "co2_saved": daily_co2.get(day_key, 0)
        })
    
    # Sort by date
    time_series.sort(key=lambda x: x["date"])
    
    return time_series
