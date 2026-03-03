"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const env_config_1 = require("./config/env.config");
const asyncHandler_middleware_1 = require("./middleware/asyncHandler.middleware");
const errorHandler_middleware_1 = require("./middleware/errorHandler.middleware");
const http_config_1 = require("./config/http.config");
require("./config/passport.config");
const database_config_1 = __importDefault(require("./config/database.config"));
const passport_1 = __importDefault(require("passport"));
const routes_1 = __importDefault(require("./routes"));
const socket_1 = require("./lib/socket");
const app = (0, express_1.default)();
const socket_io_1 = require("socket.io");
const server = http_1.default.createServer(app);
//socket
(0, socket_1.initializeSocket)(server);
app.use(express_1.default.json({ limit: "100mb" }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: env_config_1.Env.FRONTEND_ORIGIN,
    credentials: true,
}));
// ✅ Same for Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:5174",
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
app.use(passport_1.default.initialize());
app.use("/api", routes_1.default);
app.get("/health", (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Server is healthy",
        status: "OK",
    });
}));
app.use(errorHandler_middleware_1.errorHandler);
server.listen(env_config_1.Env.PORT, async () => {
    await (0, database_config_1.default)();
    console.log(`Server running on port ${env_config_1.Env.PORT} in ${env_config_1.Env.NODE_ENV} mode`);
    (0, socket_1.initializeSocket)(server);
    //initSocketServer();
});
