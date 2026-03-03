import { io, Socket } from "socket.io-client";
import { create } from "zustand";

const BASE_URL =
  import.meta.env.MODE === "development" ? import.meta.env.VITE_API_URL : "/";

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  connectSocket: () => void;
  disconnectSocket: () => void;
}

export const useSocket = create<SocketState>()((set, get) => ({
  socket: null,
  onlineUsers: [],

  connectSocket: () => {
    const { socket } = get();
    console.log(socket, "socket");
    
    // If socket exists and is connected, don't create a new one
    if (socket?.connected) return;

    // If socket exists but not connected, clean it up first
    if (socket && !socket.connected) {
      socket.off("online:users");
      socket.off("connect");
      socket.disconnect();
    }

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      autoConnect: true,
    });

    // Set up listeners BEFORE setting the socket to ensure they're ready
    // Use .on() instead of .once() to continuously listen for online user updates
    // This ensures all clients receive updates when users come online/offline
    newSocket.on("online:users", (userIds: string[]) => {
      console.log("Online users updated:", userIds);
      set({ onlineUsers: userIds });
    });

    newSocket.on("connect", () => {
      console.log("Socket connected", newSocket.id);
      // Server automatically sends online users list when user connects
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    set({ socket: newSocket });
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.off("online:users"); // Remove listeners
      socket.off("connect");
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));