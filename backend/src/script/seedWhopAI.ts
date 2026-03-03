import "dotenv/config";
import UserModel from "../models/user.model";
import connectDatabase from "../config/database.config";

export const CreateWhoopAI = async () => {
  const existingAI = await UserModel.findOne({ isAI: true });
  if (existingAI) {
    await UserModel.deleteOne({ _id: existingAI._id });
    console.log("Deleted existing Whoop AI user");
  }

  const whopAI = await UserModel.create({
    name: "Whoop AI",
    isAI: true,
    avatar:
      "https://res.cloudinary.com/dp9vvlndo/image/upload/v1759925671/ai_logo_qqman8.png",
  });

  console.log("Whoop AI created:", whopAI._id);
  return whopAI;
};

const seedWhoopAI = async () => {
  try {
    await connectDatabase();
    console.log("Database connected");
    await CreateWhoopAI();
    console.log("Seeding completed");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedWhoopAI();
