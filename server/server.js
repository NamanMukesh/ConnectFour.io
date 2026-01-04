import express from "express";
import http from "http";
import { config } from "./config/config.js";
import { setupWebSocket } from "./websocket/websocket.js";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(express.static("../client/public"));

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
      leaderboard: "/api/leaderboard"
    }
  });
});

setupWebSocket(server);

server.listen(config.port, () => {
  console.log(`🚀 Server running on http://localhost:${config.port}`);
});

export { server, app };

