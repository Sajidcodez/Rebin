-- Minimal setup for community features
-- This creates only the essential tables needed for leaderboard, challenges, and achievements

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (if it doesn't exist)
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

-- Create sort_events table (if it doesn't exist)
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

-- Create leaderboard table
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

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_data JSONB DEFAULT '{}'::jsonb,
    points INTEGER DEFAULT 0,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_type)
);

-- Create challenges table
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

-- Create challenge_participants table
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

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sort_events_user_id ON sort_events(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sort_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own sort events" ON sort_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sort events" ON sort_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Users can view their own achievements" ON achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view active challenges" ON challenges FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view their own challenge participation" ON challenge_participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can join challenges" ON challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert some sample challenges
INSERT INTO challenges (title, description, challenge_type, target_items, target_co2, start_date, end_date, difficulty_level, reward_points) VALUES
('Spring Cleaning Challenge', 'Sort 100 items correctly this month', 'recycling', 100, 5.0, NOW(), NOW() + INTERVAL '30 days', 'medium', 200),
('Plastic-Free Week', 'Avoid plastic items for a week', 'reduction', 20, 2.0, NOW(), NOW() + INTERVAL '7 days', 'easy', 100),
('Compost Champions', 'Compost 50 food items', 'compost', 50, 3.0, NOW(), NOW() + INTERVAL '14 days', 'medium', 150),
('Zero Waste Hero', 'Sort 200 items with 95% accuracy', 'recycling', 200, 10.0, NOW(), NOW() + INTERVAL '60 days', 'hard', 500),
('Community Cleanup', 'Get 100 people to join ReBin Pro', 'education', 100, 0, NOW(), NOW() + INTERVAL '90 days', 'medium', 300)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE users IS 'User accounts and profile information';
COMMENT ON TABLE sort_events IS 'Individual waste sorting events and decisions';
COMMENT ON TABLE leaderboard IS 'User rankings and statistics';
COMMENT ON TABLE achievements IS 'User achievements and badges earned';
COMMENT ON TABLE challenges IS 'Community challenges and competitions';
COMMENT ON TABLE challenge_participants IS 'User participation in challenges';

