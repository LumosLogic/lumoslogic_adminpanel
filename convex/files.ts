import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: { token: v.optional(v.string()) },
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const deleteFile = mutation({
  args: { storageId: v.id("_storage"), token: v.optional(v.string()) },
  handler: async (ctx, { storageId }) => {
    await ctx.storage.delete(storageId);
  },
});

// Called right after upload to get the preview URL for a freshly stored file.
export const getUrlForStorage = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return ctx.storage.getUrl(storageId);
  },
});
