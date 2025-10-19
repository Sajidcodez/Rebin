import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error(
    "❌ Supabase environment variables not found!\n" +
      "Please create a .env file in the frontend directory with:\n" +
      "VITE_SUPABASE_URL=your_supabase_url\n" +
      "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key\n\n" +
      "See SUPABASE_SETUP.md for detailed instructions."
  );
  throw new Error("Supabase environment variables are required");
}

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Enable email confirmation for production
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configure email templates and redirect URLs
    flowType: "pkce",
  },
  // Enable real-time subscriptions
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
