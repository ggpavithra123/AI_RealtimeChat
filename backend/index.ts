import "dotenv/config";
import http from "http";
import express, { Request, Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";

import { asyncHandler } from "./middleware/asyncHandler.middleware";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import connectDatabase from "./config/database.config";
import router from "./routes";
import "./config/passport.config";

const app = express();
const server = http.createServer(app);

// ============================
// CORS CONFIG (FIXED)
// ============================

const allowedOrigins = [
  "http://localhost:5174",
  "https://ai-realtime-chat-3ccw.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Handle preflight requests
app.options("/*", cors());

// ============================
// MIDDLEWARES
// ============================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ============================
// ROUTES
// ============================

app.use("/api", router);

app.get(
  "/health",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(HTTPSTATUS.OK).json({
      message: "Server is healthy",
      status: "OK",
    });
  })
);

// ============================
// ERROR HANDLER
// ============================

app.use(errorHandler);

// ============================
// SERVER START
// ============================

const PORT = Number(process.env.PORT) || 9000;

server.listen(PORT, "0.0.0.0", async () => {
  try {
    await connectDatabase();
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
});
