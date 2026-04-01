import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export interface BuildSet {
  id: string;
  name: string;
  className: string;
  ascendancy: string;
  createdAt: number;
  updatedAt: number;
  breakpoints: Breakpoint[];
}

export interface Breakpoint {
  id: string;
  name: string;
  level: number;
  allocatedNodes: string[];
  allocatedAscendancyNodes: string[];
  selectedClass: string | null;
  selectedAscendancy: string | null;
  createdAt: number;
}

const CURRENT_BUILD_KEY = "bonsaibuild_current";
const PENDING_BREAKPOINT_KEY = "bonsaibuild_pending_bp";
const ANON_USER_ID_KEY = "bonsaibuild_anon_uid";

function getAnonUserId(): string {
  let uid = localStorage.getItem(ANON_USER_ID_KEY);
  if (!uid) {
    uid = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(ANON_USER_ID_KEY, uid);
  }
  return uid;
}

function resolveOverwolfUserId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.profile.getCurrentUser((result) => {
      if (result.success && result.userId) {
        resolve(result.userId);
      } else {
        resolve(getAnonUserId());
      }
    });
  });
}

class BuildStorageService {
  readonly #client = new ConvexHttpClient(process.env.CONVEX_URL!);

  readonly #userId: Promise<string> = resolveOverwolfUserId();

  #id(id: string) {
    return id as Id<"buildSets">;
  }

  #bpId(id: string) {
    return id as Id<"breakpoints">;
  }

  async getAllBuildSets(): Promise<BuildSet[]> {
    try {
      return await this.#client.query(api.buildSets.getAll, {
        userId: await this.#userId,
      }) as BuildSet[];
    } catch (error) {
      console.error("Error loading build sets:", error);
      return [];
    }
  }

  async getBuildSet(id: string): Promise<BuildSet | null> {
    try {
      return await this.#client.query(api.buildSets.get, {
        id: this.#id(id),
      }) as BuildSet | null;
    } catch (error) {
      console.error("Error loading build set:", error);
      return null;
    }
  }

  async createBuildSet(name: string): Promise<BuildSet> {
    const id = await this.#client.mutation(api.buildSets.create, {
      userId: await this.#userId,
      name,
    });
    return (await this.getBuildSet(id as string))!;
  }

  async updateBuildSetName(id: string, name: string): Promise<BuildSet | null> {
    return this.updateBuildSet(id, { name });
  }

  async updateBuildSet(
    id: string,
    updates: Partial<Pick<BuildSet, "name" | "className" | "ascendancy">>
  ): Promise<BuildSet | null> {
    await this.#client.mutation(api.buildSets.update, {
      id: this.#id(id),
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      // Empty string clears the field on the server
      ...(updates.className !== undefined
        ? { className: updates.className ?? "" }
        : {}),
      ...(updates.ascendancy !== undefined
        ? { ascendancy: updates.ascendancy ?? "" }
        : {}),
    });
    return this.getBuildSet(id);
  }

  async deleteBuildSet(id: string): Promise<boolean> {
    try {
      await this.#client.mutation(api.buildSets.remove, { id: this.#id(id) });
      return true;
    } catch {
      return false;
    }
  }

  async addBreakpoint(
    buildSetId: string,
    breakpoint: Omit<Breakpoint, "id" | "createdAt">
  ): Promise<Breakpoint | null> {
    try {
      const id = await this.#client.mutation(api.breakpoints.add, {
        buildSetId: this.#id(buildSetId),
        name: breakpoint.name,
        level: breakpoint.level,
        allocatedNodes: breakpoint.allocatedNodes,
        allocatedAscendancyNodes: breakpoint.allocatedAscendancyNodes,
        ...(breakpoint.selectedClass != null
          ? { selectedClass: breakpoint.selectedClass }
          : {}),
        ...(breakpoint.selectedAscendancy != null
          ? { selectedAscendancy: breakpoint.selectedAscendancy }
          : {}),
      });
      const buildSet = await this.getBuildSet(buildSetId);
      return buildSet?.breakpoints.find((bp) => bp.id === id) ?? null;
    } catch (error) {
      console.error("Error adding breakpoint:", error);
      return null;
    }
  }

  async updateBreakpoint(
    buildSetId: string,
    breakpointId: string,
    updates: Partial<Omit<Breakpoint, "id" | "createdAt">>
  ): Promise<Breakpoint | null> {
    try {
      await this.#client.mutation(api.breakpoints.update, {
        id: this.#bpId(breakpointId),
        buildSetId: this.#id(buildSetId),
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.level !== undefined ? { level: updates.level } : {}),
        ...(updates.allocatedNodes !== undefined
          ? { allocatedNodes: updates.allocatedNodes }
          : {}),
        ...(updates.allocatedAscendancyNodes !== undefined
          ? { allocatedAscendancyNodes: updates.allocatedAscendancyNodes }
          : {}),
        // Empty string clears the field on the server
        ...(updates.selectedClass !== undefined
          ? { selectedClass: updates.selectedClass ?? "" }
          : {}),
        ...(updates.selectedAscendancy !== undefined
          ? { selectedAscendancy: updates.selectedAscendancy ?? "" }
          : {}),
      });
      const buildSet = await this.getBuildSet(buildSetId);
      return buildSet?.breakpoints.find((bp) => bp.id === breakpointId) ?? null;
    } catch (error) {
      console.error("Error updating breakpoint:", error);
      return null;
    }
  }

  async deleteBreakpoint(
    buildSetId: string,
    breakpointId: string
  ): Promise<boolean> {
    try {
      await this.#client.mutation(api.breakpoints.remove, {
        id: this.#bpId(breakpointId),
        buildSetId: this.#id(buildSetId),
      });
      return true;
    } catch {
      return false;
    }
  }

  async clearBreakpoints(buildSetId: string): Promise<boolean> {
    try {
      await this.#client.mutation(api.breakpoints.clearAll, {
        buildSetId: this.#id(buildSetId),
      });
      return true;
    } catch {
      return false;
    }
  }

  async resetBreakpointsAscendancy(
    buildSetId: string,
    newAscendancy: string | null
  ): Promise<boolean> {
    try {
      await this.#client.mutation(api.breakpoints.resetAscendancy, {
        buildSetId: this.#id(buildSetId),
        ascendancy: newAscendancy,
      });
      return true;
    } catch {
      return false;
    }
  }

  // ── UI state (session/device only, intentionally kept in localStorage) ──

  getCurrentBuildSetId(): string | null {
    return localStorage.getItem(CURRENT_BUILD_KEY);
  }

  setCurrentBuildSetId(id: string | null): void {
    if (id) localStorage.setItem(CURRENT_BUILD_KEY, id);
    else localStorage.removeItem(CURRENT_BUILD_KEY);
  }

  getPendingBreakpointId(): string | null {
    return localStorage.getItem(PENDING_BREAKPOINT_KEY);
  }

  setPendingBreakpointId(id: string | null): void {
    if (id) localStorage.setItem(PENDING_BREAKPOINT_KEY, id);
    else localStorage.removeItem(PENDING_BREAKPOINT_KEY);
  }
}

export const buildStorage = new BuildStorageService();
