import { Cubic, Line, Polyline, Quadratic, register } from '@antv/g6'
import {
  EDGE_VISUAL_GAP,
  getCanonicalPair,
  getVisibleLineOffsetsForEdge,
} from './edgeSpacing'

type Point = [number, number] | Float32Array | number[]
type XY = [number, number]

function toPoint(point: Point): [number, number] {
  return [Number(point[0] ?? 0), Number(point[1] ?? 0)]
}

function isCanonicalDirection(a: Point, b: Point) {
  const [x1, y1] = toPoint(a)
  const [x2, y2] = toPoint(b)
  if (x1 === x2) return y1 <= y2
  return x1 < x2
}

function normalOf(a: Point, b: Point, offset: number) {
  const canonical = isCanonicalDirection(a, b)
  const [x1, y1] = canonical ? toPoint(a) : toPoint(b)
  const [x2, y2] = canonical ? toPoint(b) : toPoint(a)
  const length = Math.hypot(x2 - x1, y2 - y1) || 1
  return [(-(y2 - y1) / length) * offset, ((x2 - x1) / length) * offset]
}

function offsetPath(path: any[], a: Point, b: Point, offset: number) {
  const points = pathToPolylinePoints(path)
  if (points.length >= 2) {
    const canonical = isCanonicalDirection(a, b)
    const orientedPoints = canonical ? points : [...points].reverse()
    const shiftedPoints = offsetPolylinePoints(orientedPoints, offset)
    return polylinePointsToPath(canonical ? shiftedPoints : shiftedPoints.reverse())
  }
  const [nx, ny] = normalOf(a, b, offset)
  return path.map((command) => {
    if (!Array.isArray(command)) return command
    const next = [...command]
    for (let i = 1; i < next.length - 1; i += 2) {
      if (typeof next[i] === 'number') next[i] += nx
      if (typeof next[i + 1] === 'number') next[i + 1] += ny
    }
    return next
  })
}

function normalize(vector: XY): XY {
  const length = Math.hypot(vector[0], vector[1]) || 1
  return [vector[0] / length, vector[1] / length]
}

function add(a: XY, b: XY): XY {
  return [a[0] + b[0], a[1] + b[1]]
}

function scale(point: XY, factor: number): XY {
  return [point[0] * factor, point[1] * factor]
}

function segmentNormal(a: XY, b: XY): XY {
  const [nx, ny] = normalize([-(b[1] - a[1]), b[0] - a[0]])
  return [nx, ny]
}

function pathToPolylinePoints(path: any[]): XY[] {
  const points: XY[] = []
  for (const command of path) {
    if (!Array.isArray(command) || command.length < 3) continue
    const op = String(command[0]).toUpperCase()
    if ((op === 'M' || op === 'L') && typeof command[1] === 'number' && typeof command[2] === 'number') {
      points.push([command[1], command[2]])
    }
  }
  return points
}

function polylinePointsToPath(points: XY[]) {
  if (!points.length) return []
  return points.map((point, index) => [index === 0 ? 'M' : 'L', point[0], point[1]])
}

function distance(a: XY, b: XY) {
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

function trimPolylineFromStart(points: XY[], trimDistance: number) {
  const result = points.map((point) => [...point] as XY)
  if (result.length < 2 || trimDistance <= 0) return result

  let remaining = trimDistance
  while (result.length >= 2 && remaining > 1e-6) {
    const segmentLength = distance(result[0], result[1])
    if (segmentLength <= remaining + 1e-6) {
      remaining -= segmentLength
      result.shift()
      continue
    }
    const direction = normalize([result[1][0] - result[0][0], result[1][1] - result[0][1]])
    result[0] = add(result[0], scale(direction, remaining))
    remaining = 0
  }

  if (result.length === 1) result.push([...result[0]] as XY)
  return result
}

function trimPolylinePoints(points: XY[], startTrim = 0, endTrim = 0) {
  let result = points.map((point) => [...point] as XY)
  if (result.length < 2) return result
  if (startTrim > 0) result = trimPolylineFromStart(result, startTrim)
  if (endTrim > 0) result = trimPolylineFromStart([...result].reverse(), endTrim).reverse()
  return result
}

function trimPath(path: any[], startTrim = 0, endTrim = 0) {
  const points = pathToPolylinePoints(path)
  if (points.length < 2 || (startTrim <= 0 && endTrim <= 0)) return path
  return polylinePointsToPath(trimPolylinePoints(points, startTrim, endTrim))
}

function getArrowCoverTrim(attributes: any, type: 'start' | 'end') {
  const enabled = Boolean(type === 'start' ? attributes.startArrow : attributes.endArrow)
  if (!enabled) return 0
  const size = Number(type === 'start' ? attributes.startArrowSize : attributes.endArrowSize)
  const lineWidth = Number(attributes.lineWidth ?? 1)
  return Math.max((Number.isFinite(size) ? size : 0) * 0.6, EDGE_VISUAL_GAP + lineWidth * 2)
}

function lineIntersection(p1: XY, p2: XY, p3: XY, p4: XY): XY | null {
  const denominator = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0])
  if (Math.abs(denominator) < 1e-6) return null
  const x =
    ((p1[0] * p2[1] - p1[1] * p2[0]) * (p3[0] - p4[0]) - (p1[0] - p2[0]) * (p3[0] * p4[1] - p3[1] * p4[0])) /
    denominator
  const y =
    ((p1[0] * p2[1] - p1[1] * p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] * p4[1] - p3[1] * p4[0])) /
    denominator
  return [x, y]
}

function offsetPolylinePoints(points: XY[], offset: number) {
  if (points.length < 2 || offset === 0) return points.map((point) => [...point] as XY)
  const normals = points.slice(0, -1).map((point, index) => segmentNormal(point, points[index + 1]))
  const shiftedSegments = points.slice(0, -1).map((point, index) => {
    const next = points[index + 1]
    const delta = scale(normals[index], offset)
    return {
      start: add(point, delta),
      end: add(next, delta),
    }
  })

  const result: XY[] = [shiftedSegments[0].start]
  for (let i = 1; i < shiftedSegments.length; i += 1) {
    const prev = shiftedSegments[i - 1]
    const curr = shiftedSegments[i]
    const intersect = lineIntersection(prev.start, prev.end, curr.start, curr.end)
    result.push(intersect ?? curr.start)
  }
  result.push(shiftedSegments[shiftedSegments.length - 1].end)
  return result
}

function getEdgeId(attributes: any, edge: any) {
  return attributes.id ?? attributes.key ?? attributes.data?.id ?? edge.id
}

function getEdgeOffsets(attributes: any, edge: any) {
  const graph = edge.context?.graph
  const currentId = getEdgeId(attributes, edge)
  const source = attributes.sourceNode ?? attributes.source ?? attributes.data?.source
  const target = attributes.targetNode ?? attributes.target ?? attributes.data?.target
  if (!graph || !source || !target || !currentId) return [0]

  const [canonicalSource, canonicalTarget] = getCanonicalPair(source, target)
  const related = graph
    .getEdgeData()
    .filter((item: any) => {
      const [itemSource, itemTarget] = getCanonicalPair(item.source, item.target)
      return itemSource === canonicalSource && itemTarget === canonicalTarget
    })
  return getVisibleLineOffsetsForEdge(related, String(currentId))
}

class ParallelLine extends Line {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const [offset] = getEdgeOffsets(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any
    return this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, offset),
    }, container)
  }
}

class ParallelPolyline extends Polyline {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const [offset] = getEdgeOffsets(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any
    return this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, offset),
    }, container)
  }
}

class ParallelQuadratic extends Quadratic {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const [offset] = getEdgeOffsets(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any
    return this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, offset),
    }, container)
  }
}

class ParallelCubic extends Cubic {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const [offset] = getEdgeOffsets(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any
    return this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, offset),
    }, container)
  }
}

class DoubleLine extends Line {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const offsets = getEdgeOffsets(attributes, this)
    const [primaryOffset = -EDGE_VISUAL_GAP / 2, secondaryOffset = EDGE_VISUAL_GAP / 2] = offsets
    const keyStyle = this.getKeyStyle(attributes) as any
    const startTrim = getArrowCoverTrim(attributes, 'start')
    const endTrim = getArrowCoverTrim(attributes, 'end')
    const trimmedPath = trimPath(keyStyle.d, startTrim, endTrim)
    const key = this.upsert('key', 'path', {
      ...keyStyle,
      d: keyStyle.d,
      strokeOpacity: 0,
      fillOpacity: 0,
    }, container)

    this.upsert('primary', 'path', {
      ...keyStyle,
      d: offsetPath(trimmedPath, sourcePoint, targetPoint, primaryOffset),
      markerStart: null,
      markerEnd: null,
    }, container)

    this.upsert('parallel', 'path', {
      ...keyStyle,
      d: offsetPath(trimmedPath, sourcePoint, targetPoint, secondaryOffset),
      markerStart: null,
      markerEnd: null,
    }, container)

    return key
  }
}

class DoublePolyline extends Polyline {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const offsets = getEdgeOffsets(attributes, this)
    const [primaryOffset = -EDGE_VISUAL_GAP / 2, secondaryOffset = EDGE_VISUAL_GAP / 2] = offsets
    const keyStyle = this.getKeyStyle(attributes) as any
    const startTrim = getArrowCoverTrim(attributes, 'start')
    const endTrim = getArrowCoverTrim(attributes, 'end')
    const trimmedPath = trimPath(keyStyle.d, startTrim, endTrim)

    const key = this.upsert('key', 'path', {
      ...keyStyle,
      d: keyStyle.d,
      strokeOpacity: 0,
      fillOpacity: 0,
    }, container)

    this.upsert('primary', 'path', {
      ...keyStyle,
      d: offsetPath(trimmedPath, sourcePoint, targetPoint, primaryOffset),
      markerStart: null,
      markerEnd: null,
    }, container)

    this.upsert('parallel', 'path', {
      ...keyStyle,
      d: offsetPath(trimmedPath, sourcePoint, targetPoint, secondaryOffset),
      markerStart: null,
      markerEnd: null,
    }, container)

    return key
  }
}

class DashedLine extends ParallelLine {}
class DottedLine extends ParallelLine {}
class ThickLine extends ParallelLine {}

export function registerCustomEdges() {
  const globalKey = '__TOPOLOGY_CUSTOM_EDGES_REGISTERED__'
  const global = globalThis as any
  if (global[globalKey]) return

  register('edge', 'line', ParallelLine)
  register('edge', 'polyline', ParallelPolyline)
  register('edge', 'quadratic', ParallelQuadratic)
  register('edge', 'cubic', ParallelCubic)
  register('edge', 'double-line', DoubleLine)
  register('edge', 'double-polyline', DoublePolyline)
  register('edge', 'dashed-line', DashedLine)
  register('edge', 'dotted-line', DottedLine)
  register('edge', 'thick-line', ThickLine)

  global[globalKey] = true
}
