# ReBin Community Features Access Guide

## Overview

Your ReBin application now includes the beautiful staging UI design combined with powerful community features. Here's how to access and use all the community features.

## 🎯 Community Features Available

### 1. **Leaderboard** (`/leaderboard`)

- **What it is**: See how you rank against other users in environmental impact
- **Features**:
  - Real-time rankings with virtualized scrolling for performance
  - Filter by timeframe (Today, This Week, This Month, This Year, All Time)
  - Filter by category (Overall, Recycling, Composting, Reduction)
  - View user stats: Score, Items Sorted, CO₂ Saved, Achievements
  - Real-time updates when new sort events occur

### 2. **Challenge System** (`/challenges`)

- **What it is**: Join community challenges to reduce waste and earn rewards
- **Features**:
  - Browse active, upcoming, and completed challenges
  - Filter by category (Recycling, Composting, Reduction, Education)
  - Join challenges and track progress
  - View rewards and rules for each challenge
  - Real-time updates on challenge participation

### 3. **Achievement System** (`/achievements`)

- **What it is**: Unlock badges and achievements as you make sustainable choices
- **Features**:
  - View all available achievements with rarity levels (Common, Rare, Epic, Legendary)
  - Filter by status (All, Unlocked, Locked) and category
  - Track progress toward unlocking achievements
  - View requirements and rewards for each achievement
  - Real-time notifications when achievements are unlocked

### 4. **Dashboard/Stats** (`/dashboard`)

- **What it is**: Monitor your environmental impact with detailed analytics
- **Features**:
  - Real-time statistics and progress tracking
  - Environmental impact metrics
  - Personal sorting history and trends

## 🚀 How to Access Community Features

### Method 1: Desktop Navigation (Header)

1. **Sign in** to your account (required for community features)
2. Once logged in, you'll see a "Community:" section in the header navigation
3. Click on any of the community feature buttons:
   - 🏆 **Leaderboard** - View rankings
   - 🎯 **Challenges** - Join challenges
   - 🏅 **Achievements** - View badges
   - 📊 **Dashboard** - View stats

### Method 2: Mobile Navigation

1. **Sign in** to your account
2. Use the **bottom navigation bar** on mobile devices:
   - Tap the bottom navigation icons to access features
   - Use the "More" button to access additional features
3. Or use the **mobile menu** (hamburger icon):
   - Tap the menu icon in the top-left
   - Scroll to "Community Features" section
   - Tap any feature to navigate

### Method 3: Direct URL Access

You can directly navigate to any community feature using these URLs:

- `http://localhost:3000/leaderboard`
- `http://localhost:3000/challenges`
- `http://localhost:3000/achievements`
- `http://localhost:3000/dashboard`

## 🔐 Authentication Requirements

**Important**: All community features require user authentication. You must:

1. **Sign up** for an account at `/register`
2. **Sign in** at `/login`
3. Once authenticated, all community features become accessible

## 📱 Mobile Experience

The app includes a comprehensive mobile experience:

- **Bottom navigation bar** with quick access to main features
- **Mobile menu overlay** for additional features
- **Responsive design** that works on all screen sizes
- **Touch-optimized** interface for mobile users

## 🎨 UI Design Integration

The community features seamlessly integrate with the staging branch UI:

- **Consistent design language** with the main app
- **Earth background** and green color scheme maintained
- **Smooth transitions** and hover effects
- **Accessible design** with proper ARIA labels and keyboard navigation

## 🔄 Real-time Features

Many community features include real-time updates:

- **Leaderboard** updates when new sort events occur
- **Challenges** show live participant counts and progress
- **Achievements** notify when unlocked
- **Dashboard** displays live statistics

## 🛠️ Technical Features

- **Lazy loading** for optimal performance
- **Error boundaries** for graceful error handling
- **Loading states** with skeleton screens
- **Offline support** with offline indicators
- **PWA capabilities** for mobile app-like experience

## 🚀 Getting Started

1. **Start the development server**:

   ```bash
   cd frontend
   npm run dev
   ```

2. **Open your browser** to `http://localhost:3000`

3. **Sign up** for an account or **sign in** if you already have one

4. **Explore the community features** using any of the access methods above

## 📊 Data Flow

The community features are powered by:

- **Supabase** for real-time database operations
- **React Query** for efficient data fetching and caching
- **Real-time subscriptions** for live updates
- **Context providers** for state management

## 🎯 Next Steps

- Try sorting some items to see your impact on the leaderboard
- Join a challenge to start earning rewards
- Check your achievements to see what badges you can unlock
- Monitor your progress on the dashboard

---

**Note**: The community features are fully functional and ready to use. The UI maintains the beautiful staging design while providing access to all the powerful community functionality you've built.
