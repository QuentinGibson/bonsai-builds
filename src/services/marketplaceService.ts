import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Breakpoint } from "./buildStorage";

export interface MarketplaceComment {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  body: string;
  score: number;
  createdAt: number;
}

/** A build published to the marketplace. `breakpoints` and `comments` are
 *  only populated when fetching a single listing (getListing), not the list. */
export interface MarketplaceBuild {
  id: string;
  authorId: string;
  authorName: string;
  name: string;
  description: string;
  className: string;
  ascendancy: string | null;
  likeCount: number;
  downloadCount: number;
  ratingCount: number;
  averageRating: number;
  createdAt: number;
  breakpoints?: Pick<Breakpoint, "name" | "level" | "allocatedNodes" | "allocatedAscendancyNodes" | "selectedClass" | "selectedAscendancy">[];
  comments?: MarketplaceComment[];
}

export interface PublishArgs {
  name: string;
  description: string;
  className: string;
  ascendancy?: string;
  breakpoints: Pick<Breakpoint, "name" | "level" | "allocatedNodes" | "allocatedAscendancyNodes" | "selectedClass" | "selectedAscendancy">[];
}

function resolveOverwolfUser(): Promise<{ userId: string; username: string }> {
  return new Promise((resolve) => {
    overwolf.profile.getCurrentUser((result) => {
      if (result.success && result.userId) {
        resolve({ userId: result.userId, username: result.username ?? result.userId });
      } else {
        resolve({ userId: "anon", username: "Anonymous" });
      }
    });
  });
}

class MarketplaceService {
  readonly #client = new ConvexHttpClient(process.env.CONVEX_URL!);
  readonly #user: Promise<{ userId: string; username: string }> = resolveOverwolfUser();

  async getListings(): Promise<MarketplaceBuild[]> {
    try {
      return (await this.#client.query(api.marketplace.list, {})) as MarketplaceBuild[];
    } catch (error) {
      console.error("Error fetching marketplace listings:", error);
      return [];
    }
  }

  async getListing(id: string): Promise<MarketplaceBuild | null> {
    try {
      return (await this.#client.query(api.marketplace.get, {
        id: id as Id<"marketplaceListings">,
      })) as MarketplaceBuild | null;
    } catch (error) {
      console.error("Error fetching marketplace listing:", error);
      return null;
    }
  }

  async publish(args: PublishArgs): Promise<string | null> {
    try {
      const { userId, username } = await this.#user;
      if (userId === "anon") return null;
      return (await this.#client.mutation(api.marketplace.publish, {
        authorId: userId,
        authorName: username,
        name: args.name,
        description: args.description,
        className: args.className,
        ascendancy: args.ascendancy,
        breakpoints: args.breakpoints.map((bp) => ({
          name: bp.name,
          level: bp.level,
          allocatedNodes: bp.allocatedNodes,
          allocatedAscendancyNodes: bp.allocatedAscendancyNodes,
          selectedClass: bp.selectedClass ?? undefined,
          selectedAscendancy: bp.selectedAscendancy ?? undefined,
        })),
      })) as string;
    } catch (error) {
      console.error("Error publishing build:", error);
      return null;
    }
  }

  async updateListing(id: string, args: PublishArgs): Promise<boolean> {
    try {
      const { userId } = await this.#user;
      await this.#client.mutation(api.marketplace.update, {
        id: id as Id<"marketplaceListings">,
        userId,
        name: args.name,
        description: args.description,
        className: args.className,
        ascendancy: args.ascendancy,
        breakpoints: args.breakpoints.map((bp) => ({
          name: bp.name,
          level: bp.level,
          allocatedNodes: bp.allocatedNodes,
          allocatedAscendancyNodes: bp.allocatedAscendancyNodes,
          selectedClass: bp.selectedClass ?? undefined,
          selectedAscendancy: bp.selectedAscendancy ?? undefined,
        })),
      });
      return true;
    } catch (error) {
      console.error("Error updating listing:", error);
      return false;
    }
  }

  async deleteListing(id: string): Promise<boolean> {
    try {
      const { userId } = await this.#user;
      await this.#client.mutation(api.marketplace.remove, {
        id: id as Id<"marketplaceListings">,
        userId,
      });
      return true;
    } catch {
      return false;
    }
  }

  async incrementDownload(id: string): Promise<void> {
    try {
      const { userId } = await this.#user;
      await this.#client.mutation(api.marketplace.incrementDownload, {
        id: id as Id<"marketplaceListings">,
        userId,
      });
    } catch (error) {
      console.error("Error incrementing download:", error);
    }
  }

  async getUserLike(listingId: string): Promise<boolean> {
    try {
      const { userId } = await this.#user;
      if (userId === "anon") return false;
      return (await this.#client.query(api.marketplace.getUserLike, {
        listingId: listingId as Id<"marketplaceListings">,
        userId,
      })) as boolean;
    } catch {
      return false;
    }
  }

  async toggleLike(listingId: string): Promise<boolean> {
    const { userId } = await this.#user;
    if (userId === "anon") return false;
    return (await this.#client.mutation(api.marketplace.toggleLike, {
      listingId: listingId as Id<"marketplaceListings">,
      userId,
    })) as boolean;
  }

  async getUserRating(listingId: string): Promise<number | null> {
    try {
      const { userId } = await this.#user;
      if (userId === "anon") return null;
      return (await this.#client.query(api.marketplace.getUserRating, {
        listingId: listingId as Id<"marketplaceListings">,
        userId,
      })) as number | null;
    } catch {
      return null;
    }
  }

  async setRating(listingId: string, value: number): Promise<void> {
    const { userId } = await this.#user;
    if (userId === "anon") return;
    await this.#client.mutation(api.marketplace.setRating, {
      listingId: listingId as Id<"marketplaceListings">,
      userId,
      value,
    });
  }

  async addComment(listingId: string, body: string, parentId?: string): Promise<string | null> {
    try {
      const { userId, username } = await this.#user;
      if (userId === "anon") return null;
      return (await this.#client.mutation(api.marketplace.addComment, {
        listingId: listingId as Id<"marketplaceListings">,
        ...(parentId ? { parentId: parentId as Id<"marketplaceComments"> } : {}),
        authorId: userId,
        authorName: username,
        body,
      })) as string;
    } catch (error) {
      console.error("Error adding comment:", error);
      return null;
    }
  }

  async voteComment(commentId: string, value: 1 | -1 | 0): Promise<void> {
    try {
      const { userId } = await this.#user;
      if (userId === "anon") return;
      await this.#client.mutation(api.marketplace.voteComment, {
        commentId: commentId as Id<"marketplaceComments">,
        userId,
        value,
      });
    } catch (error) {
      console.error("Error voting on comment:", error);
    }
  }

  async getUserCommentVotes(listingId: string): Promise<Record<string, number>> {
    try {
      const { userId } = await this.#user;
      return (await this.#client.query(api.marketplace.getUserCommentVotes, {
        listingId: listingId as Id<"marketplaceListings">,
        userId,
      })) as Record<string, number>;
    } catch {
      return {};
    }
  }

  async deleteComment(commentId: string): Promise<boolean> {
    try {
      const { userId } = await this.#user;
      await this.#client.mutation(api.marketplace.deleteComment, {
        id: commentId as Id<"marketplaceComments">,
        userId,
      });
      return true;
    } catch {
      return false;
    }
  }

  async toggleHideComment(commentId: string): Promise<boolean> {
    try {
      const { userId } = await this.#user;
      if (userId === "anon") return false;
      return (await this.#client.mutation(api.marketplace.toggleHideComment, {
        commentId: commentId as Id<"marketplaceComments">,
        userId,
      })) as boolean;
    } catch {
      return false;
    }
  }

  async getUserHiddenComments(listingId: string): Promise<string[]> {
    try {
      const { userId } = await this.#user;
      return (await this.#client.query(api.marketplace.getUserHiddenComments, {
        listingId: listingId as Id<"marketplaceListings">,
        userId,
      })) as string[];
    } catch {
      return [];
    }
  }

  async reportContent(targetId: string, targetType: "comment" | "listing", reason: string): Promise<boolean> {
    try {
      const { userId } = await this.#user;
      if (userId === "anon") return false;
      return (await this.#client.mutation(api.marketplace.reportContent, {
        reporterId: userId,
        targetId,
        targetType,
        reason,
      })) as boolean;
    } catch {
      return false;
    }
  }

  async getMyUserId(): Promise<string> {
    return (await this.#user).userId;
  }
}

export const marketplaceService = new MarketplaceService();
