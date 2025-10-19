#!/bin/bash

# Supabase Setup Script for ReBin Pro
echo "🚀 Setting up Supabase for ReBin Pro..."

# Check if .env file exists
if [ -f "frontend/.env" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp frontend/.env frontend/.env.backup
fi

# Create .env file
echo "📝 Creating .env file..."
cat > frontend/.env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
EOF

echo "✅ .env file created!"
echo ""
echo "🔧 Next steps:"
echo "1. Go to your Supabase dashboard (https://supabase.com)"
echo "2. Create a new project or select existing project"
echo "3. Go to Settings → API"
echo "4. Copy your Project URL and anon public key"
echo "5. Update the .env file with your actual values:"
echo "   - Replace 'your_supabase_url_here' with your Project URL"
echo "   - Replace 'your_supabase_anon_key_here' with your anon key"
echo ""
echo "6. Set up the database schema:"
echo "   - Go to SQL Editor in Supabase dashboard"
echo "   - Copy and paste the contents of database/schema.sql"
echo "   - Click Run to create all tables"
echo ""
echo "7. Configure authentication:"
echo "   - Go to Authentication → Settings"
echo "   - Set Site URL to: http://localhost:5179"
echo "   - Add Redirect URL: http://localhost:5179/**"
echo "   - Turn OFF email confirmations for development"
echo ""
echo "8. Restart your development server:"
echo "   cd frontend && npm run dev"
echo ""
echo "📖 For detailed instructions, see SUPABASE_SETUP.md"

