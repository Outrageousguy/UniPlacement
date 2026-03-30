import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { cronScheduler } from "./cron";

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle only the dedicated /ws path so Vite HMR /vite/ws is unaffected
httpServer.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/ws')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

// WebSocket connection management
interface WSClient {
  ws: WebSocket;
  userId: number;
  userType: 'student' | 'coordinator';
  isAlive: boolean;
}

const connectedClients = new Map<number, WSClient>();

// Broadcast to specific user
export function broadcastToUser(userId: number, message: any) {
  const client = connectedClients.get(userId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

// Broadcast to all connected clients
function broadcastToAll(message: any) {
  connectedClients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

// Broadcast online status updates
function broadcastOnlineStatus() {
  const onlineUsers = Array.from(connectedClients.entries()).map(([userId, client]) => ({
    userId,
    userType: client.userType,
    isOnline: true
  }));

  broadcastToAll({
    type: 'online_status_update',
    data: onlineUsers
  });
}

// WebSocket connection handler
wss.on('connection', (ws: WebSocket, req) => {
  let authenticatedUser: { id: number; type: 'student' | 'coordinator' } | null = null;

  // Handle incoming messages
  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'authenticate':
          // Authenticate user based on session or token
          // For now, we'll use a simple approach - in production you'd validate JWT/session
          if (message.userId && message.userType) {
            authenticatedUser = { id: message.userId, type: message.userType };

            // Add to connected clients
            connectedClients.set(message.userId, {
              ws,
              userId: message.userId,
              userType: message.userType,
              isAlive: true
            });

            // Send confirmation
            ws.send(JSON.stringify({
              type: 'authenticated',
              data: { success: true }
            }));

            // Broadcast updated online status
            broadcastOnlineStatus();
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Authentication failed' }
            }));
          }
          break;

        case 'message':
          if (!authenticatedUser) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Not authenticated' }
            }));
            return;
          }

          // Broadcast message to recipient
          if (message.data && message.data.receiverId) {
            broadcastToUser(message.data.receiverId, {
              type: 'new_message',
              data: {
                ...message.data,
                senderId: authenticatedUser.id,
                timestamp: new Date().toISOString()
              }
            });

            // Also send back to sender for confirmation
            ws.send(JSON.stringify({
              type: 'message_sent',
              data: message.data
            }));
          }
          break;

        case 'typing':
          if (authenticatedUser && message.data && message.data.receiverId) {
            broadcastToUser(message.data.receiverId, {
              type: 'typing',
              data: {
                senderId: authenticatedUser.id,
                isTyping: message.data.isTyping
              }
            });
          }
          break;

        default:
          ws.send(JSON.stringify({
            type: 'error',
            data: { message: 'Unknown message type' }
          }));
      }
    } catch (error) {
      log(`WebSocket message error: ${error}`, 'websocket');
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    if (authenticatedUser) {
      connectedClients.delete(authenticatedUser.id);
      broadcastOnlineStatus();
    }
  });

  // Handle ping/pong for connection health
  ws.on('pong', () => {
    if (authenticatedUser) {
      const client = connectedClients.get(authenticatedUser.id);
      if (client) {
        client.isAlive = true;
      }
    }
  });
});

// Ping clients to check if they're still alive
const pingInterval = setInterval(() => {
  connectedClients.forEach((client, userId) => {
    if (!client.isAlive) {
      client.ws.terminate();
      connectedClients.delete(userId);
      broadcastOnlineStatus();
      return;
    }

    client.isAlive = false;
    client.ws.ping();
  });
}, 30000);

// Clean up interval on server close
httpServer.on('close', () => {
  clearInterval(pingInterval);
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
    limit: '10mb',
  }),
);

app.set("etag", false);

app.use("/api", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(express.urlencoded({ extended: false, limit: '10mb' }));

export function log(message: string, source = "express") {
  // Only log in development or for important messages
  if (process.env.NODE_ENV !== "production" || source === "error") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} [${source}] ${message}`);
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    // Only log API requests in development, and don't log response bodies
    if (path.startsWith("/api") && process.env.NODE_ENV !== "production") {
      const logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.


  const port = parseInt(process.env.PORT || "5005", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port http://localhost:${port}`);
      
      // Start the cron scheduler after server is ready
      if (process.env.NODE_ENV === "production") {
        cronScheduler.start();
        log("Cron scheduler started for production");
      } else {
        log("Cron scheduler disabled in development");
      }
    },
  );
})();

// Only log DB URL in development
if (process.env.NODE_ENV !== "production") {
  console.log("DB URL:", process.env.DATABASE_URL);
}
