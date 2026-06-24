const RIGHT_ANGLE = Math.PI / 2

export const DEFAULT_SMART_ROUTER_OFFSET = 10
export const DEFAULT_SMART_ROUTER_GRID_SIZE = 10
export const DEFAULT_ORTH_ROUTER_PADDING = 4
const OBSTACLE_PROXIMITY_PADDING = 2

export type SmartRouterConfig = {
  type: 'shortest-path'
  enableObstacleAvoidance: true
  offset: number
  gridSize: number
  maxAllowedDirectionChange: number
  maximumLoops: number
  startDirections: Array<'top' | 'right' | 'bottom' | 'left'>
  endDirections: Array<'top' | 'right' | 'bottom' | 'left'>
  penalties: Record<string, number>
}

export type OrthRouterConfig = {
  type: 'orth'
  padding: number
}

export type EdgeRouterConfig = false | SmartRouterConfig | OrthRouterConfig

export type EdgeStyleLike = {
  smartRouting?: boolean
  smartRouterOffset?: number
  smartRouterGridSize?: number
  router?: EdgeRouterConfig
  [key: string]: unknown
}

export type EdgeLike = {
  id?: string
  source?: string
  target?: string
  type?: string
  style?: EdgeStyleLike
}

type Point = { x: number; y: number }
type Rect = { left: number; top: number; right: number; bottom: number }

function isEdgeLike(input: EdgeLike | EdgeStyleLike | null | undefined): input is EdgeLike {
  return !!input && typeof input === 'object' && 'style' in input
}

function toPositiveNumber(value: unknown, fallback: number) {
  const next = Number(value)
  return Number.isFinite(next) && next > 0 ? next : fallback
}

export function isSmartRoutingEnabled(input?: EdgeLike | EdgeStyleLike | null) {
  const style = isEdgeLike(input) ? input.style : input
  if (typeof style?.smartRouting === 'boolean') return style.smartRouting
  return true
}

export function getSmartRouterConfig(style?: EdgeStyleLike): EdgeRouterConfig {
  return {
    type: 'shortest-path',
    enableObstacleAvoidance: true,
    offset: toPositiveNumber(style?.smartRouterOffset, DEFAULT_SMART_ROUTER_OFFSET),
    gridSize: toPositiveNumber(style?.smartRouterGridSize, DEFAULT_SMART_ROUTER_GRID_SIZE),
    maxAllowedDirectionChange: RIGHT_ANGLE,
    maximumLoops: 5000,
    startDirections: ['top', 'right', 'bottom', 'left'],
    endDirections: ['top', 'right', 'bottom', 'left'],
    penalties: {
      0: 0,
      [String(RIGHT_ANGLE)]: 8,
    },
  }
}

export function getNormalRouter(type?: string): EdgeRouterConfig {
  if (type === 'polyline' || type === 'double-polyline') {
    return {
      type: 'orth',
      padding: DEFAULT_ORTH_ROUTER_PADDING,
    }
  }
  return false
}

export function getEdgeRouter(edge: EdgeLike): EdgeRouterConfig
export function getEdgeRouter(type?: string, style?: EdgeStyleLike): EdgeRouterConfig
export function getEdgeRouter(input?: EdgeLike | string, styleArg?: EdgeStyleLike): EdgeRouterConfig {
  const type = typeof input === 'string' ? input : input?.type
  const style = typeof input === 'string' ? styleArg : input?.style
  return isSmartRoutingEnabled(style) ? getSmartRouterConfig(style) : getNormalRouter(type)
}

export function getRenderedEdgeType(edge: EdgeLike) {
  const type = edge.type ?? 'polyline'
  const router = edge.style?.router
  const routerType = router ? router.type : null
  if (!isSmartRoutingEnabled(edge) || !routerType) return type
  if (type === 'line') return 'polyline'
  if (type === 'dashed-line' || type === 'dotted-line' || type === 'thick-line') return type
  if (type === 'double-line') return 'double-polyline'
  if (type === 'quadratic' || type === 'cubic') return 'polyline'
  return type
}

function toGraphPoint(position: any): Point | null {
  const x = Array.isArray(position) ? Number(position[0]) : Number(position?.x)
  const y = Array.isArray(position) ? Number(position[1]) : Number(position?.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

function getNodeCenter(graph: any, nodeId: string | undefined): Point | null {
  if (!graph || !nodeId) return null
  return toGraphPoint(graph.getElementPosition(nodeId))
}

function getNodeRect(graph: any, node: any, padding: number): Rect | null {
  const center = getNodeCenter(graph, node?.id)
  if (!center) return null
  const style = node?.style ?? {}
  const width = Number(style.width ?? style.size ?? 0)
  const height = Number(style.height ?? style.size ?? width)
  if (width <= 0 || height <= 0) return null
  return {
    left: center.x - width / 2 - padding,
    top: center.y - height / 2 - padding,
    right: center.x + width / 2 + padding,
    bottom: center.y + height / 2 + padding,
  }
}

function isPointInRect(point: Point, rect: Rect) {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom
}

function ccw(a: Point, b: Point, c: Point) {
  return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x)
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d)
}

function lineIntersectsRect(start: Point, end: Point, rect: Rect) {
  if (isPointInRect(start, rect) || isPointInRect(end, rect)) return true
  const corners = [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom },
  ]
  for (let i = 0; i < corners.length; i += 1) {
    const a = corners[i]
    const b = corners[(i + 1) % corners.length]
    if (segmentsIntersect(start, end, a, b)) return true
  }
  return false
}

export function needsObstacleAvoidance(edge: EdgeLike, graph: any) {
  if (!graph || !edge.source || !edge.target || !isSmartRoutingEnabled(edge)) return false
  const sourceCenter = getNodeCenter(graph, edge.source)
  const targetCenter = getNodeCenter(graph, edge.target)
  if (!sourceCenter || !targetCenter) return false

  const padding = Math.max(
    OBSTACLE_PROXIMITY_PADDING,
    Number(edge.style?.smartRouterOffset ?? DEFAULT_SMART_ROUTER_OFFSET) / 2,
  )

  return graph.getNodeData().some((node: any) => {
    if (!node || node.id === edge.source || node.id === edge.target) return false
    const rect = getNodeRect(graph, node, padding)
    return rect ? lineIntersectsRect(sourceCenter, targetCenter, rect) : false
  })
}

export function resolveEdgeRouter(edge: EdgeLike, graph: any): EdgeRouterConfig {
  if (!isSmartRoutingEnabled(edge)) return getNormalRouter(edge.type)
  return needsObstacleAvoidance(edge, graph) ? getSmartRouterConfig(edge.style) : false
}
