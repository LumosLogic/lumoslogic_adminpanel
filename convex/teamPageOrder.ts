import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ── Page order CRUD ──────────────────────────────────────────────────────────

export const getForPage = query({
  args: { page: v.string() },
  handler: async (ctx, { page }) =>
    ctx.db.query("teamPageOrder").withIndex("by_page", q => q.eq("page", page)).first(),
});

export const setForPage = mutation({
  args: { page: v.string(), employeeIds: v.array(v.string()), token: v.optional(v.string()) },
  handler: async (ctx, { page, employeeIds, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const existing = await ctx.db
      .query("teamPageOrder")
      .withIndex("by_page", q => q.eq("page", page))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { employeeIds });
    } else {
      await ctx.db.insert("teamPageOrder", { page, employeeIds });
    }
  },
});

export const resetForPage = mutation({
  args: { page: v.string(), token: v.optional(v.string()) },
  handler: async (ctx, { page, token }) => {
    await ctx.runQuery(internal.authHelpers.requireAdmin, { token });
    const existing = await ctx.db
      .query("teamPageOrder")
      .withIndex("by_page", q => q.eq("page", page))
      .first();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// ── Main query used by the website ──────────────────────────────────────────
// Returns active employees ordered by the page-specific order.
// Falls back to:
//   - service pages: employees whose serviceIds includes fallbackServiceId, in global order
//   - about / other:  all active employees in global order
export const listEmployeesForPage = query({
  args: {
    page: v.string(),
    fallbackServiceId: v.optional(v.string()),
  },
  handler: async (ctx, { page, fallbackServiceId }) => {
    const pageOrder = await ctx.db
      .query("teamPageOrder")
      .withIndex("by_page", q => q.eq("page", page))
      .first();

    const allActive = await ctx.db
      .query("employees")
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    // Resolve profile image URLs
    const resolved = await Promise.all(
      allActive.map(async e => {
        let profileImageUrl = e.cloudinarySecureUrl ?? null;
        if (!profileImageUrl && e.profileImageId) {
          profileImageUrl = await ctx.storage.getUrl(e.profileImageId);
        }
        return { ...e, profileImageUrl };
      })
    );

    // Custom order saved for this page
    if (pageOrder && pageOrder.employeeIds.length > 0) {
      const orderMap = new Map(pageOrder.employeeIds.map((id, idx) => [id, idx]));
      return resolved
        .filter(e => orderMap.has(e._id))
        .sort((a, b) => orderMap.get(a._id)! - orderMap.get(b._id)!);
    }

    // Fallback for service pages — filter by serviceId, global order
    if (fallbackServiceId) {
      return resolved
        .filter(e => (e.serviceIds ?? []).includes(fallbackServiceId))
        .sort((a, b) => a.order - b.order);
    }

    // Fallback for about / general — all employees, global order
    return resolved.sort((a, b) => a.order - b.order);
  },
});
