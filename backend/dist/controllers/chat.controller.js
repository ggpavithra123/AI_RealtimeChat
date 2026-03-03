"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChatParticipant = exports.getSingleChatController = exports.getUserChatsController = exports.createChatController = void 0;
//import { asyncHandler } from "../middlewares/asyncHandler.middleware";
const http_config_1 = require("../config/http.config");
const chat_validator_1 = require("../validators/chat.validator");
const chat_service_1 = require("../services/chat.service");
const asyncHandler_middleware_1 = require("../middleware/asyncHandler.middleware");
const chat_model_1 = __importDefault(require("../models/chat.model"));
const app_error_1 = require("../utils/app-error");
exports.createChatController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const body = chat_validator_1.createChatSchema.parse(req.body);
    const chat = await (0, chat_service_1.createChatService)(userId, body);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "Chat created or retrieved successfully",
        chat,
    });
});
exports.getUserChatsController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const chats = await (0, chat_service_1.getUserChatsService)(userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "User chats retrieved successfully",
        chats,
    });
});
exports.getSingleChatController = (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?._id;
    const { id } = chat_validator_1.chatIdSchema.parse(req.params);
    const { chat, messages } = await (0, chat_service_1.getSingleChatService)(id, userId);
    return res.status(http_config_1.HTTPSTATUS.OK).json({
        message: "User chats retrieved successfully",
        chat,
        messages,
    });
});
const validateChatParticipant = async (chatId, userId) => {
    const chat = await chat_model_1.default.findOne({
        _id: chatId,
        participants: {
            $in: [userId],
        },
    });
    if (!chat)
        throw new app_error_1.BadRequestException("User not a participant in chat");
    return chat;
};
exports.validateChatParticipant = validateChatParticipant;
