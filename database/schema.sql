-- ReBin Pro Enhanced Database Schema
-- This file contains all the database tables, indexes, and functions for the ReBin Pro application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- EXISTING TABLES (Enhanced)
-- =============================================

-- Users table (enhanced from existing)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Sort events table (enhanced from existing)
CREATE TABLE IF NOT EXISTS sort_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    zip TEXT,
    items_json JSONB NOT NULL,
    decision TEXT NOT NULL,
    co2e_saved FLOAT DEFAULT 0.0,
    confidence_score FLOAT DEFAULT 0.0,
    processing_time_ms INTEGER,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies table (enhanced from existing)
CREATE TABLE IF NOT EXISTS policies (
    id SERIAL PRIMARY KEY,
    zip TEXT UNIQUE NOT NULL,
    rules_json JSONB NOT NULL,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'US',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- =============================================
-- NEW TABLES
-- =============================================

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    default_zip TEXT,
    avatar_preference TEXT DEFAULT 'eco-emma',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    privacy_level TEXT DEFAULT 'standard' CHECK (privacy_level IN ('minimal', 'standard', 'enhanced')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_data JSONB DEFAULT '{}'::jsonb,
    points INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

-- Community challenges table
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('recycling', 'compost', 'reduction', 'education')),
    target_items INTEGER,
    target_co2 FLOAT,
    target_participants INTEGER,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    reward_points INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_data JSONB DEFAULT '{}'::jsonb,
    points_earned INTEGER DEFAULT 0,
    UNIQUE(challenge_id, user_id)
);

-- User sessions table for analytics
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_token TEXT UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    city TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    page_url TEXT,
    referrer TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sort_event_id INTEGER REFERENCES sort_events(id) ON DELETE SET NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('correct', 'incorrect', 'suggestion', 'bug')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_helpful BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard table (materialized view for performance)
CREATE TABLE IF NOT EXISTS leaderboard (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_items_sorted INTEGER DEFAULT 0,
    total_co2_saved FLOAT DEFAULT 0.0,
    total_points INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    rank_position INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Sort events table indexes
CREATE INDEX IF NOT EXISTS idx_sort_events_user_id ON sort_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sort_events_created_at ON sort_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sort_events_zip ON sort_events(zip);
CREATE INDEX IF NOT EXISTS idx_sort_events_decision ON sort_events(decision);
CREATE INDEX IF NOT EXISTS idx_sort_events_co2e_saved ON sort_events(co2e_saved DESC);
CREATE INDEX IF NOT EXISTS idx_sort_events_user_created ON sort_events(user_id, created_at DESC);

-- Policies table indexes
CREATE INDEX IF NOT EXISTS idx_policies_zip ON policies(zip);
CREATE INDEX IF NOT EXISTS idx_policies_city_state ON policies(city, state);
CREATE INDEX IF NOT EXISTS idx_policies_is_active ON policies(is_active);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme ON user_preferences(theme);

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON achievements(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user_type ON achievements(user_id, achievement_type);

-- Challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_is_featured ON challenges(is_featured);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty_level);

-- Challenge participants indexes
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_joined_at ON challenge_participants(joined_at DESC);

-- User sessions indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp DESC);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sort_event_id ON feedback(sort_event_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Leaderboard indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_points ON leaderboard(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_co2 ON leaderboard(total_co2_saved DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank_position);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sort_events_updated_at BEFORE UPDATE ON sort_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user's last_seen
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        UPDATE users SET last_seen = NOW() WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update last_seen on sort_events
CREATE TRIGGER update_user_last_seen_trigger 
    AFTER INSERT ON sort_events 
    FOR EACH ROW EXECUTE FUNCTION update_user_last_seen();

-- Function to calculate and update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
DECLARE
    user_stats RECORD;
BEGIN
    -- Get user statistics
    SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(co2e_saved), 0) as total_co2,
        COALESCE(SUM(
            CASE 
                WHEN decision = 'recycling' THEN 10
                WHEN decision = 'compost' THEN 8
                WHEN decision = 'trash' THEN 2
                ELSE 0
            END
        ), 0) as total_points
    INTO user_stats
    FROM sort_events 
    WHERE user_id = NEW.user_id;
    
    -- Update or insert leaderboard entry
    INSERT INTO leaderboard (user_id, total_items_sorted, total_co2_saved, total_points, last_updated)
    VALUES (NEW.user_id, user_stats.total_items, user_stats.total_co2, user_stats.total_points, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_items_sorted = user_stats.total_items,
        total_co2_saved = user_stats.total_co2,
        total_points = user_stats.total_points,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update leaderboard on sort_events insert
CREATE TRIGGER update_leaderboard_trigger 
    AFTER INSERT ON sort_events 
    FOR EACH ROW EXECUTE FUNCTION update_leaderboard();

-- Function to update leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings()
RETURNS void AS $$
BEGIN
    WITH ranked_users AS (
        SELECT 
            user_id,
            ROW_NUMBER() OVER (ORDER BY total_points DESC, total_co2_saved DESC) as new_rank
        FROM leaderboard
    )
    UPDATE leaderboard 
    SET rank_position = ranked_users.new_rank
    FROM ranked_users 
    WHERE leaderboard.user_id = ranked_users.user_id;
END;
$$ language 'plpgsql';

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(user_uuid UUID)
RETURNS void AS $$
DECLARE
    user_stats RECORD;
BEGIN
    -- Get user statistics
    SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(co2e_saved), 0) as total_co2,
        COUNT(DISTINCT DATE(created_at)) as unique_days
    INTO user_stats
    FROM sort_events 
    WHERE user_id = user_uuid;
    
    -- Award achievements based on milestones
    -- First sort
    IF user_stats.total_items >= 1 THEN
        INSERT INTO achievements (user_id, achievement_type, points)
        VALUES (user_uuid, 'first_sort', 10)
        ON CONFLICT (user_id, achievement_type) DO NOTHING;
    END IF;
    
    -- 10 items sorted
    IF user_stats.total_items >= 10 THEN
        INSERT INTO achievements (user_id, achievement_type, points)
        VALUES (user_uuid, 'sorting_novice', 50)
        ON CONFLICT (user_id, achievement_type) DO NOTHING;
    END IF;
    
    -- 100 items sorted
    IF user_stats.total_items >= 100 THEN
        INSERT INTO achievements (user_id, achievement_type, points)
        VALUES (user_uuid, 'sorting_expert', 200)
        ON CONFLICT (user_id, achievement_type) DO NOTHING;
    END IF;
    
    -- 1kg CO2 saved
    IF user_stats.total_co2 >= 1.0 THEN
        INSERT INTO achievements (user_id, achievement_type, points)
        VALUES (user_uuid, 'eco_warrior', 100)
        ON CONFLICT (user_id, achievement_type) DO NOTHING;
    END IF;
    
    -- 7-day streak
    IF user_stats.unique_days >= 7 THEN
        INSERT INTO achievements (user_id, achievement_type, points)
        VALUES (user_uuid, 'week_warrior', 150)
        ON CONFLICT (user_id, achievement_type) DO NOTHING;
    END IF;
END;
$$ language 'plpgsql';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sort_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policies for sort_events table
CREATE POLICY "Users can view their own sort events" ON sort_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sort events" ON sort_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for user_preferences table
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Policies for achievements table
CREATE POLICY "Users can view their own achievements" ON achievements
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for challenge_participants table
CREATE POLICY "Users can view their own challenge participation" ON challenge_participants
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges" ON challenge_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for user_sessions table
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for analytics_events table
CREATE POLICY "Users can view their own analytics" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

-- Policies for feedback table
CREATE POLICY "Users can manage their own feedback" ON feedback
    FOR ALL USING (auth.uid() = user_id);

-- Policies for leaderboard table (read-only for users)
CREATE POLICY "Users can view leaderboard" ON leaderboard
    FOR SELECT USING (true);

-- Public read access for challenges and policies
CREATE POLICY "Anyone can view active challenges" ON challenges
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view policies" ON policies
    FOR SELECT USING (is_active = true);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- User statistics view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.created_at,
    u.last_seen,
    COALESCE(l.total_items_sorted, 0) as total_items_sorted,
    COALESCE(l.total_co2_saved, 0) as total_co2_saved,
    COALESCE(l.total_points, 0) as total_points,
    COALESCE(l.rank_position, 0) as rank_position,
    COALESCE(l.streak_days, 0) as streak_days,
    COUNT(DISTINCT a.id) as achievement_count
FROM users u
LEFT JOIN leaderboard l ON u.id = l.user_id
LEFT JOIN achievements a ON u.id = a.user_id
GROUP BY u.id, l.total_items_sorted, l.total_co2_saved, l.total_points, l.rank_position, l.streak_days;

-- Recent activity view
CREATE OR REPLACE VIEW recent_activity AS
SELECT 
    se.id,
    se.user_id,
    u.full_name,
    se.items_json,
    se.decision,
    se.co2e_saved,
    se.created_at
FROM sort_events se
JOIN users u ON se.user_id = u.id
ORDER BY se.created_at DESC
LIMIT 100;

-- Challenge progress view
CREATE OR REPLACE VIEW challenge_progress AS
SELECT 
    c.id as challenge_id,
    c.title,
    c.challenge_type,
    c.target_items,
    c.target_co2,
    c.end_date,
    COUNT(cp.user_id) as participants,
    COUNT(CASE WHEN cp.completed_at IS NOT NULL THEN 1 END) as completed
FROM challenges c
LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
WHERE c.is_active = true
GROUP BY c.id, c.title, c.challenge_type, c.target_items, c.target_co2, c.end_date;

-- =============================================
-- INITIAL DATA SEEDING
-- =============================================

-- Insert default challenges
INSERT INTO challenges (title, description, challenge_type, target_items, target_co2, start_date, end_date, difficulty_level, reward_points) VALUES
('Recycling Rookie', 'Sort your first 10 items correctly', 'recycling', 10, 0.5, NOW(), NOW() + INTERVAL '30 days', 'easy', 50),
('Compost Champion', 'Compost 20 food items this month', 'compost', 20, 1.0, NOW(), NOW() + INTERVAL '30 days', 'medium', 100),
('Waste Warrior', 'Sort 100 items and save 5kg CO2', 'reduction', 100, 5.0, NOW(), NOW() + INTERVAL '60 days', 'hard', 500),
('Eco Educator', 'Help 5 friends start using ReBin Pro', 'education', 5, 0, NOW(), NOW() + INTERVAL '90 days', 'medium', 200)
ON CONFLICT DO NOTHING;

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON TABLE users IS 'User accounts and profile information';
COMMENT ON TABLE sort_events IS 'Individual waste sorting events and decisions';
COMMENT ON TABLE policies IS 'Local recycling and waste policies by ZIP code';
COMMENT ON TABLE user_preferences IS 'User customization and settings';
COMMENT ON TABLE achievements IS 'User achievements and badges earned';
COMMENT ON TABLE challenges IS 'Community challenges and competitions';
COMMENT ON TABLE challenge_participants IS 'User participation in challenges';
COMMENT ON TABLE user_sessions IS 'User session tracking for analytics';
COMMENT ON TABLE analytics_events IS 'Detailed analytics and user behavior tracking';
COMMENT ON TABLE feedback IS 'User feedback on sorting decisions';
COMMENT ON TABLE leaderboard IS 'User rankings and statistics (materialized)';

COMMENT ON FUNCTION update_leaderboard() IS 'Updates leaderboard when new sort events are added';
COMMENT ON FUNCTION check_achievements(UUID) IS 'Checks and awards achievements based on user activity';
COMMENT ON FUNCTION update_leaderboard_rankings() IS 'Updates rank positions in leaderboard';
