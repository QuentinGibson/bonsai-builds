/**
 * Build Storage Service
 *
 * Currently uses localStorage for storage.
 * In the future, this will be replaced with Convex API.
 *
 * This abstraction layer makes it easy to swap storage mechanisms
 * without changing the rest of the codebase.
 */

export interface BuildSet {
  id: string
  name: string
  ascendancy?: string
  createdAt: number
  updatedAt: number
  breakpoints: Breakpoint[]
}

export interface Breakpoint {
  id: string
  name: string
  level: number
  allocatedNodes: string[]
  allocatedAscendancyNodes: string[]
  selectedClass: string | null
  selectedAscendancy: string | null
  createdAt: number
}

const STORAGE_KEY = 'bonsaibuild_buildsets'

/**
 * Storage abstraction - currently localStorage, future: Convex API
 */
class BuildStorageService {
  /**
   * Get all build sets
   */
  async getAllBuildSets(): Promise<BuildSet[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      return JSON.parse(data) as BuildSet[]
    } catch (error) {
      console.error('Error loading build sets:', error)
      return []
    }
  }

  /**
   * Get a single build set by ID
   */
  async getBuildSet(id: string): Promise<BuildSet | null> {
    const buildSets = await this.getAllBuildSets()
    return buildSets.find(set => set.id === id) || null
  }

  /**
   * Create a new build set
   */
  async createBuildSet(name: string): Promise<BuildSet> {
    const buildSets = await this.getAllBuildSets()

    const newBuildSet: BuildSet = {
      id: this.generateId(),
      name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      breakpoints: []
    }

    buildSets.push(newBuildSet)
    await this.saveBuildSets(buildSets)

    return newBuildSet
  }

  /**
   * Update a build set's name
   */
  async updateBuildSetName(id: string, name: string): Promise<BuildSet | null> {
    return this.updateBuildSet(id, { name })
  }

  /**
   * Update a build set's fields (name, ascendancy, etc.)
   */
  async updateBuildSet(id: string, updates: Partial<Pick<BuildSet, 'name' | 'ascendancy'>>): Promise<BuildSet | null> {
    const buildSets = await this.getAllBuildSets()
    const buildSet = buildSets.find(set => set.id === id)

    if (!buildSet) return null

    Object.assign(buildSet, updates)
    buildSet.updatedAt = Date.now()

    await this.saveBuildSets(buildSets)
    return buildSet
  }

  /**
   * Delete a build set
   */
  async deleteBuildSet(id: string): Promise<boolean> {
    const buildSets = await this.getAllBuildSets()
    const filteredSets = buildSets.filter(set => set.id !== id)

    if (filteredSets.length === buildSets.length) {
      return false // Build set not found
    }

    await this.saveBuildSets(filteredSets)
    return true
  }

  /**
   * Add a breakpoint to a build set
   */
  async addBreakpoint(
    buildSetId: string,
    breakpoint: Omit<Breakpoint, 'id' | 'createdAt'>
  ): Promise<Breakpoint | null> {
    const buildSets = await this.getAllBuildSets()
    const buildSet = buildSets.find(set => set.id === buildSetId)

    if (!buildSet) return null

    const newBreakpoint: Breakpoint = {
      ...breakpoint,
      id: this.generateId(),
      createdAt: Date.now()
    }

    buildSet.breakpoints.push(newBreakpoint)
    buildSet.updatedAt = Date.now()

    await this.saveBuildSets(buildSets)
    return newBreakpoint
  }

  /**
   * Update a breakpoint
   */
  async updateBreakpoint(
    buildSetId: string,
    breakpointId: string,
    updates: Partial<Omit<Breakpoint, 'id' | 'createdAt'>>
  ): Promise<Breakpoint | null> {
    const buildSets = await this.getAllBuildSets()
    const buildSet = buildSets.find(set => set.id === buildSetId)

    if (!buildSet) return null

    const breakpoint = buildSet.breakpoints.find(bp => bp.id === breakpointId)
    if (!breakpoint) return null

    Object.assign(breakpoint, updates)
    buildSet.updatedAt = Date.now()

    await this.saveBuildSets(buildSets)
    return breakpoint
  }

  /**
   * Delete a breakpoint
   */
  async deleteBreakpoint(buildSetId: string, breakpointId: string): Promise<boolean> {
    const buildSets = await this.getAllBuildSets()
    const buildSet = buildSets.find(set => set.id === buildSetId)

    if (!buildSet) return false

    const initialLength = buildSet.breakpoints.length
    buildSet.breakpoints = buildSet.breakpoints.filter(bp => bp.id !== breakpointId)

    if (buildSet.breakpoints.length === initialLength) {
      return false // Breakpoint not found
    }

    buildSet.updatedAt = Date.now()
    await this.saveBuildSets(buildSets)
    return true
  }

  /**
   * Save build sets to storage
   */
  private async saveBuildSets(buildSets: BuildSet[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSets))
    } catch (error) {
      console.error('Error saving build sets:', error)
      throw error
    }
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clear all build sets (useful for testing)
   */
  async clearAll(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Export singleton instance
export const buildStorage = new BuildStorageService()
