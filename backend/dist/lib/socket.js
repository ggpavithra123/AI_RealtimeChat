"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitChatAI = exports.emitLastMessageToParticipants = exports.emitNewMessageToChatRoom = exports.emitNewChatToParticpants = exports.initializeSocket = void 0;
const socket_io_1 = require("socket.io");
const env_config_1 = require("../config/env.config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const chat_controller_1 = require("../controllers/chat.controller");
let io = null;
const onlineUsers = new Map();
const initializeSocket = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "http://localhost:5174",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.use(async (socket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;
            if (!rawCookie)
                return next(new Error("Unauthorized"));
            const token = rawCookie?.split("=")?.[1]?.trim();
            if (!token)
                return next(new Error("Unauthorized"));
            const decodedToken = jsonwebtoken_1.default.verify(token, env_config_1.Env.JWT_SECRET);
            if (!decodedToken)
                return next(new Error("Unauthorized"));
            socket.userId = decodedToken.userId;
            next();
        }
        catch (error) {
            next(new Error("Internal server error"));
        }
    });
    io.on("connection", (socket) => {
        const userId = socket.userId;
        console.log("userId is:", socket.userId);
        const newSocketId = socket.id;
        if (!socket.userId) {
            socket.disconnect(true);
            return;
        }
        //register socket for the user
        onlineUsers.set(userId, newSocketId);
        //BroadCast online users to all socket
        io?.emit("online:users", Array.from(onlineUsers.keys()));
        console.log("online:users", Array.from(onlineUsers.keys()));
        //create personnal room for user
        socket.join(`user:${userId}`);
        socket.on("chat:join", async (chatId, callback) => {
            try {
                await (0, chat_controller_1.validateChatParticipant)(chatId, userId);
                socket.join(`chat:${chatId}`);
                console.log(`User ${userId} join room chat:${chatId}`);
                callback?.();
            }
            catch (error) {
                callback?.("Error joining chat");
            }
        });
        socket.on("chat:leave", (chatId) => {
            if (chatId) {
                socket.leave(`chat:${chatId}`);
                console.log(`User ${userId} left room chat:${chatId}`);
            }
        });
        socket.on("disconnect", () => {
            if (onlineUsers.get(userId) === newSocketId) {
                if (userId)
                    onlineUsers.delete(userId);
                io?.emit("online:users", Array.from(onlineUsers.keys()));
                console.log("socket disconnected", {
                    userId,
                    newSocketId,
                });
            }
        });
    });
};
exports.initializeSocket = initializeSocket;
function getIO() {
    if (!io)
        throw new Error("Socket.IO not initialized");
    return io;
}
const emitNewChatToParticpants = (participantIds = [], chat) => {
    const io = getIO();
    for (const participantId of participantIds) {
        io.to(`user:${participantId}`).emit("chat:new", chat);
    }
};
exports.emitNewChatToParticpants = emitNewChatToParticpants;
const emitNewMessageToChatRoom = (senderId, //userId that sent the message
chatId, message) => {
    const io = getIO();
    const senderSocketId = onlineUsers.get(senderId?.toString());
    console.log(senderId, "senderId");
    console.log(senderSocketId, "sender socketid exist");
    console.log("All online users:", Object.fromEntries(onlineUsers));
    if (senderSocketId) {
        io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
    }
    else {
        io.to(`chat:${chatId}`).emit("message:new", message);
    }
};
exports.emitNewMessageToChatRoom = emitNewMessageToChatRoom;
const emitLastMessageToParticipants = (participantIds, chat, lastMessage) => {
    const io = getIO();
    const payload = { chat, lastMessage };
    for (const participantId of participantIds) {
        io.to(`user:${participantId}`).emit("chat:update", payload);
    }
};
exports.emitLastMessageToParticipants = emitLastMessageToParticipants;
const emitChatAI = ({ chatId, chunk = null, sender, done = false, message = null, }) => {
    const io = getIO();
    if (chunk?.trim() && !done) {
        io.to(`chat:${chatId}`).emit("chat:ai", {
            chatId,
            chunk,
            done,
            message: null,
            sender
        });
        return;
    }
    if (done) {
        io.to(`chat:${chatId}`).emit("chat:ai", {
            chatId,
            chunk: null,
            done,
            message,
            sender
        });
        return;
    }
};
exports.emitChatAI = emitChatAI;
