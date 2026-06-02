import { ConvexHttpClient } from "convex/browser";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";

export interface PassiveNode {
  id: string;
  weapon_set?: number;
  additional_text?: string;
}

/** @deprecated Use PassiveNode */
export type AllocatedNode = PassiveNode;

export interface SupportSkill {
  id: string;
  level_interval: number[];
  additional_text?: string;
}

export interface Skill {
  id: string;
  level_interval: number[];
  additional_text?: string;
  support_skills: SupportSkill[];
}

export interface BuildSet {
  id: string;
  name: string;
  className: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  breakpoints: Breakpoint[];
}

export interface Breakpoint {
  id: string;
  name: string;
  order: number;
  passives: PassiveNode[];
  skills: Skill[];
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

  async createBuildSet(name: string, options?: { order?: number; className?: string }): Promise<BuildSet> {
    const id = await this.#client.mutation(api.buildSets.create, {
      userId: await this.#userId,
      name,
      ...(options?.className ? { className: options.className } : {}),
      ...(options?.order !== undefined ? { order: options.order } : {}),
    });
    return (await this.getBuildSet(id as string))!;
  }

  async updateBuildSetName(id: string, name: string): Promise<BuildSet | null> {
    return this.updateBuildSet(id, { name });
  }

  async updateBuildSet(
    id: string,
    updates: Partial<Pick<BuildSet, "name" | "className" | "order">>
  ): Promise<BuildSet | null> {
    await this.#client.mutation(api.buildSets.update, {
      id: this.#id(id),
      ...(updates.name !== undefined ? { name: updates.name } : {}),
      // Empty string clears the field on the server
      ...(updates.className !== undefined
        ? { className: updates.className ?? "" }
        : {}),
      ...(updates.order !== undefined ? { order: updates.order } : {}),
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
    breakpoint: Omit<Breakpoint, "id" | "createdAt" | "order" | "skills"> & { order?: number; skills?: Skill[] }
  ): Promise<Breakpoint | null> {
    try {
      const id = await this.#client.mutation(api.breakpoints.add, {
        buildSetId: this.#id(buildSetId),
        name: breakpoint.name,
        ...(breakpoint.order !== undefined ? { order: breakpoint.order } : {}),
        passives: breakpoint.passives,
        ...(breakpoint.skills !== undefined ? { skills: breakpoint.skills } : {}),
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
        ...(updates.order !== undefined ? { order: updates.order } : {}),
        ...(updates.passives !== undefined ? { passives: updates.passives } : {}),
        ...(updates.skills !== undefined ? { skills: updates.skills } : {}),
        // Empty string clears the field on the server
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
