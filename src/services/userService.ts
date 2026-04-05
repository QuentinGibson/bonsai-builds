import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { kPremiumPlanId } from "../config/constants";

function resolveOverwolfUserId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.profile.getCurrentUser((result) => {
      if (result.success && result.userId) {
        resolve(result.userId);
      } else {
        resolve("anon");
      }
    });
  });
}

class UserService {
  readonly #client = new ConvexHttpClient(process.env.CONVEX_URL!);
  readonly #userId: Promise<string> = resolveOverwolfUserId();

  async getIsPremium(): Promise<boolean> {
    try {
      const userId = await this.#userId;
      if (userId === "anon") return false;
      const user = await this.#client.query(api.users.getOrCreate, { userId });
      return user.isPremium;
    } catch (error) {
      console.error("Error fetching premium status:", error);
      return false;
    }
  }

  async setPremium(isPremium: boolean): Promise<void> {
    const userId = await this.#userId;
    if (userId === "anon") return;
    await this.#client.mutation(api.users.setPremium, { userId, isPremium });
  }

  /**
   * Checks the user's active Overwolf subscriptions and syncs the result to
   * Convex. Call this on app startup instead of getIsPremium().
   *
   * Once you have a plan ID, set kPremiumPlanId in config/constants.ts.
   * Until then the check is a no-op and everyone stays non-premium.
   */
  async checkAndSyncSubscription(): Promise<boolean> {
    // Plan ID not configured yet — skip the API call
    if (kPremiumPlanId === 0) {
      return this.getIsPremium();
    }

    return new Promise((resolve) => {
      try {
        ;(overwolf.profile.subscriptions as any).getActivePlans(
          (result: { success: boolean; plans?: Array<{ id: number }> }) => {
            const isActive =
              result?.success === true &&
              Array.isArray(result.plans) &&
              result.plans.some(p => p.id === kPremiumPlanId)

            this.setPremium(isActive).catch(console.error)
            resolve(isActive)
          }
        )
      } catch {
        // Subscriptions API unavailable — fall back to stored value
        this.getIsPremium().then(resolve).catch(() => resolve(false))
      }
    })
  }
}

export const userService = new UserService();
