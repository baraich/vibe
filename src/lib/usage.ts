import { RateLimiterPrisma } from "rate-limiter-flexible";
import { prisma } from "./db";
import { auth } from "@clerk/nextjs/server";

const FREE_POINTS = 5;
const BLAZE_POINTS = 150;
const INFERNO_POINTS = 500;

const DURATION = 30 * 24 * 60 * 60;
const GENERATION_COST = 1;

export async function getUsageTracker() {
  const { has } = await auth();
  const onBlazePlan = has({ plan: "blaze" });
  const onInfernoPlan = has({ plan: "inferno" });

  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: onInfernoPlan
      ? INFERNO_POINTS
      : onBlazePlan
      ? BLAZE_POINTS
      : FREE_POINTS,
    duration: DURATION,
  });
  return usageTracker;
}

export async function consumeCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated!");
  }

  const usageTracker = await getUsageTracker();
  await usageTracker.consume(userId, GENERATION_COST);
}

export async function getUsageStatus() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated!");
  }

  const usageTracker = await getUsageTracker();
  const result = await usageTracker.get(userId);
  return result;
}
