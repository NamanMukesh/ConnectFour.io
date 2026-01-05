import express from "express";
import "dotenv/config.js";  
import http from "http";
import cors from "cors";
import { config } from "./config/App.config.js";
import { setupWebSocket } from "./websocket/websocket.js";
import { testConnection } from "./config/Db.config.js";
import { getLeaderboard, getPlayerStats } from "./controllers/Leaderboard.controller.js";
import { initProducer } from './kafka/producer.kafka.js';


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

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

    try {
      await initProducer();
    } catch (err) {
      console.warn('Kafka init failed, continuing without analytics');
    }

    server.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
      console.log(`WebSocket endpoint port: ${PORT}/ws`);
      console.log(`Waiting for client connections...`);
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
}

startServer();

export { server, app };

