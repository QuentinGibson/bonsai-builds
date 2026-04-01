import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

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

  /**
   * TODO: Hook this up to a payment/subscription flow.
   *
   * To grant a user premium (removes ads):
   *   userService.setPremium(true)
   *
   * To revoke:
   *   userService.setPremium(false)
   *
   * Options for triggering this:
   *  - Overwolf Subscriptions API: overwolf.profile.subscriptions.getActivePlans()
   *    fires a callback with active plan IDs — call setPremium(true) if the user
   *    has a matching plan, setPremium(false) if not.
   *  - Manual/admin: call setPremium directly from a dev tool or Convex dashboard.
   *
   * The status is stored in Convex (users table) and loaded into the common store
   * at app startup via background.ts → userService.getIsPremium().
   */
  async setPremium(isPremium: boolean): Promise<void> {
    const userId = await this.#userId;
    if (userId === "anon") return;
    await this.#client.mutation(api.users.setPremium, { userId, isPremium });
  }
}

export const userService = new UserService();
