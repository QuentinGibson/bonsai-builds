// Passive Tree Logic - Full implementation from index.html

import { buildStorage, BuildSet } from '../../services/buildStorage'

export type BuildStateSnapshot = {
  buildSets: BuildSet[]
  currentBuildSetId: string | null
  currentBreakpointId: string | null
  isReadOnly: boolean
}

export interface TreeData {
  nodes: {
    [nodeId: string]: NodeData
  }
}

export interface NodeData {
  name: string
  stats: string[]
  icon?: string
  isKeystone?: boolean
  isNotable?: boolean
}

export class PassiveTreeManager {
  private svg: SVGSVGElement | null = null
  private treeData: TreeData | null = null
  private allocatedNodes = new Set<string>()
  private allocatedAscendancyNodes = new Set<string>()
  private startingNodeId: string | null = null
  private ascendancyStartingNodeId: string | null = null
  private currentSelectedAscendancy: string | null = null
  private zoom = 1.0
  private panX = 0
  private panY = 0
  private isDragging = false
  private lastX = 0
  private lastY = 0
  private connectionGraph = new Map<string, string[]>()
  private allAscendancyNodeIds = new Set<string>()
  private hiddenNodeIds = new Set<string>()
  private isReadOnly = true // read-only until "Edit Tree" is triggered from Builder

  private readonly maxPoints = 123
  private readonly maxAscendancyPoints = 8

  private openAddBuildSetPopup: () => void
  private openAddBreakpointPopup: () => void
  private eventBus: any
  private onStateChange?: (state: BuildStateSnapshot) => void

  // Build management
  private buildSets: BuildSet[] = []
  private currentBuildSetId: string | null = null
  private currentBreakpointId: string | null = null
  private initialized = false // prevents repeated auto-select on every loadBuildSets call

  // Element caches — populated once after setup to avoid querySelector in hot paths
  private nodeElements = new Map<string, SVGElement>()
  private connElements = new Map<string, SVGElement>()
  // Track which nodes/conns currently have preview classes so clearPreview is O(previewed) not O(all)
  private previewedNodeIds = new Set<string>()
  private previewedConnIds = new Set<string>()
  // RAF flag — throttles drag-pan to one viewBox update per frame
  private dragRafPending = false
  // Track last tooltip node to skip redundant innerHTML writes on mousemove
  private tooltipNodeId: string | null = null

  constructor(
    openAddBuildSetPopup: () => void,
    openAddBreakpointPopup: () => void,
    eventBus: any,
    onStateChange?: (state: BuildStateSnapshot) => void
  ) {
    this.openAddBuildSetPopup = openAddBuildSetPopup
    this.openAddBreakpointPopup = openAddBreakpointPopup
    this.eventBus = eventBus
    this.onStateChange = onStateChange
  }

  private notifyStateChange() {
    this.onStateChange?.({
      buildSets: [...this.buildSets],
      currentBuildSetId: this.currentBuildSetId,
      currentBreakpointId: this.currentBreakpointId,
      isReadOnly: this.isReadOnly
    })
  }

  // Ascendancy data - generated from PoB 0.4.0d tree.json
  // Main tree scaled 1.5× so center is clear; transforms negate each
  // cluster's center, placing them at (0,0) in the middle of the tree.
  private readonly ascendancyData: Record<string, { nodes: string[], transform: string }> = {
    'Deadeye': { nodes: ['30', '3987', '5817', '12033', '23508', '24226', '24295', '29871', '35801', '37336', '39723', '41875', '42416', '46854', '46990', '49165', '59542', '59913', '61461'], transform: 'translate(-15794.84, -3546.05)' },
    'Pathfinder': { nodes: ['16', '40', '1583', '9710', '9798', '12183', '12795', '14508', '16433', '18940', '24868', '29074', '33736', '36676', '38004', '39292', '41619', '46454', '49503', '56618', '57141', '57253', '58379', '61991'], transform: 'translate(-14882.62, -6487.42)' },
    'Amazon': { nodes: ['528', '2702', '3065', '5563', '6109', '7979', '9294', '19233', '35033', '35187', '41008', '41736', '42441', '43095', '46071', '47312', '55796', '60662', '63254'], transform: 'translate(-12808.37, -9364.84)' },
    'Ritualist': { nodes: ['3223', '4891', '7068', '11776', '17058', '18280', '22661', '30233', '34785', '36365', '37046', '37972', '42017', '58149', '58574', '60859', '62804'], transform: 'translate(-10845.71, -11735.18)' },
    'Titan': { nodes: ['3762', '12000', '13715', '19424', '24807', '27418', '29323', '30115', '32534', '35453', '38014', '42275', '51690', '56842', '59372', '59540', '60634'], transform: 'translate(11977.41, -10636.41)' },
    'Warbringer': { nodes: ['1994', '6127', '10072', '18585', '23005', '25935', '33812', '36659', '38769', '39365', '39411', '40915', '47097', '48682', '49380', '52068', '58704'], transform: 'translate(14246.82, -7955.35)' },
    'Smith of Kitava': { nodes: ['110', '5386', '5852', '8525', '9988', '9997', '13772', '14960', '16276', '20195', '20895', '22541', '22908', '25438', '47184', '47236', '48537', '49340', '57959', '60298', '60913', '61039', '63401', '64962'], transform: 'translate(15205.33, -5282.12)' },
    'Tactician': { nodes: ['762', '1988', '4086', '4245', '10371', '12054', '15044', '16249', '24696', '29162', '30151', '32560', '32637', '36252', '37523', '42845', '44371', '44746', '46522', '54838', '54892'], transform: 'translate(-3277.38, -15697.95)' },
    'Witchhunter': { nodes: ['3704', '6935', '7120', '8272', '17646', '20830', '25172', '32559', '34501', '37078', '38601', '40719', '43131', '46535', '51737', '61897', '61973'], transform: 'translate(-26.88, -16189.06)' },
    'Gemling Legionnaire': { nodes: ['1442', '3084', '11641', '14429', '18146', '30996', '32952', '34882', '36728', '36822', '37397', '45248', '53108', '53762', '55536', '55582', '57819', '58591', '60287', '63259'], transform: 'translate(3250.95, -15406.05)' },
    'Oracle': { nodes: ['378', '4197', '5571', '11335', '15275', '21284', '25092', '30904', '32905', '34313', '37782', '39659', '42761', '47190', '52374', '55135', '56505'], transform: 'translate(14279.65, 6881.06)' },
    'Shaman': { nodes: ['1855', '16204', '26063', '28022', '28745', '33824', '35535', '35762', '35920', '42253', '46654', '54512', '56933', '58646', '61722', '61983', '62523'], transform: 'translate(12279.12, 9183.00)' },
    'Infernalist': { nodes: ['770', '7793', '8854', '10694', '13174', '17754', '18158', '18348', '19482', '23880', '24039', '24135', '25239', '32699', '34419', '36564', '39470', '46016', '46644', '61267', '63484', '63894', '64379'], transform: 'translate(9444.91, 13185.83)' },
    'Blood Mage': { nodes: ['3165', '8415', '23416', '26282', '26383', '27667', '30071', '30117', '31223', '47442', '48551', '50192', '52703', '56162', '59342', '59822', '62388', '65518'], transform: 'translate(6319.78, 14714.00)' },
    'Lich': { nodes: ['59', '2516', '2877', '2995', '8611', '17788', '20772', '23352', '23710', '26085', '28431', '33141', '33570', '36696', '39241', '51142', '58751', '58932', '62797'], transform: 'translate(3396.68, 15843.95)' },
    'Stormweaver': { nodes: ['2857', '7246', '7998', '8867', '12488', '12882', '13673', '18849', '25618', '29398', '38578', '39204', '39640', '40721', '42522', '44484', '49189', '49759', '61985', '64789', '65413'], transform: 'translate(-0.00, 16231.29)' },
    'Chronomancer': { nodes: ['1579', '3605', '10731', '10987', '18678', '22147', '26638', '27990', '28153', '32856', '42035', '43128', '49049', '50219', '54194', '58747', '63002'], transform: 'translate(-3230.06, 15709.82)' },
    'Disciple of Varashta': { nodes: ['2810', '8305', '9843', '10561', '13289', '14131', '20701', '23265', '25653', '25683', '30265', '32705', '34207', '35880', '36109', '36891', '43426', '45602', '46091', '56783', '56857', '64223', '64591'], transform: 'translate(-6262.26, 14753.35)' },
    'Invoker': { nodes: ['7621', '8143', '9994', '12876', '13065', '16100', '17268', '23415', '23587', '25434', '27686', '29133', '44357', '52448', '55611', '57181', '63236', '63713', '64031', '65173'], transform: 'translate(-13267.15, 9481.90)' },
    'Acolyte of Chayula': { nodes: ['74', '664', '1347', '3781', '11771', '17923', '18826', '24475', '25779', '25781', '25885', '26283', '31116', '32771', '34817', '36788', '41076', '47344', '50098', '52395', '56331', '59759'], transform: 'translate(-14833.95, 6460.32)' }
  }

  private readonly classAscendancies: Record<string, string[]> = {
    'Warrior': ['Titan', 'Warbringer', 'Smith of Kitava'],
    'Ranger': ['Deadeye', 'Pathfinder'],
    'Huntress': ['Amazon', 'Ritualist'],
    'Mercenary': ['Tactician', 'Witchhunter', 'Gemling Legionnaire'],
    'Sorceress': ['Stormweaver', 'Chronomancer', 'Disciple of Varashta'],
    'Witch': ['Infernalist', 'Blood Mage', 'Lich'],
    'Monk': ['Invoker', 'Acolyte of Chayula'],
    'Druid': ['Oracle', 'Shaman']
  }

  private readonly ascendancyNames: Record<string, string> = {
    'Deadeye': 'Deadeye',
    'Pathfinder': 'Pathfinder',
    'Amazon': 'Amazon',
    'Ritualist': 'Ritualist',
    'Titan': 'Titan',
    'Warbringer': 'Warbringer',
    'Smith of Kitava': 'Smith of Kitava',
    'Tactician': 'Tactician',
    'Witchhunter': 'Witchhunter',
    'Gemling Legionnaire': 'Gemling Legionnaire',
    'Oracle': 'Oracle',
    'Shaman': 'Shaman',
    'Infernalist': 'Infernalist',
    'Blood Mage': 'Blood Mage',
    'Lich': 'Lich',
    'Stormweaver': 'Stormweaver',
    'Chronomancer': 'Chronomancer',
    'Disciple of Varashta': 'Disciple of Varashta',
    'Invoker': 'Invoker',
    'Acolyte of Chayula': 'Acolyte of Chayula'
  }

  private readonly ascendancyStartNodes: Record<string, string> = {
    'Deadeye': '46990',
    'Pathfinder': '1583',
    'Amazon': '41736',
    'Ritualist': '36365',
    'Titan': '32534',
    'Warbringer': '33812',
    'Smith of Kitava': '5852',
    'Tactician': '36252',
    'Witchhunter': '7120',
    'Gemling Legionnaire': '55536',
    'Oracle': '42761',
    'Shaman': '35535',
    'Infernalist': '32699',
    'Blood Mage': '59822',
    'Lich': '23710',
    'Stormweaver': '40721',
    'Chronomancer': '22147',
    'Disciple of Varashta': '8305',
    'Invoker': '9994',
    'Acolyte of Chayula': '74'
  }

  async initialize(container: HTMLElement) {
    try {
      // Load SVG and tree data in parallel
      const [svgContent, treeData] = await Promise.all([
        fetch('/assets-static/poe2snippet.html').then(r => r.text()),
        fetch('/assets-static/data_us.json').then(r => r.json())
      ])

      // Parse into a detached element so ALL setup mutations (node moves, image inserts,
      // class changes) happen off-screen without triggering layout/paint per operation.
      const temp = document.createElement('div')
      temp.innerHTML = svgContent
      this.svg = temp.querySelector('#passive_skill_tree')
      this.treeData = treeData

      if (!this.svg || !this.treeData) {
        throw new Error('Failed to load tree')
      }

      this.setupTree()

      // Insert into the live DOM only once — after all mutations are complete
      container.appendChild(this.svg)
    } catch (err) {
      console.error('Failed to initialize passive tree:', err)
      container.innerHTML = '<div style="color: white; padding: 20px;">Failed to load tree.</div>'
    }
  }

  private setupTree() {
    if (!this.svg || !this.treeData) return

    // Build the full set of all ascendancy node IDs so main-tree BFS can exclude them
    Object.values(this.ascendancyData).forEach(({ nodes }) => {
      nodes.forEach(id => this.allAscendancyNodeIds.add(id))
    })

    // Identify PoE1 mastery nodes that don't belong in the PoE2 tree:
    // they have "mastery" in their name and no stats (empty stats = placeholder node)
    Object.entries(this.treeData.nodes).forEach(([nodeId, nodeData]) => {
      if (nodeData.name.toLowerCase().includes('mastery') && nodeData.stats.length === 0) {
        this.hiddenNodeIds.add(nodeId)
      }
    })

    // Group ascendancy nodes first
    this.setupAscendancyGroups()

    // Apply node images
    this.applyNodeImages()

    // Build connection graph
    this.buildConnectionGraph()

    // Hide invalid nodes AFTER the graph is built
    this.hideInvalidNodes()

    // Tree starts read-only; "Edit Tree" from Builder will lift this
    this.svg.classList.add('read-only')

    // Setup event listeners
    this.setupEventListeners()

    // Setup zoom and pan
    this.updateViewBox()

    // Setup dropdowns
    this.setupDropdowns()

    // Setup build management
    this.setupBuildManagement()

    // Cache element references for hot-path use
    this.buildElementCaches()
  }

  private buildElementCaches() {
    if (!this.svg) return

    // Cache all node circles
    this.svg.querySelectorAll('circle[id^="n"]').forEach(el => {
      this.nodeElements.set(el.id.slice(1), el as SVGElement)
    })

    // Cache all connection lines/paths (main tree + ascendancy groups)
    this.svg.querySelectorAll(
      '#connections line, #connections path, g[id^="ascendancy-"] line, g[id^="ascendancy-"] path'
    ).forEach(el => {
      if (el.id) this.connElements.set(el.id, el as SVGElement)
    })
  }

  private setupAscendancyGroups() {
    if (!this.svg) return

    // Build a connection lookup: nodeId -> [connElement] from ONE querySelectorAll.
    // This replaces ~380 per-node substring querySelectorAll calls (one per ascendancy node).
    const connsByNode = new Map<string, Element[]>()
    this.svg.querySelectorAll('#connections line[id], #connections path[id]').forEach(el => {
      const m = el.id.match(/^c(\d+)-(\d+)$/)
      if (!m) return
      if (!connsByNode.has(m[1])) connsByNode.set(m[1], [])
      if (!connsByNode.has(m[2])) connsByNode.set(m[2], [])
      connsByNode.get(m[1])!.push(el)
      connsByNode.get(m[2])!.push(el)
    })

    Object.keys(this.ascendancyData).forEach(ascName => {
      const { nodes: nodeIds, transform } = this.ascendancyData[ascName]
      const nodeSet = new Set(nodeIds)

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      group.id = `ascendancy-${ascName}`
      group.setAttribute('transform', transform)
      group.setAttribute('data-ascendancy', ascName)
      group.style.display = 'none'

      // Find connections where both endpoints are in this ascendancy group
      const pathsToMove = new Set<Element>()
      nodeIds.forEach(nodeId => {
        ;(connsByNode.get(nodeId) || []).forEach(conn => {
          const m = conn.id.match(/^c(\d+)-(\d+)$/)
          if (m && nodeSet.has(m[1]) && nodeSet.has(m[2])) {
            pathsToMove.add(conn)
          }
        })
      })

      pathsToMove.forEach(path => group.appendChild(path))

      nodeIds.forEach(nodeId => {
        const circle = this.svg!.querySelector(`#n${nodeId}`)
        if (circle) group.appendChild(circle)
      })

      this.svg.appendChild(group)
    })
  }

  private applyNodeImages() {
    if (!this.svg || !this.treeData) return

    const nodes = this.treeData.nodes

    // Query all circles once instead of one querySelector per node (was 4,701 queries)
    this.svg.querySelectorAll('circle[id^="n"]').forEach(circle => {
      const nodeId = circle.id.slice(1)
      const nodeData = nodes[nodeId]
      if (!nodeData?.icon) return

      const img = document.createElementNS('http://www.w3.org/2000/svg', 'image')
      const cx = parseFloat(circle.getAttribute('cx') || '0')
      const cy = parseFloat(circle.getAttribute('cy') || '0')
      const r = parseFloat(circle.getAttribute('r') || '0')

      const imgSize = r * 1.5
      img.setAttribute('x', (cx - imgSize / 2).toString())
      img.setAttribute('y', (cy - imgSize / 2).toString())
      img.setAttribute('width', imgSize.toString())
      img.setAttribute('height', imgSize.toString())

      const passivesPath = nodeData.icon.match(/passives\/(.+)\.webp/)
      const skillIconPath = nodeData.icon.match(/SkillIcons\/([^/]+)\.webp/)

      if (passivesPath) {
        img.setAttribute('href', `/assets-static/images/passives/${passivesPath[1].toLowerCase()}.png`)
      } else if (skillIconPath) {
        img.setAttribute('href', `/assets-static/images/${skillIconPath[1].toLowerCase()}.png`)
      }

      img.setAttribute('pointer-events', 'none')
      img.classList.add('node-icon')
      circle.parentNode?.insertBefore(img, circle.nextSibling)
    })
  }

  private buildConnectionGraph() {
    if (!this.svg) return

    const allConnections = this.svg.querySelectorAll(
      '#connections line, #connections path, g[id^="ascendancy-"] line, g[id^="ascendancy-"] path'
    )

    allConnections.forEach(conn => {
      const connId = conn.id
      if (connId.startsWith('c')) {
        const parts = connId.substring(1).split('-')
        if (parts.length === 2) {
          const [id1, id2] = parts
          // Skip connections involving hidden (mastery) nodes
          if (this.hiddenNodeIds.has(id1) || this.hiddenNodeIds.has(id2)) return
          if (!this.connectionGraph.has(id1)) this.connectionGraph.set(id1, [])
          if (!this.connectionGraph.has(id2)) this.connectionGraph.set(id2, [])
          this.connectionGraph.get(id1)!.push(id2)
          this.connectionGraph.get(id2)!.push(id1)
        }
      }
    })
  }

  private hideInvalidNodes() {
    if (!this.svg) return

    // Hide the circle elements (and their icon image siblings) for all hidden nodes
    this.hiddenNodeIds.forEach(nodeId => {
      const circle = this.svg!.querySelector(`#n${nodeId}`)
      if (circle) {
        (circle as SVGElement).style.display = 'none'
        ;(circle as SVGElement).style.pointerEvents = 'none'

        // applyNodeImages() inserts a .node-icon <image> immediately after the circle
        const icon = circle.nextElementSibling
        if (icon && icon.classList.contains('node-icon')) {
          (icon as SVGElement).style.display = 'none'
        }
      }
    })

    // Hide connections where either endpoint is a hidden node
    const allConns = this.svg.querySelectorAll('#connections line, #connections path')
    allConns.forEach(conn => {
      const m = conn.id.match(/^c(\d+)-(\d+)$/)
      if (m && (this.hiddenNodeIds.has(m[1]) || this.hiddenNodeIds.has(m[2]))) {
        ;(conn as SVGElement).style.display = 'none'
      }
    })
  }

  private setupEventListeners() {
    if (!this.svg) return

    this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e))
    this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.svg.addEventListener('mouseup', () => this.handleMouseUp())
    this.svg.addEventListener('mouseleave', () => this.handleMouseUp())
    this.svg.addEventListener('wheel', (e) => this.handleWheel(e))
    this.svg.addEventListener('click', (e) => this.handleNodeClick(e))
    this.svg.addEventListener('mouseover', (e) => this.handleNodeHover(e))
    this.svg.addEventListener('mouseout', (e) => this.handleNodeOut(e))
    this.svg.addEventListener('mousemove', (e) => this.handleTooltipMove(e))
  }

  private lastNotifiedZoom = -1

  private updateViewBox() {
    if (!this.svg) return

    const baseViewBox = {
      x: -27125,
      y: -26721,
      width: 54401,
      height: 54020
    }

    const width = baseViewBox.width / this.zoom
    const height = baseViewBox.height / this.zoom
    const x = baseViewBox.x - this.panX
    const y = baseViewBox.y - this.panY

    this.svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)

    // Only notify React when zoom actually changed — panning must not trigger re-renders
    if (this.zoom !== this.lastNotifiedZoom) {
      this.lastNotifiedZoom = this.zoom
      document.dispatchEvent(new CustomEvent('treezoomchange', { detail: { zoom: this.zoom } }))
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button === 0 && (e.target as HTMLElement).tagName !== 'circle') {
      this.isDragging = true
      this.lastX = e.clientX
      this.lastY = e.clientY
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging) return

    const dx = e.clientX - this.lastX
    const dy = e.clientY - this.lastY
    this.panX += dx * 50 / this.zoom
    this.panY += dy * 50 / this.zoom

    const maxPan = 45000
    this.panX = Math.max(-maxPan, Math.min(maxPan, this.panX))
    this.panY = Math.max(-maxPan, Math.min(maxPan, this.panY))

    this.lastX = e.clientX
    this.lastY = e.clientY

    // Throttle viewBox writes to one per animation frame
    if (!this.dragRafPending) {
      this.dragRafPending = true
      requestAnimationFrame(() => {
        this.dragRafPending = false
        this.updateViewBox()
      })
    }
  }

  private handleMouseUp() {
    this.isDragging = false
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault()

    if (!this.svg) return

    // Get mouse position relative to SVG
    const rect = this.svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Convert to normalized coordinates (0 to 1)
    const normX = mouseX / rect.width
    const normY = mouseY / rect.height

    const baseViewBox = {
      x: -27125,
      y: -26721,
      width: 54401,
      height: 54020
    }

    // Calculate the point in SVG coordinates that the mouse is currently over
    const oldWidth = baseViewBox.width / this.zoom
    const oldHeight = baseViewBox.height / this.zoom
    const svgX = (baseViewBox.x - this.panX) + normX * oldWidth
    const svgY = (baseViewBox.y - this.panY) + normY * oldHeight

    // Apply zoom
    const delta = e.deltaY > 0 ? -0.3 : 0.3
    const oldZoom = this.zoom
    this.zoom = Math.max(0.5, Math.min(10.0, this.zoom + delta))

    // Calculate new dimensions
    const newWidth = baseViewBox.width / this.zoom
    const newHeight = baseViewBox.height / this.zoom

    // Adjust pan so the same SVG point stays under the mouse
    this.panX = (baseViewBox.x + normX * newWidth - svgX)
    this.panY = (baseViewBox.y + normY * newHeight - svgY)

    // Apply pan limits
    const maxPan = 45000
    this.panX = Math.max(-maxPan, Math.min(maxPan, this.panX))
    this.panY = Math.max(-maxPan, Math.min(maxPan, this.panY))

    this.updateViewBox()
  }

  /** Saves current tree state to storage without triggering a full state reload. */
  private async autoSave(): Promise<void> {
    if (!this.currentBuildSetId || !this.currentBreakpointId) return
    try {
      await buildStorage.updateBreakpoint(this.currentBuildSetId, this.currentBreakpointId, {
        allocatedNodes: Array.from(this.allocatedNodes),
        allocatedAscendancyNodes: Array.from(this.allocatedAscendancyNodes),
        selectedClass: this.startingNodeId,
        selectedAscendancy: this.currentSelectedAscendancy,
      })
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }

  private handleNodeClick(e: Event) {
    if (this.isReadOnly) return
    const target = e.target as HTMLElement
    if (target.tagName === 'circle') {
      const nodeId = target.id.replace('n', '')
      const isAscNode = this.isAscendancyNode(nodeId)

      if (target.classList.contains('allocated')) {
        // Deallocation
        if (nodeId === this.startingNodeId || nodeId === this.ascendancyStartingNodeId) return

        if (isAscNode) {
          const disconnected = this.findDisconnectedNodesAscendancy(nodeId)
          target.classList.remove('allocated')
          this.allocatedAscendancyNodes.delete(nodeId)

          disconnected.forEach(discNodeId => {
            const discNode = this.nodeElements.get(discNodeId)
            if (discNode) {
              discNode.classList.remove('allocated')
              this.allocatedAscendancyNodes.delete(discNodeId)
            }
          })
        } else {
          const disconnected = this.findDisconnectedNodes(nodeId)
          target.classList.remove('allocated')
          this.allocatedNodes.delete(nodeId)

          disconnected.forEach(discNodeId => {
            const discNode = this.nodeElements.get(discNodeId)
            if (discNode) {
              discNode.classList.remove('allocated')
              this.allocatedNodes.delete(discNodeId)
            }
          })
        }
      } else {
        // Allocation
        // Prevent allocation if no starting class is selected
        if (!this.startingNodeId || this.startingNodeId === '') {
          return
        }

        if (isAscNode) {
          if (!this.ascendancyStartingNodeId) return
          if (this.allocatedAscendancyNodes.size - 1 >= this.maxAscendancyPoints) return

          const path = this.findShortestPathAscendancy(nodeId)
          if (path !== null) {
            target.classList.add('allocated')
            this.allocatedAscendancyNodes.add(nodeId)

            path.forEach(pathNodeId => {
              const pathNode = this.nodeElements.get(pathNodeId)
              if (pathNode && !this.allocatedAscendancyNodes.has(pathNodeId)) {
                pathNode.classList.add('allocated')
                this.allocatedAscendancyNodes.add(pathNodeId)
              }
            })
          }
        } else {
          const path = this.findShortestPath(nodeId)
          if (path !== null) {
            target.classList.add('allocated')
            this.allocatedNodes.add(nodeId)

            path.forEach(pathNodeId => {
              const pathNode = this.nodeElements.get(pathNodeId)
              if (pathNode && !this.allocatedNodes.has(pathNodeId)) {
                pathNode.classList.add('allocated')
                this.allocatedNodes.add(pathNodeId)
              }
            })
          }
        }
      }

      this.updatePointsDisplay()
      this.updateAllConnections()
      this.autoSave()
    }
  }

  private handleNodeHover(e: Event) {
    const target = e.target as HTMLElement
    if (target.tagName === 'circle' && target.id.startsWith('n')) {
      const nodeId = target.id.replace('n', '')
      this.showPreview(nodeId)
    }
  }

  private handleNodeOut(e: Event) {
    const target = e.target as HTMLElement
    if (target.tagName === 'circle') {
      this.clearPreview()
    }
  }

  private handleTooltipMove(e: MouseEvent) {
    const target = e.target as HTMLElement
    if (target.tagName === 'circle' && target.id.startsWith('n')) {
      const nodeId = target.id.slice(1)
      this.showTooltip(nodeId, e)
    } else {
      if (this.tooltipNodeId !== null) {
        this.tooltipNodeId = null
        const tooltip = document.getElementById('node-tooltip')
        if (tooltip) tooltip.style.display = 'none'
      }
    }
  }

  private isAscendancyNode(nodeId: string): boolean {
    if (!this.currentSelectedAscendancy) return false
    const ascData = this.ascendancyData[this.currentSelectedAscendancy]
    return ascData && ascData.nodes.includes(nodeId)
  }

  private findShortestPath(targetNodeId: string): string[] | null {
    if (this.allocatedNodes.size === 0) return []

    const queue: string[] = []
    const visited = new Set<string>()
    const parent = new Map<string, string>()

    queue.push(targetNodeId)
    visited.add(targetNodeId)

    while (queue.length > 0) {
      const currentId = queue.shift()!

      if (this.allocatedNodes.has(currentId)) {
        const path: string[] = []
        let node = currentId
        while (parent.has(node)) {
          node = parent.get(node)!
          if (!this.allocatedNodes.has(node)) {
            path.push(node)
          }
        }
        return path
      }

      const neighbors = this.connectionGraph.get(currentId) || []
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId) && !this.allAscendancyNodeIds.has(neighborId)) {
          visited.add(neighborId)
          parent.set(neighborId, currentId)
          queue.push(neighborId)
        }
      })
    }

    return null
  }

  private findDisconnectedNodes(removedNodeId: string): string[] {
    if (!this.startingNodeId) return []

    // Single BFS from start (excluding removedNodeId) — O(nodes) instead of O(nodes²)
    const reachable = new Set<string>()
    const queue = [this.startingNodeId]
    reachable.add(this.startingNodeId)

    while (queue.length > 0) {
      const currentId = queue.shift()!
      for (const neighborId of (this.connectionGraph.get(currentId) || [])) {
        if (!reachable.has(neighborId) &&
            neighborId !== removedNodeId &&
            this.allocatedNodes.has(neighborId) &&
            !this.allAscendancyNodeIds.has(neighborId)) {
          reachable.add(neighborId)
          queue.push(neighborId)
        }
      }
    }

    const disconnected: string[] = []
    this.allocatedNodes.forEach(nodeId => {
      if (nodeId !== removedNodeId && !reachable.has(nodeId)) {
        disconnected.push(nodeId)
      }
    })
    return disconnected
  }

  private findShortestPathAscendancy(targetNodeId: string): string[] | null {
    if (this.allocatedAscendancyNodes.size === 0) return null

    const queue: string[] = []
    const visited = new Set<string>()
    const parent = new Map<string, string>()

    queue.push(targetNodeId)
    visited.add(targetNodeId)

    while (queue.length > 0) {
      const currentId = queue.shift()!

      if (this.allocatedAscendancyNodes.has(currentId)) {
        const path: string[] = []
        let node = currentId
        while (parent.has(node)) {
          node = parent.get(node)!
          if (!this.allocatedAscendancyNodes.has(node)) {
            path.push(node)
          }
        }
        return path
      }

      const neighbors = this.connectionGraph.get(currentId) || []
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId) && this.isAscendancyNode(neighborId)) {
          visited.add(neighborId)
          parent.set(neighborId, currentId)
          queue.push(neighborId)
        }
      })
    }

    return null
  }

  private findDisconnectedNodesAscendancy(removedNodeId: string): string[] {
    if (!this.ascendancyStartingNodeId) return []

    // Single BFS from ascendancy start (excluding removedNodeId)
    const reachable = new Set<string>()
    const queue = [this.ascendancyStartingNodeId]
    reachable.add(this.ascendancyStartingNodeId)

    while (queue.length > 0) {
      const currentId = queue.shift()!
      for (const neighborId of (this.connectionGraph.get(currentId) || [])) {
        if (!reachable.has(neighborId) &&
            neighborId !== removedNodeId &&
            this.allocatedAscendancyNodes.has(neighborId) &&
            this.isAscendancyNode(neighborId)) {
          reachable.add(neighborId)
          queue.push(neighborId)
        }
      }
    }

    const disconnected: string[] = []
    this.allocatedAscendancyNodes.forEach(nodeId => {
      if (nodeId !== removedNodeId && !reachable.has(nodeId)) {
        disconnected.push(nodeId)
      }
    })
    return disconnected
  }

  private updateAllConnections() {
    this.connElements.forEach((conn, connId) => {
      const parts = connId.slice(1).split('-')
      if (parts.length !== 2) return
      const n1 = this.nodeElements.get(parts[0])
      const n2 = this.nodeElements.get(parts[1])
      if (n1 && n2 && n1.classList.contains('allocated') && n2.classList.contains('allocated')) {
        conn.classList.add('active')
      } else {
        conn.classList.remove('active')
      }
    })
  }

  private clearPreview() {
    this.previewedNodeIds.forEach(id => {
      const node = this.nodeElements.get(id)
      if (node) {
        node.classList.remove('preview')
        node.classList.remove('preview-remove')
      }
    })
    this.previewedNodeIds.clear()

    this.previewedConnIds.forEach(id => {
      const conn = this.connElements.get(id)
      if (conn) conn.classList.remove('preview')
    })
    this.previewedConnIds.clear()
  }

  private showPreview(nodeId: string) {
    if (this.isReadOnly) return
    this.clearPreview()

    if (this.allocatedNodes.has(nodeId)) {
      const disconnected = this.findDisconnectedNodes(nodeId)
      if (nodeId !== this.startingNodeId) {
        const targetNode = this.nodeElements.get(nodeId)
        if (targetNode) {
          targetNode.classList.add('preview-remove')
          this.previewedNodeIds.add(nodeId)
        }
      }
      disconnected.forEach(discNodeId => {
        const discNode = this.nodeElements.get(discNodeId)
        if (discNode) {
          discNode.classList.add('preview-remove')
          this.previewedNodeIds.add(discNodeId)
        }
      })
    } else {
      const path = this.findShortestPath(nodeId)
      if (path !== null) {
        const targetNode = this.nodeElements.get(nodeId)
        if (targetNode) {
          targetNode.classList.add('preview')
          this.previewedNodeIds.add(nodeId)
        }
        path.forEach(pathNodeId => {
          if (!this.allocatedNodes.has(pathNodeId)) {
            const pathNode = this.nodeElements.get(pathNodeId)
            if (pathNode) {
              pathNode.classList.add('preview')
              this.previewedNodeIds.add(pathNodeId)
            }
          }
        })

        const previewSet = new Set([nodeId, ...path])
        this.connElements.forEach((conn, connId) => {
          if (!connId.startsWith('c')) return
          const parts = connId.slice(1).split('-')
          if (parts.length === 2) {
            const [id1, id2] = parts
            if ((previewSet.has(id1) || this.allocatedNodes.has(id1)) &&
                (previewSet.has(id2) || this.allocatedNodes.has(id2))) {
              conn.classList.add('preview')
              this.previewedConnIds.add(connId)
            }
          }
        })
      }
    }
  }

  private showTooltip(nodeId: string, e: MouseEvent) {
    if (!this.treeData) return

    const nodeData = this.treeData.nodes[nodeId]
    if (!nodeData) return

    const tooltip = document.getElementById('node-tooltip')
    if (!tooltip) return

    // Only rewrite content when hovering a different node
    if (this.tooltipNodeId !== nodeId) {
      this.tooltipNodeId = nodeId
      const tooltipTitle = tooltip.querySelector('.tooltip-title')
      const tooltipStats = tooltip.querySelector('.tooltip-stats')

      if (tooltipTitle && tooltipStats) {
        tooltipTitle.textContent = nodeData.name || 'Unknown Node'
        tooltipTitle.className = 'tooltip-title'
        if (nodeData.isKeystone) tooltipTitle.classList.add('keystone')
        else if (nodeData.isNotable) tooltipTitle.classList.add('notable')

        tooltipStats.innerHTML = nodeData.stats?.length
          ? nodeData.stats.map(stat => `<div>${stat}</div>`).join('')
          : '<div style="color: #888; font-style: italic;">No stats</div>'
      }
    }

    tooltip.style.left = (e.clientX + 15) + 'px'
    tooltip.style.top = (e.clientY + 15) + 'px'
    tooltip.style.display = 'block'
  }

  private setupDropdowns() {
    const classDropdown = document.getElementById('class-dropdown') as HTMLSelectElement
    const ascendancyDropdown = document.getElementById('ascendancy-dropdown') as HTMLSelectElement

    if (classDropdown) {
      classDropdown.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement
        const nodeId = target.value
        const selectedOption = target.selectedOptions[0]
        const className = selectedOption ? selectedOption.textContent : ''

        // Reset ascendancy
        this.currentSelectedAscendancy = null

        Object.keys(this.ascendancyData).forEach(ascName => {
          const group = this.svg!.querySelector(`[id="ascendancy-${ascName}"]`)
          if (group) (group as HTMLElement).style.display = 'none'
        })

        // Populate ascendancy dropdown
        ascendancyDropdown.innerHTML = '<option value="">-- Select Ascendancy --</option>'

        if (className && this.classAscendancies[className]) {
          this.classAscendancies[className].forEach(ascKey => {
            const option = document.createElement('option')
            option.value = ascKey
            option.textContent = this.ascendancyNames[ascKey] || ascKey
            ascendancyDropdown.appendChild(option)
          })
          ascendancyDropdown.disabled = false
        } else {
          ascendancyDropdown.disabled = true
        }

        if (!nodeId) return

        // Clear allocated nodes
        this.allocatedNodes.forEach(id => {
          const node = this.svg!.querySelector(`#n${id}`)
          if (node) {
            node.classList.remove('allocated')
          }
        })
        this.allocatedNodes.clear()

        const allConnections = this.svg!.querySelectorAll('#connections line, #connections path')
        allConnections.forEach(conn => conn.classList.remove('active'))

        // Allocate starting node
        const startingNode = this.svg!.querySelector(`#n${nodeId}`)
        if (startingNode) {
          startingNode.classList.add('allocated')
          this.allocatedNodes.add(nodeId)
          this.startingNodeId = nodeId
          this.updatePointsDisplay()
        }
      })
    }

    if (ascendancyDropdown) {
      ascendancyDropdown.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement
        const selectedAscendancy = target.value

        // Clear ascendancy nodes
        this.allocatedAscendancyNodes.forEach(nodeId => {
          const node = this.svg!.querySelector(`#n${nodeId}`)
          if (node) {
            node.classList.remove('allocated')
          }
        })
        this.allocatedAscendancyNodes.clear()
        this.ascendancyStartingNodeId = null

        // Hide all ascendancies
        Object.keys(this.ascendancyData).forEach(ascName => {
          const group = this.svg!.querySelector(`[id="ascendancy-${ascName}"]`)
          if (group) (group as HTMLElement).style.display = 'none'
        })

        // Show selected ascendancy
        if (selectedAscendancy) {
          const group = this.svg!.querySelector(`[id="ascendancy-${selectedAscendancy}"]`)
          if (group) {
            (group as HTMLElement).style.display = 'block'
            this.currentSelectedAscendancy = selectedAscendancy
          }

          // Auto-allocate starting node
          const startNodeId = this.ascendancyStartNodes[selectedAscendancy]
          if (startNodeId) {
            const startNode = this.svg!.querySelector(`#n${startNodeId}`)
            if (startNode) {
              startNode.classList.add('allocated')
              this.allocatedAscendancyNodes.add(startNodeId)
              this.ascendancyStartingNodeId = startNodeId
            }
          }
        } else {
          this.currentSelectedAscendancy = null
        }

        this.updatePointsDisplay()
        this.updateAllConnections()
      })
    }

    // Camera overlay buttons
    const resetCameraBtn = document.getElementById('reset-camera-btn')
    if (resetCameraBtn) {
      resetCameraBtn.addEventListener('click', () => {
        this.resetCamera()
      })
    }

    const zoomInBtn = document.getElementById('zoom-in-btn')
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.zoom = Math.min(10.0, this.zoom + 0.5)
        this.updateViewBox()
      })
    }

    const zoomOutBtn = document.getElementById('zoom-out-btn')
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.zoom = Math.max(0.5, this.zoom - 0.5)
        this.updateViewBox()
      })
    }
  }

  private resetCamera() {
    this.zoom = 1.0
    this.panX = 0
    this.panY = 0
    this.updateViewBox()
  }

  private setupBuildManagement() {
    // Load existing build sets
    this.loadBuildSets()

    // Build set dropdown handler
    const buildSetDropdown = document.getElementById('build-set-dropdown') as HTMLSelectElement
    if (buildSetDropdown) {
      buildSetDropdown.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement
        this.handleBuildSetChange(target.value)
      })
    }

    // Build management button handlers
    const newSetBtn = document.getElementById('new-set-btn')
    const editSetBtn = document.getElementById('edit-set-btn')
    const deleteSetBtn = document.getElementById('delete-set-btn')
    const addBreakpointBtn = document.getElementById('add-breakpoint-btn')
    const editBreakpointBtn = document.getElementById('edit-breakpoint-btn')
    const deleteBreakpointBtn = document.getElementById('delete-breakpoint-btn-quick')
    const saveBtn = document.getElementById('save-breakpoint-btn')
    const loadBtn = document.getElementById('load-breakpoint-btn')

    if (newSetBtn) {
      newSetBtn.addEventListener('click', () => {
        this.openAddBuildSetPopup()
      })
    }

    if (editSetBtn) {
      editSetBtn.addEventListener('click', () => {
        this.handleEditBuildSetClick()
      })
    }

    if (deleteSetBtn) {
      deleteSetBtn.addEventListener('click', () => {
        this.handleDeleteBuildSetClick()
      })
    }

    if (addBreakpointBtn) {
      addBreakpointBtn.addEventListener('click', () => {
        if (!this.currentBuildSetId) {
          console.warn('Please select or create a build set first')
          // TODO: Show a toast/notification
          return
        }
        this.openAddBreakpointPopup()
      })
    }

    if (editBreakpointBtn) {
      editBreakpointBtn.addEventListener('click', () => {
        this.handleEditBreakpointClick()
      })
    }

    if (deleteBreakpointBtn) {
      deleteBreakpointBtn.addEventListener('click', () => {
        this.handleDeleteBreakpointClick()
      })
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        console.log('Saving current breakpoint')
        // TODO: Implement save current state to breakpoint
      })
    }

    if (loadBtn) {
      loadBtn.addEventListener('click', () => {
        console.log('Loading breakpoint')
        // TODO: Implement load breakpoint
      })
    }

    // Breakpoint dropdown handler
    const breakpointDropdown = document.getElementById('breakpoint-dropdown') as HTMLSelectElement
    if (breakpointDropdown) {
      breakpointDropdown.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement
        this.handleBreakpointChange(target.value)
      })
    }
  }

  async handleCreateBuildSet(name: string) {
    try {
      const newBuildSet = await buildStorage.createBuildSet(name)
      console.log('Created new build set:', newBuildSet)

      // Reload build sets and update dropdown
      await this.loadBuildSets()

      // Select the newly created build set
      this.currentBuildSetId = newBuildSet.id
      this.updateBuildSetDropdown()

      // Don't call onBuildSetCreated here - it would create a loop
      // The event bus already handled the communication
    } catch (error) {
      console.error('Error creating build set:', error)
    }
  }

  async loadBuildSets() {
    try {
      this.buildSets = await buildStorage.getAllBuildSets()
      this.updateBuildSetDropdown()

      // On first load (tree initialization), auto-select the build the user had active
      if (!this.initialized) {
        this.initialized = true
        const savedId = buildStorage.getCurrentBuildSetId()
        if (savedId && this.buildSets.find(b => b.id === savedId)) {
          await this.handleBuildSetChange(savedId)
          // Check for a specific breakpoint requested by the Builder "Edit Tree" action
          const pendingBpId = buildStorage.getPendingBreakpointId()
          if (pendingBpId) {
            // User arrived via Builder's "Edit Tree" — unlock editing
            this.isReadOnly = false
            this.svg?.classList.remove('read-only')
            buildStorage.setPendingBreakpointId(null)
            await this.handleBreakpointChange(pendingBpId)
          }
          return // handleBuildSetChange / handleBreakpointChange calls notifyStateChange
        }
      }

      this.notifyStateChange()
    } catch (error) {
      console.error('Error loading build sets:', error)
    }
  }

  /** Save the current in-memory tree state back to the active breakpoint in storage */
  async saveCurrentBreakpoint(): Promise<boolean> {
    if (!this.currentBuildSetId || !this.currentBreakpointId) return false
    try {
      await buildStorage.updateBreakpoint(this.currentBuildSetId, this.currentBreakpointId, {
        allocatedNodes: Array.from(this.allocatedNodes),
        allocatedAscendancyNodes: Array.from(this.allocatedAscendancyNodes),
        selectedClass: this.startingNodeId,
        selectedAscendancy: this.currentSelectedAscendancy,
      })
      await this.loadBuildSets()
      return true
    } catch (error) {
      console.error('Error saving breakpoint:', error)
      return false
    }
  }

  updateBuildSetDropdown() {
    const dropdown = document.getElementById('build-set-dropdown') as HTMLSelectElement
    if (!dropdown) return

    // Clear existing options except the first one
    dropdown.innerHTML = '<option value="">-- New Build Set --</option>'

    // Add build sets
    this.buildSets.forEach(buildSet => {
      const option = document.createElement('option')
      option.value = buildSet.id
      option.textContent = buildSet.name
      dropdown.appendChild(option)
    })

    // Select current build set if one is active
    if (this.currentBuildSetId) {
      dropdown.value = this.currentBuildSetId
    }
  }

  async handleBuildSetChange(buildSetId: string) {
    if (!buildSetId) {
      this.currentBuildSetId = null
      this.currentBreakpointId = null
      buildStorage.setCurrentBuildSetId(null)
      this.updateBreakpointDropdown()
      this.notifyStateChange()
      return
    }

    this.currentBuildSetId = buildSetId
    buildStorage.setCurrentBuildSetId(buildSetId)

    const buildSet = await buildStorage.getBuildSet(buildSetId)
    if (buildSet) {
      console.log('Loaded build set:', buildSet)
      this.updateBreakpointDropdown()

      const sorted = [...buildSet.breakpoints].sort((a, b) => a.level - b.level)
      if (sorted.length > 0) {
        // Load first breakpoint — it restores class/ascendancy via updateDropdownsFromState
        this.currentBreakpointId = sorted[0].id
        await this.loadBreakpoint(this.currentBreakpointId)
      } else if (buildSet.className) {
        // No breakpoints yet — apply the build-level class/ascendancy directly
        this.applyBuildClassAndAscendancy(buildSet.className, buildSet.ascendancy ?? null)
      }
    }
    this.notifyStateChange()
  }

  /** Programmatically drive the hidden class/ascendancy dropdowns so the tree reacts correctly */
  private applyBuildClassAndAscendancy(className: string, ascendancyKey: string | null) {
    const classDropdown = document.getElementById('class-dropdown') as HTMLSelectElement | null
    if (classDropdown) {
      // Find option by text (needed because Ranger and Huntress share the same nodeId)
      for (let i = 0; i < classDropdown.options.length; i++) {
        if (classDropdown.options[i].text === className) {
          classDropdown.selectedIndex = i
          break
        }
      }
      classDropdown.dispatchEvent(new Event('change'))
    }

    if (ascendancyKey) {
      const ascDropdown = document.getElementById('ascendancy-dropdown') as HTMLSelectElement | null
      if (ascDropdown) {
        ascDropdown.value = ascendancyKey
        ascDropdown.dispatchEvent(new Event('change'))
      }
    }
  }

  async handleCreateBreakpoint(name: string, level: number) {
    if (!this.currentBuildSetId) {
      console.error('No build set selected')
      return
    }

    try {
      const breakpoint = await buildStorage.addBreakpoint(this.currentBuildSetId, {
        name,
        level,
        allocatedNodes: Array.from(this.allocatedNodes),
        allocatedAscendancyNodes: Array.from(this.allocatedAscendancyNodes),
        selectedClass: this.startingNodeId,
        selectedAscendancy: this.currentSelectedAscendancy
      })

      if (breakpoint) {
        console.log('Created breakpoint:', breakpoint)

        // Reload the build set to get updated breakpoints
        await this.loadBuildSets()

        // Update breakpoint dropdown
        this.currentBreakpointId = breakpoint.id
        this.updateBreakpointDropdown()
      }
    } catch (error) {
      console.error('Error creating breakpoint:', error)
    }
  }

  updateBreakpointDropdown() {
    const dropdown = document.getElementById('breakpoint-dropdown') as HTMLSelectElement
    if (!dropdown) return

    // Clear existing options
    dropdown.innerHTML = '<option value="">-- Select Breakpoint --</option>'

    if (!this.currentBuildSetId) {
      return
    }

    // Find current build set
    const buildSet = this.buildSets.find(bs => bs.id === this.currentBuildSetId)
    if (!buildSet) return

    // Add breakpoints sorted by level
    const sortedBreakpoints = [...buildSet.breakpoints].sort((a, b) => a.level - b.level)

    sortedBreakpoints.forEach(breakpoint => {
      const option = document.createElement('option')
      option.value = breakpoint.id
      option.textContent = `Level ${breakpoint.level}: ${breakpoint.name}`
      dropdown.appendChild(option)
    })

    // Select current breakpoint if one is active
    if (this.currentBreakpointId) {
      dropdown.value = this.currentBreakpointId
    }
  }

  async handleBreakpointChange(breakpointId: string) {
    if (!this.isReadOnly) await this.autoSave()

    if (!breakpointId) {
      this.currentBreakpointId = null
      this.notifyStateChange()
      return
    }

    this.currentBreakpointId = breakpointId
    await this.loadBreakpoint(breakpointId)
    this.notifyStateChange()
  }

  async loadBreakpoint(breakpointId: string) {
    if (!this.currentBuildSetId) return

    const buildSet = await buildStorage.getBuildSet(this.currentBuildSetId)
    if (!buildSet) return

    const breakpoint = buildSet.breakpoints.find(bp => bp.id === breakpointId)
    if (!breakpoint) return

    console.log('Loading breakpoint:', breakpoint)

    // Clear current allocations
    this.clearAllAllocations()

    // Restore allocated nodes
    breakpoint.allocatedNodes.forEach(nodeId => {
      const node = this.svg?.querySelector(`#n${nodeId}`)
      if (node) {
        node.classList.add('allocated')
        this.allocatedNodes.add(nodeId)
      }
    })

    // Restore ascendancy allocations
    breakpoint.allocatedAscendancyNodes.forEach(nodeId => {
      const node = this.svg?.querySelector(`#n${nodeId}`)
      if (node) {
        node.classList.add('allocated')
        this.allocatedAscendancyNodes.add(nodeId)
      }
    })

    // Restore starting node
    if (breakpoint.selectedClass) {
      this.startingNodeId = breakpoint.selectedClass
    }

    // Ensure the starting class node is always physically allocated.
    // Steps created from the Builder have allocatedNodes:[] but selectedClass set.
    if (this.startingNodeId && !this.allocatedNodes.has(this.startingNodeId)) {
      const startNode = this.svg?.querySelector(`#n${this.startingNodeId}`)
      if (startNode) {
        startNode.classList.add('allocated')
        this.allocatedNodes.add(this.startingNodeId)
      }
    }

    // Restore ascendancy selection
    if (breakpoint.selectedAscendancy) {
      this.currentSelectedAscendancy = breakpoint.selectedAscendancy
      const ascendancyStartNode = this.ascendancyStartNodes[breakpoint.selectedAscendancy]
      if (ascendancyStartNode) {
        this.ascendancyStartingNodeId = ascendancyStartNode
      }
    }

    // Ensure the ascendancy starting node is always physically allocated.
    if (this.ascendancyStartingNodeId && !this.allocatedAscendancyNodes.has(this.ascendancyStartingNodeId)) {
      const ascStartNode = this.svg?.querySelector(`#n${this.ascendancyStartingNodeId}`)
      if (ascStartNode) {
        ascStartNode.classList.add('allocated')
        this.allocatedAscendancyNodes.add(this.ascendancyStartingNodeId)
      }
    }

    // Update UI dropdowns
    this.updateDropdownsFromState()

    this.updatePointsDisplay()
    this.updateAllConnections()
  }

  clearAllAllocations() {
    // Clear regular nodes
    this.allocatedNodes.forEach(nodeId => {
      const node = this.svg?.querySelector(`#n${nodeId}`)
      if (node) {
        node.classList.remove('allocated')
      }
    })
    this.allocatedNodes.clear()

    // Clear ascendancy nodes
    this.allocatedAscendancyNodes.forEach(nodeId => {
      const node = this.svg?.querySelector(`#n${nodeId}`)
      if (node) {
        node.classList.remove('allocated')
      }
    })
    this.allocatedAscendancyNodes.clear()

    this.startingNodeId = null
    this.ascendancyStartingNodeId = null
    this.currentSelectedAscendancy = null
  }

  updateDropdownsFromState() {
    const classDropdown = document.getElementById('class-dropdown') as HTMLSelectElement
    const ascendancyDropdown = document.getElementById('ascendancy-dropdown') as HTMLSelectElement

    if (!classDropdown || !ascendancyDropdown) return

    // Update class dropdown
    if (this.startingNodeId) {
      classDropdown.value = this.startingNodeId

      // Get the class name from the selected option
      const selectedOption = classDropdown.selectedOptions[0]
      const className = selectedOption ? selectedOption.textContent : null

      // Populate ascendancy dropdown based on selected class
      if (className && this.classAscendancies[className]) {
        ascendancyDropdown.innerHTML = '<option value="">-- Select Ascendancy --</option>'
        this.classAscendancies[className].forEach(ascKey => {
          const option = document.createElement('option')
          option.value = ascKey
          option.textContent = this.ascendancyNames[ascKey] || ascKey
          ascendancyDropdown.appendChild(option)
        })
        ascendancyDropdown.disabled = false
      }
    } else {
      classDropdown.value = ''
      ascendancyDropdown.innerHTML = '<option value="">-- Select Class First --</option>'
      ascendancyDropdown.disabled = true
    }

    // Hide all ascendancy groups first
    Object.keys(this.ascendancyData).forEach(ascName => {
      const group = this.svg?.querySelector(`[id="ascendancy-${ascName}"]`)
      if (group) (group as HTMLElement).style.display = 'none'
    })

    // Update ascendancy dropdown and show selected ascendancy group
    if (this.currentSelectedAscendancy) {
      ascendancyDropdown.value = this.currentSelectedAscendancy

      // Show the selected ascendancy group
      const group = this.svg?.querySelector(`[id="ascendancy-${this.currentSelectedAscendancy}"]`)
      if (group) {
        (group as HTMLElement).style.display = 'block'
      }
    } else {
      ascendancyDropdown.value = ''
    }
  }

  // Edit/Delete handlers for buttons
  handleEditBuildSetClick() {
    if (!this.currentBuildSetId) {
      console.warn('No build set selected to edit')
      return
    }

    const buildSet = this.buildSets.find(bs => bs.id === this.currentBuildSetId)
    if (!buildSet) return

    // Emit event to open edit popup with current data
    this.eventBus.emit('openEditBuildSet', {
      id: buildSet.id,
      name: buildSet.name,
      ascendancy: buildSet.ascendancy ?? null
    })
  }

  handleDeleteBuildSetClick() {
    if (!this.currentBuildSetId) {
      console.warn('No build set selected to delete')
      return
    }

    const buildSet = this.buildSets.find(bs => bs.id === this.currentBuildSetId)
    if (!buildSet) return

    if (confirm(`Delete build set "${buildSet.name}"? This will also delete all breakpoints.`)) {
      this.eventBus.emit('deleteBuildSet', this.currentBuildSetId)
    }
  }

  handleEditBreakpointClick() {
    if (!this.currentBuildSetId) {
      console.warn('No build set selected')
      return
    }

    if (!this.currentBreakpointId) {
      console.warn('No breakpoint selected to edit')
      return
    }

    const buildSet = this.buildSets.find(bs => bs.id === this.currentBuildSetId)
    if (!buildSet) return

    const breakpoint = buildSet.breakpoints.find(bp => bp.id === this.currentBreakpointId)
    if (!breakpoint) return

    // Emit event to open edit popup with current data
    this.eventBus.emit('openEditBreakpoint', {
      buildSetId: this.currentBuildSetId,
      breakpointId: breakpoint.id,
      name: breakpoint.name,
      level: breakpoint.level
    })
  }

  handleDeleteBreakpointClick() {
    if (!this.currentBuildSetId) {
      console.warn('No build set selected')
      return
    }

    if (!this.currentBreakpointId) {
      console.warn('No breakpoint selected to delete')
      return
    }

    const buildSet = this.buildSets.find(bs => bs.id === this.currentBuildSetId)
    if (!buildSet) return

    const breakpoint = buildSet.breakpoints.find(bp => bp.id === this.currentBreakpointId)
    if (!breakpoint) return

    if (confirm(`Delete breakpoint "${breakpoint.name}"?`)) {
      this.eventBus.emit('deleteBreakpoint', {
        buildSetId: this.currentBuildSetId,
        breakpointId: this.currentBreakpointId
      })
    }
  }

  async handleEditBuildSet(id: string, name: string, ascendancy?: string | null) {
    try {
      const updates: { name: string; ascendancy?: string } = { name }
      if (ascendancy !== undefined) {
        // null means explicitly cleared; string means set; undefined means don't touch
        updates.ascendancy = ascendancy ?? undefined
      }
      const updatedBuildSet = await buildStorage.updateBuildSet(id, updates)
      if (updatedBuildSet) {
        console.log('Updated build set:', updatedBuildSet)
        await this.loadBuildSets()
        this.updateBuildSetDropdown()
      }
    } catch (error) {
      console.error('Error updating build set:', error)
    }
  }

  async handleDeleteBuildSet(id: string) {
    try {
      const success = await buildStorage.deleteBuildSet(id)
      if (success) {
        console.log('Deleted build set')

        // Clear current selection if we deleted it
        if (this.currentBuildSetId === id) {
          this.currentBuildSetId = null
          this.currentBreakpointId = null
        }

        await this.loadBuildSets()
        this.updateBuildSetDropdown()
        this.updateBreakpointDropdown()
      }
    } catch (error) {
      console.error('Error deleting build set:', error)
    }
  }

  async handleEditBreakpoint(buildSetId: string, breakpointId: string, name: string, level: number) {
    try {
      const updatedBreakpoint = await buildStorage.updateBreakpoint(buildSetId, breakpointId, {
        name,
        level
      })
      if (updatedBreakpoint) {
        console.log('Updated breakpoint:', updatedBreakpoint)
        await this.loadBuildSets()
        this.updateBreakpointDropdown()
      }
    } catch (error) {
      console.error('Error updating breakpoint:', error)
    }
  }

  async handleDeleteBreakpoint(buildSetId: string, breakpointId: string) {
    try {
      const success = await buildStorage.deleteBreakpoint(buildSetId, breakpointId)
      if (success) {
        console.log('Deleted breakpoint')

        // Clear current breakpoint if we deleted it
        if (this.currentBreakpointId === breakpointId) {
          this.currentBreakpointId = null
        }

        await this.loadBuildSets()
        this.updateBreakpointDropdown()
      }
    } catch (error) {
      console.error('Error deleting breakpoint:', error)
    }
  }

  updatePointsDisplay() {
    const pointsUsed = this.startingNodeId ? this.allocatedNodes.size - 1 : 0
    const ascendancyPointsUsed = this.ascendancyStartingNodeId ? this.allocatedAscendancyNodes.size - 1 : 0

    const pointsUsedEl = document.getElementById('points-used')
    const ascPointsUsedEl = document.getElementById('ascendancy-points-used')

    if (pointsUsedEl) pointsUsedEl.textContent = pointsUsed.toString()
    if (ascPointsUsedEl) ascPointsUsedEl.textContent = ascendancyPointsUsed.toString()
  }
}
