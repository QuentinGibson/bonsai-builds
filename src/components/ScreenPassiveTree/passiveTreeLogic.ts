// Passive Tree Logic - Full implementation from index.html

import { buildStorage, BuildSet } from '../../services/buildStorage'

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

  private readonly maxPoints = 123
  private readonly maxAscendancyPoints = 8

  private openAddBuildSetPopup: () => void
  private openAddBreakpointPopup: () => void
  private eventBus: any

  // Build management
  private buildSets: BuildSet[] = []
  private currentBuildSetId: string | null = null
  private currentBreakpointId: string | null = null

  constructor(openAddBuildSetPopup: () => void, openAddBreakpointPopup: () => void, eventBus: any) {
    this.openAddBuildSetPopup = openAddBuildSetPopup
    this.openAddBreakpointPopup = openAddBreakpointPopup
    this.eventBus = eventBus
  }

  // Ascendancy data - full data from original
  private readonly ascendancyData: Record<string, { nodes: string[], transform: string }> = {
    'Druid1': { nodes: ['378', '4197', '5571', '11335', '15275', '21284', '25092', '30904', '32905', '34313', '37782', '39659', '42761', '47190', '52374', '55135', '56505'], transform: 'translate(20902.97, 2104.17)' },
    'Druid2': { nodes: ['1855', '16204', '26063', '28022', '28745', '33824', '35535', '35762', '35920', '42253', '46654', '54512', '56933', '58646', '61722', '61983', '62523'], transform: 'translate(18777.23, 2154.21)' },
    'Druid3': { nodes: ['2573', '6830', '12816', '13752', '19259', '20041', '28429', '31579', '33582', '35311', '35388', '39614', '39772', '44207', '55382', '59091', '60599'], transform: 'translate(16901.77, 2885.56)' },
    'Duelist1': { nodes: ['7046', '12098', '23826', '25913', '31717', '32222', '38949', '40407', '48546', '57256', '57973', '59474', '61500', '61889', '62386', '62674', '63843'], transform: 'translate(-707.75, -16494.29)' },
    'Duelist2': { nodes: ['3731', '7040', '14460', '15395', '19198', '29718', '30474', '36189', '39210', '39383', '40002', '40226', '52006', '55891', '60122', '60949', '62406'], transform: 'translate(185.29, -18157.20)' },
    'Duelist3': { nodes: ['429', '467', '2375', '3198', '3610', '10889', '16700', '27311', '33436', '35088', '36503', '40548', '42683', '43326', '47676', '48446', '62573'], transform: 'translate(-2366.69, -18279.04)' },
    'Huntress1': { nodes: ['528', '2702', '3065', '5563', '6109', '7979', '9294', '19233', '35033', '35187', '41008', '41736', '42441', '43095', '46071', '47312', '55796', '60662', '63254'], transform: 'translate(-18575.13, -5199.97)' },
    'Huntress2': { nodes: ['765', '4367', '5733', '21519', '26294', '27773', '27841', '28254', '37769', '39887', '41085', '41401', '45228', '46070', '56489', '62424', '62702', '62743', '63493'], transform: 'translate(-18114.96, -6951.15)' },
    'Huntress3': { nodes: ['3223', '4891', '7068', '11776', '17058', '18280', '22661', '30233', '34785', '36365', '37046', '37972', '42017', '58149', '58574', '60859', '62804'], transform: 'translate(-20964.17, -7459.53)' },
    'Marauder1': { nodes: ['8532', '9842', '12004', '12389', '13216', '13434', '14199', '16732', '28460', '28814', '31553', '33810', '34881', '41136', '42816', '62672', '65136'], transform: 'translate(15638.85, -7553.92)' },
    'Marauder2': { nodes: ['4615', '6207', '6799', '12261', '14143', '21343', '21651', '25495', '28539', '31425', '36598', '40246', '40358', '43012', '44561', '54579', '65098'], transform: 'translate(16899.11, -9526.40)' },
    'Marauder3': { nodes: ['11674', '12411', '12826', '18068', '18654', '21773', '23647', '23860', '30817', '31558', '38626', '47642', '47952', '51916', '52088', '61057', '63748'], transform: 'translate(14544.79, -9493.43)' },
    'Mercenary1': { nodes: ['762', '1988', '4086', '4245', '10371', '12054', '15044', '16249', '24696', '29162', '30151', '32560', '32637', '36252', '37523', '42845', '44371', '44746', '46522', '54838', '54892'], transform: 'translate(5755.04, -16850.34)' },
    'Mercenary2': { nodes: ['3704', '6935', '7120', '8272', '17646', '20830', '25172', '32559', '34501', '37078', '38601', '40719', '43131', '46535', '51737', '61897', '61973'], transform: 'translate(7039.73, -19148.85)' },
    'Mercenary3': { nodes: ['1442', '3084', '11641', '14429', '18146', '30996', '32952', '34882', '36728', '36822', '37397', '45248', '53108', '53762', '55536', '55582', '57819', '58591', '60287', '63259'], transform: 'translate(4549.85, -19004.77)' },
    'Monk1': { nodes: ['1739', '11495', '17356', '19370', '20437', '34081', '36643', '37604', '39552', '39595', '41751', '51546', '52295', '53280', '57449', '61586', '65228'], transform: 'translate(-14877.93, 5829.63)' },
    'Monk2': { nodes: ['7621', '8143', '9994', '12876', '13065', '16100', '17268', '23415', '23587', '25434', '27686', '29133', '44357', '52448', '55611', '57181', '63236', '63713', '64031', '65173'], transform: 'translate(-14707.01, 3219.70)' },
    'Monk3': { nodes: ['74', '664', '1347', '3781', '11771', '17923', '18826', '24475', '25779', '25781', '25885', '26283', '31116', '32771', '34817', '36788', '41076', '47344', '50098', '52395', '56331', '59759'], transform: 'translate(-17152.45, 4581.62)' },
    'Ranger1': { nodes: ['30', '3987', '5817', '12033', '23508', '24226', '24295', '29871', '35801', '37336', '39723', '41875', '42416', '46854', '46990', '49165', '59542', '59913', '61461'], transform: 'translate(-14764.13, -4868.33)' },
    'Ranger2': { nodes: ['2373', '5363', '7336', '9529', '11023', '14957', '21719', '24665', '30837', '33201', '34963', '42936', '43835', '47937', '48655', '50878', '55373'], transform: 'translate(-13334.08, -6839.73)' },
    'Ranger3': { nodes: ['16', '40', '1583', '4495', '9710', '9798', '12183', '12795', '13675', '14508', '16433', '18940', '24868', '29074', '33736', '36676', '38004', '39292', '41619', '46454', '49503', '56618', '57141', '57253', '58379', '61804', '61991'], transform: 'translate(-16059.38, -7450)' },
    'Shadow1': { nodes: ['1053', '5162', '10414', '11312', '12799', '19530', '20159', '22050', '25344', '29307', '30998', '33215', '36460', '42596', '43404', '49159', '63282'], transform: 'translate(-13620.01, 10352.87)' },
    'Shadow2': { nodes: ['1226', '1894', '4991', '13317', '15622', '27091', '29322', '30803', '36668', '37563', '38263', '42151', '45406', '52001', '56451', '58418', '60377'], transform: 'translate(-11961.38, 8422.80)' },
    'Shadow3': { nodes: ['2357', '6971', '9707', '12504', '13794', '28353', '30024', '30145', '37921', '38102', '42657', '45769', '48915', '50198', '59432', '62818', '64016'], transform: 'translate(-14416.30, 8512.86)' },
    'Sorceress1': { nodes: ['2857', '7246', '7998', '8867', '12488', '12882', '13673', '18849', '25618', '29398', '38578', '39204', '39640', '40721', '42522', '44484', '49189', '49759', '61985', '64789', '65413'], transform: 'translate(3808.09, 16481.53)' },
    'Sorceress2': { nodes: ['1579', '3605', '10731', '10987', '18678', '22147', '26638', '27990', '28153', '32856', '42035', '43128', '49049', '50219', '54194', '58747', '63002'], transform: 'translate(5769.88, 14953.65)' },
    'Sorceress3': { nodes: ['2810', '8305', '9843', '10561', '13289', '14131', '20701', '23265', '25653', '25683', '25919', '30265', '32705', '34207', '35880', '36096', '36109', '36891', '42034', '43426', '45602', '46091', '54042', '56783', '56857', '64200', '64223', '64591'], transform: 'translate(2746.37, 14654.52)' },
    'Templar1': { nodes: ['2275', '4986', '13663', '15918', '21974', '23443', '23732', '25881', '33239', '35715', '35998', '41311', '44889', '46103', '47526', '63633', '63764'], transform: 'translate(22256.96, 6513.50)' },
    'Templar2': { nodes: ['443', '2187', '9216', '15462', '18096', '20211', '21676', '23641', '26353', '28385', '32191', '45846', '47628', '49398', '51455', '54063', '62882'], transform: 'translate(19756.13, 6783.25)' },
    'Templar3': { nodes: ['950', '7659', '10763', '12040', '21448', '27155', '31686', '38100', '41624', '48905', '48936', '51122', '51742', '55300', '56468', '59905', '65044'], transform: 'translate(17296.97, 6653.86)' },
    'Warrior1': { nodes: ['3762', '12000', '13715', '19424', '24807', '27418', '29323', '30115', '32534', '35453', '38014', '42275', '51690', '56842', '59372', '59540', '60634'], transform: 'translate(17797.64, -3715.46)' },
    'Warrior2': { nodes: ['1994', '6127', '10072', '18585', '23005', '25935', '33812', '36659', '38769', '39365', '39411', '40915', '47097', '48682', '49380', '52068', '58704'], transform: 'translate(20752.06, -4674.49)' },
    'Warrior3': { nodes: ['110', '5386', '5852', '8525', '9988', '9997', '13772', '14960', '16276', '20195', '20895', '22541', '22908', '25438', '47184', '47236', '48537', '49340', '57959', '60298', '60913', '61039', '63401', '64962'], transform: 'translate(21205.86, -7255.40)' },
    'Witch1': { nodes: ['770', '7793', '8854', '10694', '13174', '17754', '18158', '18348', '19482', '23880', '24039', '24135', '25239', '32699', '34419', '36564', '39470', '46016', '46644', '61267', '63484', '63894', '64379'], transform: 'translate(306.38, 17711.22)' },
    'Witch2': { nodes: ['3165', '8415', '23416', '26282', '26383', '27667', '30071', '30117', '31223', '47442', '48551', '50192', '52703', '56162', '59342', '59822', '62388', '65518'], transform: 'translate(-2442.15, 17658.99)' },
    'Witch3': { nodes: ['59', '2516', '2877', '2995', '8611', '17788', '20772', '23352', '23710', '26085', '28431', '33141', '33570', '36696', '39241', '51142', '58751', '58932', '62797'], transform: 'translate(-5240.12, 17902.15)' }
  }

  private readonly classAscendancies: Record<string, string[]> = {
    'Warrior': ['Warrior1', 'Warrior2', 'Warrior3'],
    'Witch': ['Witch1', 'Witch2', 'Witch3'],
    'Ranger': ['Ranger1', 'Ranger2', 'Ranger3'],
    'Huntress': ['Huntress1', 'Huntress2', 'Huntress3'],
    'Mercenary': ['Mercenary1', 'Mercenary2', 'Mercenary3'],
    'Sorceress': ['Sorceress1', 'Sorceress2', 'Sorceress3'],
    'Monk': ['Monk1', 'Monk2', 'Monk3']
  }

  private readonly ascendancyNames: Record<string, string> = {
    'Warrior1': 'Titan',
    'Warrior2': 'Warbringer',
    'Warrior3': 'Smith of Kitava',
    'Witch1': 'Infernalist',
    'Witch2': 'Blood Mage',
    'Witch3': 'Necromancer',
    'Ranger1': 'Deadeye',
    'Ranger2': 'Arcane Archer',
    'Ranger3': 'Pathfinder',
    'Huntress1': 'Amazon',
    'Huntress2': 'Beastmaster',
    'Huntress3': 'Ritualist',
    'Mercenary1': 'Tactician',
    'Mercenary2': 'Witchhunter',
    'Mercenary3': 'Gemling Legionnaire',
    'Sorceress1': 'Stormweaver',
    'Sorceress2': 'Chronomancer',
    'Sorceress3': 'Disciple of the Djinn',
    'Monk1': 'Martial Artist',
    'Monk2': 'Invoker',
    'Monk3': 'Acolyte of Chayula'
  }

  private readonly ascendancyStartNodes: Record<string, string> = {
    'Warrior1': '32534',
    'Warrior2': '33812',
    'Warrior3': '5852',
    'Witch1': '32699',
    'Witch2': '59822',
    'Witch3': '23710',
    'Ranger1': '46990',
    'Ranger2': '24665',
    'Ranger3': '1583',
    'Huntress1': '41736',
    'Huntress2': '63493',
    'Huntress3': '36365',
    'Mercenary1': '36252',
    'Mercenary2': '7120',
    'Mercenary3': '55536',
    'Sorceress1': '40721',
    'Sorceress2': '22147',
    'Sorceress3': '8305',
    'Monk1': '11495',
    'Monk2': '9994',
    'Monk3': '74'
  }

  async initialize(container: HTMLElement) {
    try {
      // Load SVG and tree data
      const [svgContent, treeData] = await Promise.all([
        fetch('/assets-static/poe2snippet.html').then(r => r.text()),
        fetch('/assets-static/data_us.json').then(r => r.json())
      ])

      container.innerHTML = svgContent
      this.svg = container.querySelector('#passive_skill_tree')
      this.treeData = treeData

      if (!this.svg || !this.treeData) {
        throw new Error('Failed to load tree')
      }

      this.setupTree()
    } catch (err) {
      console.error('Failed to initialize passive tree:', err)
      container.innerHTML = '<div style="color: white; padding: 20px;">Failed to load tree.</div>'
    }
  }

  private setupTree() {
    if (!this.svg || !this.treeData) return

    // Group ascendancy nodes first
    this.setupAscendancyGroups()

    // Apply node images
    this.applyNodeImages()

    // Build connection graph
    this.buildConnectionGraph()

    // Setup event listeners
    this.setupEventListeners()

    // Setup zoom and pan
    this.updateViewBox()

    // Setup dropdowns
    this.setupDropdowns()

    // Setup build management
    this.setupBuildManagement()
  }

  private setupAscendancyGroups() {
    if (!this.svg) return

    Object.keys(this.ascendancyData).forEach(ascName => {
      const { nodes: nodeIds, transform } = this.ascendancyData[ascName]

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
      group.id = `ascendancy-${ascName}`
      group.setAttribute('transform', transform)
      group.setAttribute('data-ascendancy', ascName)
      group.style.display = 'none'

      const pathsToMove: Element[] = []
      nodeIds.forEach(nodeId => {
        const connectedPaths = this.svg!.querySelectorAll(`path[id^="c${nodeId}-"], line[id^="c${nodeId}-"], path[id*="-${nodeId}"], line[id*="-${nodeId}"]`)
        connectedPaths.forEach(path => {
          const pathId = path.id
          const match = pathId.match(/c(\d+)-(\d+)/)
          if (match) {
            const [, node1, node2] = match
            if (nodeIds.includes(node1) && nodeIds.includes(node2)) {
              if (!pathsToMove.includes(path)) {
                pathsToMove.push(path)
              }
            }
          }
        })
      })

      pathsToMove.forEach(path => {
        group.appendChild(path)
      })

      nodeIds.forEach(nodeId => {
        const circle = this.svg!.querySelector(`#n${nodeId}`)
        if (circle) {
          group.appendChild(circle)
        }
      })

      this.svg.appendChild(group)
    })
  }

  private applyNodeImages() {
    if (!this.svg || !this.treeData) return

    const nodes = this.treeData.nodes
    Object.keys(nodes).forEach(nodeId => {
      const nodeData = nodes[nodeId]
      const circle = this.svg!.querySelector(`#n${nodeId}`)

      if (circle && nodeData.icon) {
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
          const localPath = passivesPath[1].toLowerCase()
          img.setAttribute('href', `/assets-static/images/passives/${localPath}.png`)
        } else if (skillIconPath) {
          const filename = skillIconPath[1].toLowerCase()
          img.setAttribute('href', `/assets-static/images/${filename}.png`)
        }

        img.setAttribute('pointer-events', 'none')
        img.classList.add('node-icon')
        circle.parentNode?.insertBefore(img, circle.nextSibling)
      }
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
          if (!this.connectionGraph.has(id1)) this.connectionGraph.set(id1, [])
          if (!this.connectionGraph.has(id2)) this.connectionGraph.set(id2, [])
          this.connectionGraph.get(id1)!.push(id2)
          this.connectionGraph.get(id2)!.push(id1)
        }
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

  private updateViewBox() {
    if (!this.svg) return

    const baseViewBox = {
      x: -11326.103852910494,
      y: -11389.628444746082,
      width: 23256.18556701031,
      height: 20315.9793814433
    }

    const width = baseViewBox.width / this.zoom
    const height = baseViewBox.height / this.zoom
    const x = baseViewBox.x - this.panX
    const y = baseViewBox.y - this.panY

    this.svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`)
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button === 0 && (e.target as HTMLElement).tagName !== 'circle') {
      this.isDragging = true
      this.lastX = e.clientX
      this.lastY = e.clientY
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      const dx = e.clientX - this.lastX
      const dy = e.clientY - this.lastY
      this.panX += dx * 50 / this.zoom
      this.panY += dy * 50 / this.zoom

      const maxPan = 30000
      this.panX = Math.max(-maxPan, Math.min(maxPan, this.panX))
      this.panY = Math.max(-maxPan, Math.min(maxPan, this.panY))

      this.lastX = e.clientX
      this.lastY = e.clientY
      this.updateViewBox()
    }
  }

  private handleMouseUp() {
    this.isDragging = false
  }

  private handleWheel(e: WheelEvent) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    this.zoom = Math.max(0.5, Math.min(10.0, this.zoom + delta))
    this.updateViewBox()
  }

  private handleNodeClick(e: Event) {
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
            const discNode = this.svg!.querySelector(`#n${discNodeId}`)
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
            const discNode = this.svg!.querySelector(`#n${discNodeId}`)
            if (discNode) {
              discNode.classList.remove('allocated')
              this.allocatedNodes.delete(discNodeId)
            }
          })
        }
      } else {
        // Allocation
        if (isAscNode) {
          if (!this.ascendancyStartingNodeId) return
          if (this.allocatedAscendancyNodes.size - 1 >= this.maxAscendancyPoints) return

          const path = this.findShortestPathAscendancy(nodeId)
          if (path !== null) {
            target.classList.add('allocated')
            this.allocatedAscendancyNodes.add(nodeId)

            path.forEach(pathNodeId => {
              const pathNode = this.svg!.querySelector(`#n${pathNodeId}`)
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
              const pathNode = this.svg!.querySelector(`#n${pathNodeId}`)
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
      const nodeId = target.id.replace('n', '')
      this.showTooltip(nodeId, e)
    } else {
      const tooltip = document.getElementById('node-tooltip')
      if (tooltip) tooltip.style.display = 'none'
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
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          parent.set(neighborId, currentId)
          queue.push(neighborId)
        }
      })
    }

    return null
  }

  private findDisconnectedNodes(removedNodeId: string): string[] {
    const disconnected: string[] = []

    this.allocatedNodes.forEach(nodeId => {
      if (nodeId === this.startingNodeId || nodeId === removedNodeId) return

      const queue = [nodeId]
      const visited = new Set([nodeId, removedNodeId])
      let foundStart = false

      while (queue.length > 0) {
        const currentId = queue.shift()!

        if (currentId === this.startingNodeId) {
          foundStart = true
          break
        }

        const neighbors = this.connectionGraph.get(currentId) || []
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId) && this.allocatedNodes.has(neighborId)) {
            visited.add(neighborId)
            queue.push(neighborId)
          }
        })
      }

      if (!foundStart) {
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
    const disconnected: string[] = []

    this.allocatedAscendancyNodes.forEach(nodeId => {
      if (nodeId === this.ascendancyStartingNodeId || nodeId === removedNodeId) return

      const queue = [nodeId]
      const visited = new Set([nodeId, removedNodeId])
      let foundStart = false

      while (queue.length > 0) {
        const currentId = queue.shift()!

        if (currentId === this.ascendancyStartingNodeId) {
          foundStart = true
          break
        }

        const neighbors = this.connectionGraph.get(currentId) || []
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId) && this.allocatedAscendancyNodes.has(neighborId) && this.isAscendancyNode(neighborId)) {
            visited.add(neighborId)
            queue.push(neighborId)
          }
        })
      }

      if (!foundStart) {
        disconnected.push(nodeId)
      }
    })

    return disconnected
  }

  private updateAllConnections() {
    if (!this.svg) return

    // Update main tree connections
    const mainConnections = this.svg.querySelectorAll('#connections line, #connections path')
    mainConnections.forEach(conn => {
      const connId = conn.id
      const parts = connId.replace('c', '').split('-')
      if (parts.length === 2) {
        const n1 = this.svg!.querySelector(`#n${parts[0]}`)
        const n2 = this.svg!.querySelector(`#n${parts[1]}`)
        if (n1 && n2 && n1.classList.contains('allocated') && n2.classList.contains('allocated')) {
          conn.classList.add('active')
        } else {
          conn.classList.remove('active')
        }
      }
    })

    // Update ascendancy connections
    const ascendancyConnections = this.svg.querySelectorAll('g[id^="ascendancy-"] line, g[id^="ascendancy-"] path')
    ascendancyConnections.forEach(conn => {
      const connId = conn.id
      const parts = connId.replace('c', '').split('-')
      if (parts.length === 2) {
        const n1 = this.svg!.querySelector(`#n${parts[0]}`)
        const n2 = this.svg!.querySelector(`#n${parts[1]}`)
        if (n1 && n2 && n1.classList.contains('allocated') && n2.classList.contains('allocated')) {
          conn.classList.add('active')
        } else {
          conn.classList.remove('active')
        }
      }
    })
  }

  private clearPreview() {
    if (!this.svg) return

    const previewNodes = this.svg.querySelectorAll('circle.preview, circle.preview-remove')
    previewNodes.forEach(node => {
      node.classList.remove('preview')
      node.classList.remove('preview-remove')
    })

    const previewConns = this.svg.querySelectorAll('#connections line.preview, #connections path.preview')
    previewConns.forEach(conn => conn.classList.remove('preview'))
  }

  private showPreview(nodeId: string) {
    this.clearPreview()

    if (this.allocatedNodes.has(nodeId)) {
      const disconnected = this.findDisconnectedNodes(nodeId)
      const targetNode = this.svg!.querySelector(`#n${nodeId}`)
      if (targetNode && nodeId !== this.startingNodeId) {
        targetNode.classList.add('preview-remove')
      }

      disconnected.forEach(discNodeId => {
        const discNode = this.svg!.querySelector(`#n${discNodeId}`)
        if (discNode) {
          discNode.classList.add('preview-remove')
        }
      })
    } else {
      const path = this.findShortestPath(nodeId)

      if (path !== null) {
        const targetNode = this.svg!.querySelector(`#n${nodeId}`)
        if (targetNode) {
          targetNode.classList.add('preview')
        }

        path.forEach(pathNodeId => {
          const pathNode = this.svg!.querySelector(`#n${pathNodeId}`)
          if (pathNode && !this.allocatedNodes.has(pathNodeId)) {
            pathNode.classList.add('preview')
          }
        })

        const previewNodeIds = new Set([nodeId, ...path])
        const allConnections = this.svg!.querySelectorAll('#connections line, #connections path')
        allConnections.forEach(conn => {
          const connId = conn.id
          if (connId.startsWith('c')) {
            const parts = connId.substring(1).split('-')
            if (parts.length === 2) {
              const [id1, id2] = parts
              if ((previewNodeIds.has(id1) || this.allocatedNodes.has(id1)) &&
                (previewNodeIds.has(id2) || this.allocatedNodes.has(id2))) {
                conn.classList.add('preview')
              }
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
    const tooltipTitle = tooltip?.querySelector('.tooltip-title')
    const tooltipStats = tooltip?.querySelector('.tooltip-stats')

    if (tooltip && tooltipTitle && tooltipStats) {
      tooltipTitle.textContent = nodeData.name || 'Unknown Node'
      tooltipTitle.className = 'tooltip-title'

      if (nodeData.isKeystone) {
        tooltipTitle.classList.add('keystone')
      } else if (nodeData.isNotable) {
        tooltipTitle.classList.add('notable')
      }

      if (nodeData.stats && nodeData.stats.length > 0) {
        tooltipStats.innerHTML = nodeData.stats.map(stat => `<div>${stat}</div>`).join('')
      } else {
        tooltipStats.innerHTML = '<div style="color: #888; font-style: italic;">No stats</div>'
      }

      tooltip.style.left = (e.clientX + 15) + 'px'
      tooltip.style.top = (e.clientY + 15) + 'px'
      tooltip.style.display = 'block'
    }
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
          const group = this.svg!.querySelector(`#ascendancy-${ascName}`)
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
          const group = this.svg!.querySelector(`#ascendancy-${ascName}`)
          if (group) (group as HTMLElement).style.display = 'none'
        })

        // Show selected ascendancy
        if (selectedAscendancy) {
          const group = this.svg!.querySelector(`#ascendancy-${selectedAscendancy}`)
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
    } catch (error) {
      console.error('Error loading build sets:', error)
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
      // User selected "New Build Set"
      this.currentBuildSetId = null
      this.currentBreakpointId = null
      this.updateBreakpointDropdown()
      return
    }

    this.currentBuildSetId = buildSetId
    const buildSet = await buildStorage.getBuildSet(buildSetId)

    if (buildSet) {
      console.log('Loaded build set:', buildSet)
      this.updateBreakpointDropdown()
      // Auto-select first breakpoint if available
      if (buildSet.breakpoints.length > 0) {
        this.currentBreakpointId = buildSet.breakpoints[0].id
        await this.loadBreakpoint(this.currentBreakpointId)
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
    if (!breakpointId) {
      this.currentBreakpointId = null
      return
    }

    this.currentBreakpointId = breakpointId
    await this.loadBreakpoint(breakpointId)
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

    // Restore ascendancy selection
    if (breakpoint.selectedAscendancy) {
      this.currentSelectedAscendancy = breakpoint.selectedAscendancy
      const ascendancyStartNode = this.ascendancyStartNodes[breakpoint.selectedAscendancy]
      if (ascendancyStartNode) {
        this.ascendancyStartingNodeId = ascendancyStartNode
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
      const group = this.svg?.querySelector(`#ascendancy-${ascName}`)
      if (group) (group as HTMLElement).style.display = 'none'
    })

    // Update ascendancy dropdown and show selected ascendancy group
    if (this.currentSelectedAscendancy) {
      ascendancyDropdown.value = this.currentSelectedAscendancy

      // Show the selected ascendancy group
      const group = this.svg?.querySelector(`#ascendancy-${this.currentSelectedAscendancy}`)
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
      name: buildSet.name
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

  async handleEditBuildSet(id: string, name: string) {
    try {
      const updatedBuildSet = await buildStorage.updateBuildSetName(id, name)
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
