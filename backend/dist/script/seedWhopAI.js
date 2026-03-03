"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWhoopAI = void 0;
require("dotenv/config");
const user_model_1 = __importDefault(require("../models/user.model"));
const database_config_1 = __importDefault(require("../config/database.config"));
const CreateWhoopAI = async () => {
    const existingAI = await user_model_1.default.findOne({ isAI: true });
    if (existingAI) {
        await user_model_1.default.deleteOne({ _id: existingAI._id });
        console.log("Deleted existing Whoop AI user");
    }
    const whopAI = await user_model_1.default.create({
        name: "Whoop AI",
        isAI: true,
        avatar: "https://res.cloudinary.com/dp9vvlndo/image/upload/v1759925671/ai_logo_qqman8.png",
    });
    console.log("Whoop AI created:", whopAI._id);
    return whopAI;
};
exports.CreateWhoopAI = CreateWhoopAI;
const seedWhoopAI = async () => {
    try {
        await (0, database_config_1.default)();
        console.log("Database connected");
        await (0, exports.CreateWhoopAI)();
        console.log("Seeding completed");
        process.exit(0);
    }
    catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};
seedWhoopAI();
