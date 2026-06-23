import { Cubic, Line, Polyline, Quadratic, register } from '@antv/g6'

type Point = [number, number] | Float32Array | number[]
const DOUBLE_LINE_GAP = 2
const PARALLEL_EDGE_GAP = 3

function toPoint(point: Point): [number, number] {
  return [Number(point[0] ?? 0), Number(point[1] ?? 0)]
}

function normalOf(a: Point, b: Point, offset: number) {
  const [x1, y1] = toPoint(a)
  const [x2, y2] = toPoint(b)
  const length = Math.hypot(x2 - x1, y2 - y1) || 1
  return [(-(y2 - y1) / length) * offset, ((x2 - x1) / length) * offset]
}

function offsetPath(path: any[], a: Point, b: Point, offset: number) {
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

function getEdgeId(attributes: any, edge: any) {
  return attributes.id ?? attributes.key ?? attributes.data?.id ?? edge.id
}

function getPairOffset(attributes: any, edge: any) {
  const graph = edge.context?.graph
  const currentId = getEdgeId(attributes, edge)
  const source = attributes.sourceNode ?? attributes.source ?? attributes.data?.source
  const target = attributes.targetNode ?? attributes.target ?? attributes.data?.target
  if (!graph || !source || !target || !currentId) return 0

  const sourceKey = String(source)
  const targetKey = String(target)
  const directionSign = sourceKey <= targetKey ? 1 : -1

  const related = graph
    .getEdgeData()
    .filter((item: any) => (
      (item.source === source && item.target === target) ||
      (item.source === target && item.target === source)
    ))
    .sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))

  if (related.length <= 1) return 0

  const index = Math.max(0, related.findIndex((item: any) => item.id === currentId))
  const visualOffset = (index - (related.length - 1) / 2) * PARALLEL_EDGE_GAP
  return visualOffset * directionSign
}

class ParallelLine extends Line {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const pairOffset = getPairOffset(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any
    return this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, pairOffset),
    }, container)
  }
}

class ParallelPolyline extends Polyline {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const pairOffset = getPairOffset(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any
    return this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, pairOffset),
    }, container)
  }
}

class ParallelQuadratic extends Quadratic {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const pairOffset = getPairOffset(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any
    return this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, pairOffset),
    }, container)
  }
}

class ParallelCubic extends Cubic {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const pairOffset = getPairOffset(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any
    return this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, pairOffset),
    }, container)
  }
}

class DoubleLine extends Line {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const gap = Number(attributes.doubleLineGap ?? DOUBLE_LINE_GAP)
    const pairOffset = getPairOffset(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any
    const key = this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, pairOffset - gap / 2),
    }, container)

    this.upsert('parallel', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, pairOffset + gap / 2),
      markerStart: null,
      markerEnd: null,
    }, container)

    return key
  }
}

class DoublePolyline extends Polyline {
  protected drawKeyShape(attributes: any, container: any): any {
    const [sourcePoint, targetPoint] = this.getEndpoints(attributes)
    const gap = Number(attributes.doubleLineGap ?? DOUBLE_LINE_GAP)
    const pairOffset = getPairOffset(attributes, this)
    const keyStyle = this.getKeyStyle(attributes) as any

    const key = this.upsert('key', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, pairOffset - gap / 2),
    }, container)

    this.upsert('parallel', 'path', {
      ...keyStyle,
      d: offsetPath(keyStyle.d, sourcePoint, targetPoint, pairOffset + gap / 2),
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
