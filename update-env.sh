#!/bin/bash

# Script to update .env file with Supabase credentials
echo "🔧 Updating .env file with Supabase credentials..."

# Check if .env file exists
if [ ! -f "frontend/.env" ]; then
    echo "❌ .env file not found. Creating it..."
    cat > frontend/.env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
EOF
fi

echo "📝 Current .env file:"
cat frontend/.env

echo ""
echo "🔧 To update with your credentials:"
echo "1. Get your Supabase URL and anon key from your Supabase dashboard"
echo "2. Run: nano frontend/.env"
echo "3. Replace 'your_supabase_url_here' with your Project URL"
echo "4. Replace 'your_supabase_anon_key_here' with your anon key"
echo "5. Save and exit (Ctrl+X, Y, Enter)"
echo ""
echo "📖 Or use this command (replace with your actual values):"
echo "sed -i '' 's/your_supabase_url_here/YOUR_ACTUAL_URL/g' frontend/.env"
echo "sed -i '' 's/your_supabase_anon_key_here/YOUR_ACTUAL_KEY/g' frontend/.env"

