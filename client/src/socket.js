import { io } from "socket.io-client";

// ✅ Connect to your socket server port 3000
export const socket = io("http://localhost:6000", {
  withCredentials: true,
  transports: ["websocket"], // use WebSocket directly
});

// Optional: log connection
socket.on("connect", () => {
  console.log("✅ Connected to WebSocket:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from WebSocket");
});
