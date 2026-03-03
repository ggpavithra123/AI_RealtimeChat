"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = void 0;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const initSocketServer = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: "http://localhost:5174",
        credentials: true,
    }));
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "http://localhost:5174",
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
    server.listen(5000, () => {
        console.log("🚀 Socket server running on 5000");
    });
};
exports.initSocketServer = initSocketServer;
