-- ============================================================================
-- USER PROFILE TRIGGER
-- ============================================================================
-- This trigger automatically creates a user profile in the users table
-- whenever a new user signs up in Supabase Auth

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the new user into our custom users table
  INSERT INTO public.users (
    id,
    email,
    full_name,
    metadata,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    COALESCE(NEW.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    metadata = EXCLUDED.metadata,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- USER PROFILE UPDATE TRIGGER
-- ============================================================================
-- This trigger updates the users table when auth.users is updated

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user in our custom users table
  UPDATE public.users SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
    metadata = COALESCE(NEW.raw_user_meta_data, metadata),
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, email_verified),
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the update trigger
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant necessary permissions for the trigger functions

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_preferences TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.achievements TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.challenges TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.challenge_participants TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.user_sessions TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.analytics_events TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.feedback TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.leaderboard TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.sort_events TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.policies TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new user signs up';
COMMENT ON FUNCTION public.handle_user_update() IS 'Updates user profile when auth user data changes';
