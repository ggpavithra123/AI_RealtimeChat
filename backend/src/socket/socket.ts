import { Server } from "socket.io";
import http from "http";
import express from "express";
import cors from "cors";

export const initSocketServer = () => {
  const app = express();

  app.use(
    cors({
      origin: "https://ai-realtime-chat-3ccw.vercel.app/",
      credentials: true,
    })
  );

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: "https://ai-realtime-chat-3ccw.vercel.app/",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // socket.id -> userId
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);

    socket.on("user:online", (userId) => {
      console.log("User online:", userId);

      // store relationship
      onlineUsers.set(socket.id, userId);

      // send list to all
      io.emit("online:users", [...onlineUsers.values()]);
    });

    socket.on("disconnect", () => {
      const userId = onlineUsers.get(socket.id);
      console.log("🔴 Disconnected:", userId);

      onlineUsers.delete(socket.id);

      io.emit("online:users", [...onlineUsers.values()]);
    });
  });

  server.listen(6000, () => {
    console.log("🚀 Socket server running on 6000");
  });
};
