import "dotenv/config";
import http from "http";
import express, { Request, Response, Router } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Env } from "./config/env.config";
import { asyncHandler } from "./middleware/asyncHandler.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import "./config/passport.config";
import connectDatabase from "./config/database.config";
import passport from "passport";
import router from "./routes";
import { initializeSocket } from "./lib/socket";
const app = express();
import { Server } from "socket.io";
const server = http.createServer(app);
import { initSocketServer } from "./socket/socket"; // ✅ import socket server

//socket
initializeSocket(server);

app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

// ✅ Same for Socket.IO
const io = new Server(server, {
  cors: {
    origin: "https://ai-realtime-chat-3ccw.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});
app.use(passport.initialize());

app.use("/api",router); 

app.get(
  "/health",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
      message: "Server is healthy",
      status: "OK",
    });
  })
);

app.use(errorHandler);
const PORT = Number(process.env.PORT)|| 9000;

server.listen(PORT, "0.0.0.0", async () => {
  await connectDatabase();
  console.log(`Server running on port ${PORT}`);
});;
