# Pressbox 🏟️

A personal game threads app for NFL and NBA. View and participate in Reddit game threads with a beautiful, mobile-first UI.

## Features

- **Live Game Schedule**: See today's NFL and NBA games with live scores from ESPN
- **Game Thread Discovery**: Automatically finds game threads from r/nfl, r/nba, and team subreddits
- **Live Comments**: Real-time comment streaming with play/pause (prevent spoilers!)
- **Full Reddit Integration**: Comment, upvote/downvote with your Reddit account
- **PWA Support**: Add to iPhone home screen for app-like experience

## Setup

### 1. Create a Reddit App

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app..."
3. Fill in:
   - **Name**: Pressbox (or whatever you want)
   - **Type**: Select "web app"
   - **Redirect URI**: `http://localhost:3000/auth/callback`
4. Click "create app"
5. Note your **Client ID** (the string under your app name) and **Client Secret** (click "edit" to see it)

### 2. Configure Environment

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_REDDIT_REDIRECT_URI=http://localhost:3000/auth/callback
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. Add to iPhone Home Screen (Optional)

1. Open the app in Safari on your iPhone
2. Tap the Share button
3. Tap "Add to Home Screen"
4. Now you have an app-like icon!

## How It Works

1. **Game List**: Shows today's games from ESPN's free API (no key required)
2. **Thread Discovery**: When you tap a game, searches r/nfl or r/nba plus team subreddits for game threads
3. **Comments**: Fetches comments with live refresh (every 5 seconds when enabled)
4. **Authentication**: Uses Reddit OAuth to let you comment and vote

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS**
- **Reddit OAuth** for authentication
- **ESPN API** for live scores (free, no key)

## API Rate Limits

Reddit's free tier allows:
- 100 requests/minute with OAuth
- This is plenty for personal use

## Future Ideas

- [ ] Add more sports (NHL, MLB, soccer)
- [ ] Reply to specific comments
- [ ] Comment flair display
- [ ] Push notifications for game start
- [ ] Offline caching
