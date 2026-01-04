import express from "express";
import "dotenv/config.js";  
import http from "http";
import cors from "cors";
import { config } from "./config/App.config.js";
import { setupWebSocket } from "./websocket/websocket.js";
import { testConnection } from "./config/Db.config.js";
import { getLeaderboard, getPlayerStats } from "./controllers/Leaderboard.controller.js";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());

const allowedOrigins = [
  "http://localhost:5173", // Vite
  process.env.FRONTEND_URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Connect Four Server is running",
    port: config.port 
  });
});

app.get("/", (req, res) => {
  res.json({ 
    message: "Connect Four API",
    endpoints: {
      health: "/health",
      leaderboard: "/api/leaderboard",
      playerStats: "/api/leaderboard/:username"
    }
  });
});

// API Routes
app.get("/api/leaderboard", getLeaderboard);
app.get("/api/leaderboard/:username", getPlayerStats);


async function startServer() {
  try {
    await testConnection();

    setupWebSocket(server);

    server.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${config.port}/ws`);
      console.log(`🔍 Waiting for client connections...`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
}

startServer();

export { server, app };

