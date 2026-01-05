
# 🎯 4 in a Row — Connect Four (Real-Time Multiplayer)

A real-time multiplayer Connect Four game with a bot fallback, built with Node.js, WebSockets, React (Vite), and Supabase. If no opponent joins within 10 seconds the player will be matched with a bot.

---

## 🚀 Features

- Real-time multiplayer gameplay via WebSockets
- Bot fallback when no opponent joins
- Player reconnection (30-second window)
- Server-authoritative game logic
- Persistent leaderboard stored in Supabase

---

## Tech Stack

- Frontend: React (Vite) + Tailwind CSS
- Backend: Node.js + Express + WS (WebSocket server)
- Persistence: Supabase (Postgres)

---

## Quickstart (Local)

1. Clone the repo

```bash
git clone https://github.com/NamanMukesh/ConnectFour.io.git
cd ConnectFour.io
```

2. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

3. Create Supabase tables

- Create a Supabase project and open SQL Editor
- Run the SQL in `server/database/supabase-schema.sql`

4. Add environment variables

- `server/.env` (example):

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
```

- `client/.env` (example — used at build time):

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001/ws
```

5. Run locally

```bash
# start backend
cd server
npm run server

# start frontend (in another terminal)
cd ../client
npm run dev
```

Open the frontend at `http://localhost:5173`.

---
## How to Play

- Enter a username
- Wait for another player or bot
- Click a column to drop your disc
- First to connect 4 in a row wins (horizontal, vertical, diagonal)
- Leaderboard updates automatically

---

## Kafka Analytics

Kafka is used to simulate real-world event-driven analytics.

The backend emits Kafka events when:

A game starts
A move is made
A game ends (win/draw)

Example event:
```bash
{
  "type": "GAME_ENDED",
  "payload": {
    "gameId": "uuid",
    "winner": "player1",
    "durationMs": 84231
  },
  "timestamp": 1700000000000
}
```
---

### What can be tracked?

Using a Kafka consumer you can calculate:

Average game duration
Games per hour/day
Win-rate per player
Bot vs human stats
Most frequent winners

---

## Project structure (high level)

```
ConnectFour.io/
├── server/
│   ├── analytics/         # Kafka Analytics
│   ├── bot/               # Bot AI logic
│   ├── config/            # Configurations
│   ├── controllers/       # REST controllers
│   ├── database/          # Supabase SQL schema
│   ├── game/              # Core game logic
│   ├── kafka/             # Kafka Files
│   ├── models/            # DB models
│   ├── services/          # Matchmaking & game services
│   ├── websocket/         # WebSocket handlers
│   ├── server.js          # Entry point
│   └── package.json
│
├── client/
│ ├── src/
│ │ ├── components/ # React components
│ │ ├── App.jsx # Main React component
│ │ ├── main.jsx # React entry file
│ │ └── index.css # Global styles
│ ├── public/
│ ├── vite.config.js
│ └── package.json
│
├── .gitignore
└── README.md
```