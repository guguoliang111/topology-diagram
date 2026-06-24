import { BaseNode, register } from '@antv/g6'

export type SchematicSymbolType =
  | 'junction'
  | 'ring-junction'
  | 'station'
  | 'switch'
  | 'isolator'
  | 'terminal'
  | 'measure'
  | 'breaker'
  | 'transformer'
  | 'capacitor'
  | 'generator'
  | 'storage'
  | 'busbar'
  | 'ground'
  | 'arrow-up'
  | 'arrow-down'
  | 'cabinet'
  | 'box'
  | 'fuse'
  | 'cross-box'

type SymbolPreset = {
  kind:
    | 'dot'
    | 'ring-dot'
    | 'boxed-wave'
    | 'boxed-switch'
    | 'boxed-isolator'
    | 'boxed-terminal'
    | 'boxed-measure'
    | 'boxed-breaker'
    | 'dual-circle'
    | 'capacitor'
    | 'generator'
    | 'storage'
    | 'bar'
    | 'ground'
    | 'arrow-up'
    | 'arrow-down'
    | 'boxed-diagonal'
    | 'boxed-plain'
    | 'boxed-fuse'
    | 'boxed-cross'
  size: [number, number]
  hitPadding: number
  fill: string
  stroke: string
  labelPlacement: 'top' | 'right' | 'bottom' | 'left'
  labelOffsetX: number
  labelOffsetY: number
}

const SYMBOL_PRESETS: Record<SchematicSymbolType, SymbolPreset> = {
  junction: {
    kind: 'dot',
    size: [12, 12],
    hitPadding: 8,
    fill: '#111827',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  'ring-junction': {
    kind: 'ring-dot',
    size: [14, 14],
    hitPadding: 8,
    fill: '#111827',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  station: {
    kind: 'boxed-wave',
    size: [22, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  switch: {
    kind: 'boxed-switch',
    size: [22, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  isolator: {
    kind: 'boxed-isolator',
    size: [22, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  terminal: {
    kind: 'boxed-terminal',
    size: [22, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  measure: {
    kind: 'boxed-measure',
    size: [22, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  breaker: {
    kind: 'boxed-breaker',
    size: [22, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  transformer: {
    kind: 'dual-circle',
    size: [24, 14],
    hitPadding: 8,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  capacitor: {
    kind: 'capacitor',
    size: [22, 16],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  generator: {
    kind: 'generator',
    size: [18, 18],
    hitPadding: 8,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  storage: {
    kind: 'storage',
    size: [22, 16],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  busbar: {
    kind: 'bar',
    size: [28, 6],
    hitPadding: 8,
    fill: '#111827',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: -2,
  },
  ground: {
    kind: 'ground',
    size: [18, 18],
    hitPadding: 8,
    fill: '#111827',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  'arrow-up': {
    kind: 'arrow-up',
    size: [14, 28],
    hitPadding: 8,
    fill: '#DC2626',
    stroke: '#DC2626',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  'arrow-down': {
    kind: 'arrow-down',
    size: [14, 28],
    hitPadding: 8,
    fill: '#16A34A',
    stroke: '#16A34A',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  cabinet: {
    kind: 'boxed-diagonal',
    size: [24, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  box: {
    kind: 'boxed-plain',
    size: [24, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  fuse: {
    kind: 'boxed-fuse',
    size: [24, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
  'cross-box': {
    kind: 'boxed-cross',
    size: [24, 18],
    hitPadding: 7,
    fill: '#ffffff',
    stroke: '#111827',
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
  },
}

export function getSchematicSymbolPreset(symbolType?: string) {
  return SYMBOL_PRESETS[(symbolType as SchematicSymbolType) ?? 'station'] ?? SYMBOL_PRESETS.station
}

function toPositiveNumber(value: unknown, fallback: number) {
  const next = Number(value)
  return Number.isFinite(next) && next > 0 ? next : fallback
}

function getNodeSize(attributes: any, fallback: [number, number]) {
  const size = attributes?.size
  if (Array.isArray(size)) {
    const width = toPositiveNumber(size[0], fallback[0])
    const height = toPositiveNumber(size[1] ?? size[0], fallback[1])
    return [width, height] as [number, number]
  }
  if (typeof size === 'number') {
    const next = toPositiveNumber(size, fallback[0])
    return [next, next] as [number, number]
  }
  const width = toPositiveNumber(attributes?.width, fallback[0])
  const height = toPositiveNumber(attributes?.height, fallback[1])
  return [width, height] as [number, number]
}

function buildWavePath(width: number, height: number) {
  return [
    ['M', -width * 0.28, 0],
    ['C', -width * 0.18, -height * 0.28, -width * 0.08, -height * 0.28, 0, 0],
    ['C', width * 0.08, height * 0.28, width * 0.18, height * 0.28, width * 0.28, 0],
  ]
}

function buildSwitchPath(width: number, height: number) {
  return [
    ['M', -width * 0.28, height * 0.18],
    ['L', width * 0.24, -height * 0.22],
    ['M', -width * 0.28, -height * 0.22],
    ['L', -width * 0.08, -height * 0.22],
  ]
}

function buildIsolatorPath(width: number, height: number) {
  return [
    ['M', -width * 0.28, height * 0.18],
    ['L', -width * 0.06, 0],
    ['M', width * 0.06, 0],
    ['L', width * 0.28, -height * 0.18],
  ]
}

function buildTerminalPath(width: number, height: number) {
  return [
    ['M', -width * 0.26, 0],
    ['L', width * 0.08, 0],
    ['M', width * 0.08, -height * 0.2],
    ['L', width * 0.28, 0],
    ['L', width * 0.08, height * 0.2],
  ]
}

function buildMeasurePath(width: number, height: number) {
  return [
    ['M', -width * 0.28, height * 0.14],
    ['L', -width * 0.12, -height * 0.18],
    ['L', 0, height * 0.02],
    ['L', width * 0.12, -height * 0.28],
    ['L', width * 0.28, -height * 0.08],
  ]
}

function buildBreakerPath(width: number, height: number) {
  return [
    ['M', -width * 0.24, -height * 0.22],
    ['L', width * 0.24, height * 0.22],
    ['M', -width * 0.24, height * 0.22],
    ['L', width * 0.24, -height * 0.22],
  ]
}

function buildDiagonalBoxPath(width: number, height: number) {
  return [
    ['M', -width * 0.28, height * 0.24],
    ['L', width * 0.28, -height * 0.24],
  ]
}

function buildFuseBoxPath(width: number, _height: number) {
  return [
    ['M', -width * 0.26, 0],
    ['L', width * 0.26, 0],
  ]
}

function buildCrossBoxPath(width: number, height: number) {
  return [
    ['M', -width * 0.26, -height * 0.22],
    ['L', width * 0.26, height * 0.22],
    ['M', -width * 0.26, height * 0.22],
    ['L', width * 0.26, -height * 0.22],
  ]
}

function buildCapacitorPath(width: number, height: number) {
  return [
    ['M', -width * 0.32, 0],
    ['L', -width * 0.12, 0],
    ['M', -width * 0.08, -height * 0.3],
    ['L', -width * 0.08, height * 0.3],
    ['M', width * 0.08, -height * 0.3],
    ['L', width * 0.08, height * 0.3],
    ['M', width * 0.12, 0],
    ['L', width * 0.32, 0],
  ]
}

function buildStoragePath(width: number, height: number) {
  return [
    ['M', -width * 0.28, -height * 0.22],
    ['L', width * 0.18, -height * 0.22],
    ['L', width * 0.18, height * 0.22],
    ['L', -width * 0.28, height * 0.22],
    ['Z'],
    ['M', width * 0.2, -height * 0.1],
    ['L', width * 0.28, -height * 0.1],
    ['L', width * 0.28, height * 0.1],
    ['L', width * 0.2, height * 0.1],
    ['Z'],
    ['M', -width * 0.18, 0],
    ['L', -width * 0.02, 0],
    ['M', 0.04 * width, -height * 0.12],
    ['L', 0.04 * width, height * 0.12],
  ]
}

function buildGroundPath(width: number, height: number) {
  return [
    ['M', 0, -height * 0.34],
    ['L', 0, -height * 0.04],
    ['M', -width * 0.32, 0],
    ['L', width * 0.32, 0],
    ['M', -width * 0.22, height * 0.18],
    ['L', width * 0.22, height * 0.18],
    ['M', -width * 0.1, height * 0.34],
    ['L', width * 0.1, height * 0.34],
  ]
}

function buildGeneratorWavePath(width: number, height: number) {
  return [
    ['M', -width * 0.18, height * 0.1],
    ['C', -width * 0.1, -height * 0.16, 0, -height * 0.16, width * 0.08, 0],
    ['C', width * 0.14, height * 0.12, width * 0.2, height * 0.12, width * 0.24, -height * 0.02],
  ]
}

function buildArrowPath(width: number, height: number, direction: 'up' | 'down') {
  const sign = direction === 'up' ? -1 : 1
  return [
    ['M', 0, sign * height * 0.5],
    ['L', width * 0.42, sign * height * 0.16],
    ['L', width * 0.14, sign * height * 0.16],
    ['L', width * 0.14, -sign * height * 0.5],
    ['L', -width * 0.14, -sign * height * 0.5],
    ['L', -width * 0.14, sign * height * 0.16],
    ['L', -width * 0.42, sign * height * 0.16],
    ['Z'],
  ]
}

function getCircleIntersectPoint(radius: number, point: [number, number]) {
  const [x, y] = point
  const length = Math.hypot(x, y) || 1
  return [(x / length) * radius, (y / length) * radius, 0]
}

class SchematicNode extends BaseNode<any> {
  static defaultStyleProps: any = {
    size: [22, 18],
    fill: '#ffffff',
    stroke: '#111827',
    lineWidth: 1.25,
    radius: 2,
    labelPlacement: 'right',
    labelOffsetX: 12,
    labelOffsetY: 0,
    labelFontSize: 12,
    labelFill: '#111827',
    hitPadding: 7,
  }

  constructor(options: any) {
    super({
      ...options,
      style: {
        ...SchematicNode.defaultStyleProps,
        ...(options.style ?? {}),
      },
    } as any)
  }

  protected drawKeyShape(attributes: any, container: any) {
    const preset = getSchematicSymbolPreset(attributes.symbolType)
    const [width, height] = getNodeSize(attributes, preset.size)
    const stroke = attributes.stroke ?? preset.stroke
    const fill = attributes.fill ?? preset.fill
    const lineWidth = toPositiveNumber(attributes.lineWidth, 1.25)
    const radius = Math.max(0, Number(attributes.radius ?? 2))
    const hitPadding = Math.max(toPositiveNumber(attributes.hitPadding, preset.hitPadding), 4)

    let key: any

    if (preset.kind === 'dot') {
      const r = Math.min(width, height) / 2
      key = this.upsert('key', 'circle', {
        r,
        fill,
        stroke,
        lineWidth,
      }, container)
    } else if (preset.kind === 'ring-dot') {
      const outerRadius = Math.min(width, height) / 2
      const holeRadius = outerRadius * 0.955
      const innerRadius = Math.max(outerRadius * 0.42, lineWidth * 1.5)
      key = this.upsert('key', 'circle', {
        r: outerRadius,
        fill,
        stroke,
        lineWidth,
      }, container)
      this.upsert('ring-hole', 'circle', {
        r: holeRadius,
        fill: '#ffffff',
        stroke: '#ffffff',
        lineWidth: 0,
      }, container)
      this.upsert('ring-core', 'circle', {
        r: innerRadius,
        fill,
        stroke,
        lineWidth,
      }, container)
    } else if (preset.kind === 'dual-circle') {
      key = this.upsert('key', 'rect', {
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        fill: '#ffffff',
        fillOpacity: 0,
        stroke: '#ffffff',
        strokeOpacity: 0,
        lineWidth: 0,
      }, container)

      const r = Math.min(height, width * 0.3) / 2
      const offset = Math.max(width * 0.18, r + 1)
      this.upsert('coil-left', 'circle', {
        r,
        fill,
        stroke,
        lineWidth,
        transform: [['translate', -offset, 0]],
      }, container)
      this.upsert('coil-right', 'circle', {
        r,
        fill,
        stroke,
        lineWidth,
        transform: [['translate', offset, 0]],
      }, container)
      this.drawGlyph([
        ['M', -offset + r * 0.75, 0],
        ['L', offset - r * 0.75, 0],
      ], stroke, lineWidth, container, 'glyph')
    } else if (preset.kind === 'capacitor' || preset.kind === 'generator' || preset.kind === 'storage' || preset.kind === 'ground' || preset.kind === 'arrow-up' || preset.kind === 'arrow-down') {
      key = this.upsert('key', 'rect', {
        x: -width / 2,
        y: -height / 2,
        width,
        height,
        fill: '#ffffff',
        fillOpacity: 0,
        stroke: '#ffffff',
        strokeOpacity: 0,
        lineWidth: 0,
      }, container)

      if (preset.kind === 'capacitor') {
        this.drawGlyph(buildCapacitorPath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'storage') {
        this.drawGlyph(buildStoragePath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'ground') {
        this.drawGlyph(buildGroundPath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'arrow-up' || preset.kind === 'arrow-down') {
        this.upsert('glyph', 'path', {
          d: buildArrowPath(width, height, preset.kind === 'arrow-up' ? 'up' : 'down'),
          fill,
          stroke,
          lineWidth,
          lineCap: 'round',
          lineJoin: 'round',
        }, container)
      } else if (preset.kind === 'generator') {
        const r = Math.min(width, height) / 2
        this.upsert('generator-circle', 'circle', {
          r,
          fill,
          stroke,
          lineWidth,
        }, container)
        this.drawGlyph(buildGeneratorWavePath(width, height), stroke, lineWidth, container, 'glyph')
      }
    } else {
      const bodyHeight = preset.kind === 'bar' ? Math.max(height, lineWidth * 2) : height
      const bodyFill = preset.kind === 'bar' ? stroke : fill
      key = this.upsert('key', 'rect', {
        x: -width / 2,
        y: -bodyHeight / 2,
        width,
        height: bodyHeight,
        radius: preset.kind === 'bar' ? bodyHeight / 2 : radius,
        fill: bodyFill,
        stroke,
        lineWidth,
      }, container)

      if (preset.kind === 'boxed-wave') {
        this.drawGlyph(buildWavePath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'boxed-switch') {
        this.drawGlyph(buildSwitchPath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'boxed-isolator') {
        this.drawGlyph(buildIsolatorPath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'boxed-terminal') {
        this.drawGlyph(buildTerminalPath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'boxed-measure') {
        this.drawGlyph(buildMeasurePath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'boxed-breaker') {
        this.drawGlyph(buildBreakerPath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'boxed-diagonal') {
        this.drawGlyph(buildDiagonalBoxPath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'boxed-fuse') {
        this.drawGlyph(buildFuseBoxPath(width, height), stroke, lineWidth, container, 'glyph')
      } else if (preset.kind === 'boxed-cross') {
        this.drawGlyph(buildCrossBoxPath(width, height), stroke, lineWidth, container, 'glyph')
      }
    }

    this.upsert('hit-area', 'rect', {
      x: -width / 2 - hitPadding,
      y: -height / 2 - hitPadding,
      width: width + hitPadding * 2,
      height: height + hitPadding * 2,
      fill: '#ffffff',
      fillOpacity: 0,
      stroke: '#ffffff',
      strokeOpacity: 0,
      lineWidth: 0,
    }, container)

    return key
  }

  public getIntersectPoint(point: any, useExtendedLine = false) {
    if (this.attributes.symbolType === 'junction' || this.attributes.symbolType === 'ring-junction') {
      const [width, height] = getNodeSize(
        this.attributes,
        this.attributes.symbolType === 'ring-junction' ? [14, 14] : [12, 12],
      )
      const [x, y] = getCircleIntersectPoint(Math.min(width, height) / 2, point)
      return new Float32Array([x, y, 0]) as any
    }
    return super.getIntersectPoint(point, useExtendedLine) as any
  }

  private drawGlyph(path: any[], stroke: string, lineWidth: number, container: any, key: string) {
    this.upsert(key, 'path', {
      d: path,
      stroke,
      lineWidth,
      fill: 'none',
      lineCap: 'round',
      lineJoin: 'round',
    }, container)
  }
}

export function registerCustomNodes() {
  const globalKey = '__TOPOLOGY_CUSTOM_NODES_REGISTERED__'
  const global = globalThis as any
  if (global[globalKey]) return

  register('node', 'schematic-node', SchematicNode)

  global[globalKey] = true
}
