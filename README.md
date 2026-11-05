# 🎬 CineMate — Watch Together, Anywhere

> A real-time synchronized social movie-watching and video-calling web application tailored for two people in a long-distance relationship or friendship.

---

## 🌟 Highlights & Features

- **Sub-Second Synchronized Playback**:
  - Play, pause, seek, and drift recovery powered by Socket.IO with sequence-ordered events.
  - Periodic drift audit detects out-of-sync playback and corrects timestamps automatically.
  - Multi-provider architecture with native adapters:
    - **YouTube** (Official IFrame API with custom synced controls)
    - **HTML5 Direct Files** (`.mp4`, `.webm`, `.ogg`, `.mov`)
    - **Vimeo** (Official Player SDK)
    - **Generic Embed** (Graceful fallback for permitted third-party players with informative user banners)
- **Peer-to-Peer WebRTC Video Calling**:
  - Real-time low-latency face-to-face video and crystal-clear audio.
  - Microphone mute/unmute and Camera toggle controls.
  - STUN by default (`stun.l.google.com:19302`) with optional TURN support for restricted networks.
  - Clean avatar placeholders when camera is toggled off.
- **Interactive Live Chat & Floating Reactions**:
  - Instant messaging with participant names and timestamps.
  - Typing indicators (`Alex is typing...`).
  - One-click emoji reactions (`❤️`, `😂`, `🍿`, `🔥`, `🎉`) with celebration confetti!
  - System activity messages when someone joins or leaves.
- **Private 2-Person Ephemeral Rooms**:
  - Unpredictable 6-character room codes (e.g. `DLC6LF`).
  - One-click invite link copying (`http://localhost:5174/room/DLC6LF` or public URL).
  - Strict 2-participant limit enforcement with descriptive error states.
  - Automatic host promotion upon host disconnect.
  - Reconnect recovery that seamlessly restores room state upon network drops.
- **Modern Streaming-Platform UI/UX**:
  - Deep dark theme (`#09090F`, `#11111B`, `#181824`, `#8B5CF6`).
  - Responsive 70/30 split layout on desktop; adaptive stacked view on mobile.
  - Polished controls, accessible labels, tooltips, and animations.

---

## 🏗️ Project Architecture

```
Cinemate/
├── package.json               # Root scripts (dev, build, test, typecheck)
├── .env.example               # Environment variable templates
├── client/                    # Frontend React + Vite + TypeScript application
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Navbar, Footer
│   │   │   ├── movie/         # MoviePlayer, MovieUrlInput, PlaybackControls
│   │   │   ├── video/         # VideoCallPanel, VideoTile
│   │   │   ├── chat/          # ChatPanel
│   │   │   ├── room/          # RoomHeader
│   │   │   └── ui/            # Button, Input
│   │   ├── hooks/             # useSocket, useWebRTC, usePlaybackSync
│   │   ├── pages/             # LandingPage, CreateRoomPage, JoinRoomPage, WatchRoomPage, NotFoundPage
│   │   ├── services/
│   │   │   ├── socketService.ts
│   │   │   └── media/         # MediaProviderFactory, YouTubeProvider, HTML5Provider, VimeoProvider
│   │   ├── types/             # Room, playback, participant, chat interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
└── server/                    # Backend Node.js + Express + TypeScript + Socket.IO
    ├── src/
    │   ├── config/            # env.ts, socket.ts
    │   ├── rooms/             # roomManager.ts, roomEvents.ts
    │   ├── playback/          # playbackEvents.ts
    │   ├── chat/              # chatEvents.ts
    │   ├── webrtc/            # signalingEvents.ts
    │   ├── middleware/        # validation.ts (Zod schemas)
    │   ├── utils/             # logger.ts
    │   ├── __tests__/         # Vitest unit & E2E integration tests
    │   └── server.ts          # Express app & HTTP server entrypoint
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or later (Tested on Node v24)
- **npm**: v9.0.0 or later

### 2. Install Dependencies
```bash
# In the root repository directory
npm install
npm --prefix server install
npm --prefix client install
```

### 3. Environment Configuration
The `.env` files are already configured for local development.

- `server/.env`:
  ```ini
  SERVER_PORT=5000
  CLIENT_ORIGIN=http://localhost:5173
  TURN_URL=
  TURN_USERNAME=
  TURN_CREDENTIAL=
  ```
- `client/.env`:
  ```ini
  VITE_SERVER_URL=http://localhost:5000
  ```

### 4. Start Development Servers
You can run both client and backend concurrently with a single command from the project root:
```bash
npm run dev
```

Or run them individually in separate terminals:
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

- **Frontend Client**: `http://localhost:5174` (or `http://localhost:5173`)
- **Backend API & WebSockets**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/health`

---

## 🧪 Running Automated Tests

Run the test suite:
```bash
# Server unit tests
npm --prefix server run test

# Root typecheck across both packages
npm run typecheck

# Automated End-to-End Socket & WebRTC Integration Test
npx tsx server/src/__tests__/integrationTest.ts
```

All 6 unit tests and the end-to-end multi-user integration suite pass with 100% success.

---

## 👥 How to Test Multi-User Flows Locally (Two Browser Sessions)

1. Open **Browser 1** (e.g. Regular Chrome window): Navigate to `http://localhost:5174/`
2. Click **Create a Room**, enter **"Alice"**, and click **Start Watch Party**.
3. You will be redirected to the room (e.g., `http://localhost:5174/room/DLC6LF`).
4. Click **"Copy Invite Link"** in the top navigation bar.
5. Open **Browser 2** (e.g. Incognito window or Safari): Paste the invite link or go to `http://localhost:5174/join` and enter the 6-character room code.
6. Enter **"Bob"** and click **Join Party**.
7. **Test Playback Sync**:
   - In Alice's window, click one of the quick test sample buttons below the player (e.g. *Big Buck Bunny* or *Sintel Animated*).
   - Both Alice and Bob will see the player load the video instantly.
   - Click **Play** in Alice's window: both players start simultaneously.
   - Seek to a timestamp or press **Pause**: both windows update in real time.
8. **Test Video Call**:
   - In Alice's window, click **"Join Video Call"** in the right panel and allow camera/mic access when prompted.
   - In Bob's window, click **"Join Video Call"** and allow camera/mic access.
   - The WebRTC peer connection will negotiate over Socket.IO and establish direct peer-to-peer audio and video!
   - Test toggling **Camera Off** (displays custom avatar tile) and **Mic Mute** (shows mute indicator).
9. **Test Live Chat & Emoji Reactions**:
   - Type a chat message in either window and hit Enter.
   - Click emoji reactions (`❤️`, `🔥`, `🎉`) to trigger floating animated reactions and celebratory confetti!
10. **Test Reconnection & Capacity**:
    - Close Bob's tab and reopen the URL: Bob reconnects and room state is restored.
    - Open a 3rd window (User C): User C receives a clear *"Room is full (max 2 participants)"* message.

---

## 🌐 Public Access & Inviting a Remote Friend

To test with a friend in another city or on a different network:

### Option A: Secure Development Tunnel (Cloudflare Tunnel - Recommended)
1. Install Cloudflare tunnel:
   ```bash
   brew install cloudflared
   ```
2. Expose the frontend and backend:
   ```bash
   cloudflared tunnel --url http://localhost:5174
   ```
3. Update `VITE_SERVER_URL` in `client/.env` and CORS `CLIENT_ORIGIN` in `server/.env` to point to the secure tunnel URLs.

### Option B: Production Deployment
1. **Frontend**: Deploy `client/dist` on Vercel, Netlify, or Cloudflare Pages.
2. **Backend**: Deploy `server/` on Render, Railway, Fly.io, or DigitalOcean with Node.js and WebSocket support.
3. **TURN Server Setup**:
   - While public STUN (`stun:stun.l.google.com:19302`) works for ~85% of home NAT routers, symmetric NATs (cellular data, corporate or university firewalls) require a TURN relay.
   - Supply TURN credentials in `server/.env`:
     ```ini
     TURN_URL=turn:turn.yourdomain.com:3478
     TURN_USERNAME=your-username
     TURN_CREDENTIAL=your-password
     ```
   - Free/cheap hosted TURN providers include **Metered.ca** or **Twilio Network Traversal Service**, or a self-hosted **coturn** instance.

---

## 🔒 Security & Media Limitations

- **DRM & Provider Security**: CineMate uses official embed APIs (YouTube IFrame Player API, Vimeo SDK) and direct HTML5 video playback. It does **not** scrape, pirate, download, or bypass DRM/paywalls.
- **CORS & Autoplay**: Modern browsers require user interaction before playing audio. CineMate provides informative UI banners if a browser autoplay policy requires an initial click.
- **No SSRF / URL Injection**: All user inputs and media URLs are validated strictly with Zod schemas to permit only safe HTTP/HTTPS protocols.

