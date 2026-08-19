"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getSignedUploadParams = action({
  args: {
    folder: v.string(),
    token: v.optional(v.string()),
  },
  handler: async (ctx, { folder, token }) => {
    // Validate admin session if token provided
    if (token) {
      const session = await ctx.runQuery(internal.authHelpers.validateSession, { token });
      if (!session) throw new Error("Unauthorized");
    }

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) throw new Error("CLOUDINARY_API_SECRET is not set in Convex environment variables");

    // Get cloudinaryConfig from DB
    const config = await ctx.runQuery(internal.cloudinaryConfig.getInternal);
    if (!config || !config.cloudName || !config.apiKey) {
      throw new Error("Cloudinary is not configured. Please set up Cloudinary in Settings.");
    }

    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = { folder, timestamp };
    const sortedKeys = Object.keys(params).sort();
    const toSign = sortedKeys.map(k => `${k}=${params[k]}`).join("&") + apiSecret;

    const { createHash } = require("node:crypto");
    const signature = createHash("sha1").update(toSign).digest("hex");

    return {
      timestamp,
      signature,
      folder,
      apiKey: config.apiKey,
      cloudName: config.cloudName,
    };
  },
});
