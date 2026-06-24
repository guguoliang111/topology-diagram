<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Graph } from '@antv/g6'
import { useTopologyStore } from '@/stores/topologyStore'
import { getEdgeStylePreset, type NodeShapeConfig } from '@/config/graphConfig'
import { getRenderedEdgeType, resolveEdgeRouter } from '@/config/edgeRouting'

const store        = useTopologyStore()
const containerRef = ref<HTMLDivElement>()
const minimapRef   = ref<HTMLDivElement>()

let graph: Graph | null = null
let edgeCreationStartedFromPort = false
let edgeRefreshFrame = 0
let sourcePortKey: string | null = null
let targetPortKey: string | null = null
let pendingPortDrag: { nodeId: string; portKey: string } | null = null

const NODE_PORTS = [
  { key: 'top', placement: 'top' },
  { key: 'right', placement: 'right' },
  { key: 'bottom', placement: 'bottom' },
  { key: 'left', placement: 'left' },
] as const
const PORT_TRIGGER_RADIUS = 5
const DEFAULT_NODE_LABEL_OFFSET_X = 12

function getHistoryPlugin() {
  return graph?.getPluginInstance?.('history') as
    | {
        canUndo?: () => boolean
        canRedo?: () => boolean
        undo?: () => unknown
        redo?: () => unknown
        on?: (event: string, handler: () => void) => void
      }
    | undefined
}

function syncHistoryState() {
  const history = getHistoryPlugin()
  store.setHistoryState(Boolean(history?.canUndo?.()), Boolean(history?.canRedo?.()))
}

function undoGraph() {
  const history = getHistoryPlugin()
  if (!history?.canUndo?.()) return false
  history.undo?.()
  syncHistoryState()
  store.bumpDataRevision()
  return true
}

function redoGraph() {
  const history = getHistoryPlugin()
  if (!history?.canRedo?.()) return false
  history.redo?.()
  syncHistoryState()
  store.bumpDataRevision()
  return true
}

function getCanvasBackground() {
  return store.gridVisible
    ? {
        backgroundColor: '#F8F9FB',
        backgroundImage: [
          'linear-gradient(rgba(104, 124, 150, 0.11) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(104, 124, 150, 0.11) 1px, transparent 1px)',
          'linear-gradient(rgba(104, 124, 150, 0.08) 1px, transparent 1px)',
          'linear-gradient(90deg, rgba(104, 124, 150, 0.08) 1px, transparent 1px)',
        ].join(', '),
        backgroundSize: '80px 80px, 80px 80px, 32px 32px, 32px 32px',
      }
    : {
        backgroundColor: '#F8F9FB',
        backgroundImage: 'none',
        backgroundSize: 'auto',
      }
}

function getEventCanvasPoint(e: any) {
  if (typeof e?.canvas?.x === 'number' && typeof e?.canvas?.y === 'number') {
    return { x: e.canvas.x, y: e.canvas.y }
  }
  if (Array.isArray(e?.canvas) && typeof e.canvas[0] === 'number' && typeof e.canvas[1] === 'number') {
    return { x: e.canvas[0], y: e.canvas[1] }
  }
  if (!graph || !e?.client) return null
  const clientX = e.client.x ?? e.client[0]
  const clientY = e.client.y ?? e.client[1]
  if (typeof clientX !== 'number' || typeof clientY !== 'number') return null
  const pt = graph.getCanvasByClient([clientX, clientY])
  return {
    x: (pt as any)[0] ?? (pt as any).x ?? 0,
    y: (pt as any)[1] ?? (pt as any).y ?? 0,
  }
}

function getShapeField(shape: any, field: string) {
  return (
    shape?.[field] ??
    shape?.attributes?.[field] ??
    shape?.config?.[field] ??
    shape?.style?.[field] ??
    shape?.parsedStyle?.[field] ??
    null
  )
}

function matchPortKey(value: unknown) {
  const match = String(value ?? '').match(/(?:^|[\s,])port-([A-Za-z0-9_-]+)/)
  return match?.[1] ?? null
}

function getPortKeyFromEvent(e: any) {
  let shape = e?.originalTarget ?? null
  while (shape) {
    const key = (
      matchPortKey(getShapeField(shape, 'className')) ??
      matchPortKey(getShapeField(shape, 'name')) ??
      matchPortKey(getShapeField(shape, 'id'))
    )
    if (key) return key
    shape = shape.parentElement ?? null
  }
  return null
}

function getNearestPortKeyFromEvent(e: any, maxDistance = Number.POSITIVE_INFINITY) {
  if (!graph || !['node', 'combo'].includes(e?.targetType) || !e.target?.id) return null
  const point = getEventCanvasPoint(e)
  if (!point) return null

  const node = graph.getElementData(e.target.id) as any
  const style = node?.style ?? {}
  const x = Number(style.x ?? 0)
  const y = Number(style.y ?? 0)
  const width = Number(style.width ?? style.size ?? 60)
  const height = Number(style.height ?? style.size ?? width)
  const ports = [
    { key: 'top', x, y: y - height / 2 },
    { key: 'bottom', x, y: y + height / 2 },
    { key: 'left', x: x - width / 2, y },
    { key: 'right', x: x + width / 2, y },
  ]

  let nearest: { key: string; distance: number } | null = null
  for (const port of ports) {
    const distance = Math.hypot(point.x - port.x, point.y - port.y)
    if (!nearest || distance < nearest.distance) {
      nearest = { key: port.key, distance }
    }
  }
  if (!nearest || nearest.distance > maxDistance) return null
  return nearest.key
}

function resolveSourcePortIntent(e: any) {
  const portKey = getPortKeyFromEvent(e)
  if (!portKey || !e?.target?.id) return null
  return {
    nodeId: e.target.id as string,
    portKey,
  }
}

function resolveTargetPortIntent(e: any, maxDistance = PORT_TRIGGER_RADIUS) {
  const portKey = getPortKeyFromEvent(e) ?? getNearestPortKeyFromEvent(e, maxDistance)
  if (!portKey || !e?.target?.id) return null
  return {
    nodeId: e.target.id as string,
    portKey,
  }
}

function setPendingPortDrag(e: any) {
  pendingPortDrag = resolveSourcePortIntent(e)
}

function clearPendingPortDrag() {
  pendingPortDrag = null
}

function isPortEvent(e: any) {
  const portIntent = resolveSourcePortIntent(e)
  if (portIntent) return true
  return !!(pendingPortDrag && pendingPortDrag.nodeId === e?.target?.id)
}

function enableCreateEdge(e: any) {
  if (e?.type === 'dragstart') {
    const portIntent = resolveSourcePortIntent(e) ??
      (pendingPortDrag && pendingPortDrag.nodeId === e?.target?.id ? pendingPortDrag : null)
    sourcePortKey = portIntent?.portKey ?? null
    targetPortKey = null
    edgeCreationStartedFromPort = !!portIntent
    return edgeCreationStartedFromPort
  }

  if (e?.type === 'pointerup') {
    targetPortKey = resolveTargetPortIntent(e)?.portKey ?? getNearestPortKeyFromEvent(e, PORT_TRIGGER_RADIUS)
    return edgeCreationStartedFromPort && ['node', 'combo'].includes(e.targetType)
  }

  return edgeCreationStartedFromPort
}
function touchRelatedEdges(edgeData: any) {
  if (!graph || !edgeData?.source || !edgeData?.target) return
  const related = graph.getEdgeData().filter((edge: any) => (
    (edge.source === edgeData.source && edge.target === edgeData.target) ||
    (edge.source === edgeData.target && edge.target === edgeData.source)
  ))
  if (!related.length) return
  graph.updateEdgeData(related.map((edge: any) => ({
    id: edge.id,
    style: { ...(edge.style ?? {}) },
  })))
}

function touchNodeEdges(nodeId: string | null | undefined) {
  if (!graph || !nodeId) return
  const edges = graph.getEdgeData().filter((edge: any) => edge.source === nodeId || edge.target === nodeId)
  if (!edges.length) return
  graph.updateEdgeData(edges.map((edge: any) => ({
    id: edge.id,
    style: { ...(edge.style ?? {}), router: resolveEdgeRouter(edge, graph) },
  })))
}

function refreshSmartEdges() {
  if (!graph) return
  const edges = graph.getEdgeData().filter((edge: any) => edge.style?.smartRouting !== false)
  if (!edges.length) return
  graph.updateEdgeData(edges.map((edge: any) => ({
    id: edge.id,
    style: { ...(edge.style ?? {}), router: resolveEdgeRouter(edge, graph) },
  })))
}

function scheduleSmartEdgeRefresh(immediate = false) {
  if (immediate) refreshSmartEdges()
  if (edgeRefreshFrame) window.cancelAnimationFrame(edgeRefreshFrame)
  edgeRefreshFrame = window.requestAnimationFrame(() => {
    edgeRefreshFrame = 0
    refreshSmartEdges()
  })
}

async function initGraph() {
  if (!containerRef.value || !minimapRef.value) return
  edgeCreationStartedFromPort = false
  clearPendingPortDrag()

  graph = new Graph({
    container: containerRef.value,
    width:  containerRef.value.offsetWidth,
    height: containerRef.value.offsetHeight,
    autoResize: true,
    background: 'transparent',

    node: {
      style: {
        fill:           (d: any) => d.style?.fill ?? '#EFF4FF',
        stroke:         (d: any) => d.style?.stroke ?? '#111111',
        lineWidth:      (d: any) => d.style?.lineWidth ?? 1.5,
        lineDash:       (d: any) => d.style?.lineDash ?? [],
        radius:         (d: any) => d.style?.radius ?? 6,
        opacity:        (d: any) => d.style?.opacity ?? 1,
        shadowColor:    (d: any) => d.style?.shadowColor,
        shadowBlur:     (d: any) => d.style?.shadowBlur ?? 0,
        cursor:         'move',

        labelText:       (d: any) => d.style?.labelText ?? d.data?.label ?? '',
        labelFill:       (d: any) => d.style?.labelFill ?? '#262626',
        labelFontSize:   (d: any) => d.style?.labelFontSize ?? 12,
        labelFontWeight: (d: any) => d.style?.labelFontWeight ?? 'normal',
        labelFontStyle:  (d: any) => d.style?.labelFontStyle ?? 'normal',
        labelTextAlign:  (d: any) => d.style?.labelTextAlign ?? 'center',
        labelPlacement:  (d: any) => d.style?.labelPlacement ?? 'right',
        labelOffsetX:    (d: any) => d.style?.labelOffsetX ?? DEFAULT_NODE_LABEL_OFFSET_X,
        labelOffsetY:    (d: any) => d.style?.labelOffsetY ?? 0,
        labelWordWrap:   false,
        ports: NODE_PORTS.map((port) => ({
          ...port,
          r: 4,
          linkToCenter: true,
        })) as any,
        portR:         4,
        portFill:      '#fff',
        portStroke:    '#5F95FF',
        portLineWidth: 1.2,
        portOpacity:   0,
        portZIndex:    10,
        portCursor:    'crosshair',

        // ports – hidden by default, shown on hover via state
      },
      state: {
        selected: {
          halo: true,
          haloLineWidth: 16,
          haloStroke: '#1677FF',
          haloStrokeOpacity: 0.18,
          stroke:      (d: any) => d.style?.stroke ?? '#111111',
          lineWidth:   (d: any) => d.style?.lineWidth ?? 1.5,
          labelFontWeight: (d: any) => d.style?.labelFontWeight ?? 'normal',
          shadowColor: 'rgba(22,119,255,0.35)',
          shadowBlur:  10,
          portOpacity: 1,
          portStroke:  '#1677FF',
          portFill:    '#fff',
        },
        hover: {
          portOpacity: 1,
          portStroke:  '#5F95FF',
          portFill:    '#fff',
        },
      },
    },

    edge: {
      type: (d: any) => getRenderedEdgeType(d),
      style: {
        stroke:              (d: any) => d.style?.stroke ?? '#111111',
        lineWidth:           (d: any) => d.style?.lineWidth ?? 1,
        lineDash:            (d: any) => d.style?.lineDash ?? [],
        startArrow:          (d: any) => d.style?.startArrow ?? false,
        endArrow:            (d: any) => d.style?.endArrow ?? false,
        startArrowType:      (d: any) => d.style?.startArrowType ?? 'vee',
        endArrowType:        (d: any) => d.style?.endArrowType ?? 'vee',
        startArrowSize:      (d: any) => d.style?.startArrowSize ?? 8,
        endArrowSize:        (d: any) => d.style?.endArrowSize ?? 8,
        startArrowStroke:    (d: any) => d.style?.startArrowStroke ?? d.style?.stroke ?? '#111111',
        endArrowStroke:      (d: any) => d.style?.endArrowStroke ?? d.style?.stroke ?? '#111111',
        startArrowFill:      (d: any) => d.style?.startArrowFill ?? d.style?.stroke ?? '#111111',
        endArrowFill:        (d: any) => d.style?.endArrowFill ?? d.style?.stroke ?? '#111111',
        startArrowStrokeOpacity: (d: any) => d.style?.startArrowStrokeOpacity ?? 1,
        endArrowStrokeOpacity:   (d: any) => d.style?.endArrowStrokeOpacity ?? 1,
        startArrowFillOpacity:   (d: any) => d.style?.startArrowFillOpacity ?? 1,
        endArrowFillOpacity:     (d: any) => d.style?.endArrowFillOpacity ?? 1,
        startArrowLineWidth: (d: any) => d.style?.startArrowLineWidth ?? d.style?.lineWidth ?? 1,
        endArrowLineWidth:   (d: any) => d.style?.endArrowLineWidth ?? d.style?.lineWidth ?? 1,
        router:              (d: any) => resolveEdgeRouter(d, graph),
        doubleLineGap:       (d: any) => d.style?.doubleLineGap ?? 6,
        labelText:           (d: any) => d.data?.label ?? '',
        labelFill:           (d: any) => d.style?.labelFill ?? '#595959',
        labelFontSize:       (d: any) => d.style?.labelFontSize ?? 12,
        labelBackground:     true,
        labelBackgroundFill: '#fff',
        labelBackgroundOpacity: 0.85,
        labelBackgroundPadding: [2, 6],
        cursor:              'pointer',
      },
      state: {
        selected: {
          shadowColor: 'rgba(22,119,255,0.25)',
          shadowBlur: 3,
        },
        hover: {
          shadowColor: 'rgba(22,119,255,0.16)',
          shadowBlur: 2,
        },
      },
    },

    behaviors: [
      'zoom-canvas',
      'drag-canvas',
      {
        type: 'create-edge',
        trigger: 'drag',
        enable: enableCreateEdge,
        style: {
          stroke: '#111111',
          lineWidth: 1,
          startArrow: false,
          endArrow: false,
          endArrowType: 'vee',
          startArrowSize: 8,
          endArrowSize: 8,
          router: false,
        },
        onCreate: (data: any) => {
          if (data.source && data.target && data.source === data.target) {
            return undefined
          }
          const preset = {
            ...getEdgeStylePreset(store.selectedEdgeType, 1),
            stroke: '#111111',
            markerStart: null,
            markerEnd: null,
            endArrowType: 'vee',
            startArrowFill: '#111111',
            endArrowFill: '#111111',
            startArrowStroke: '#111111',
            endArrowStroke: '#111111',
          } as any
          return {
            ...data,
            id: data.id ?? `edge-${Date.now()}`,
            sourcePort: sourcePortKey ?? undefined,
            targetPort: targetPortKey ?? undefined,
            type: store.selectedEdgeType,
            style: {
              ...(data.style ?? {}),
              ...preset,
              router: false,
            },
            data: { label: '' },
          }
        },
        onFinish: (edgeData: any) => {
          touchRelatedEdges(edgeData)
          scheduleSmartEdgeRefresh(true)
          store.bumpDataRevision()
          edgeCreationStartedFromPort = false
          sourcePortKey = null
          targetPortKey = null
        },
      },
      {
        type: 'drag-element',
        dropEffect: 'move',
        enable: (e: any) => ['node', 'combo'].includes(e.targetType) && !isPortEvent(e),
      },
      {
        type: 'click-select',
        multiple: false,
      },
      {
        type: 'hover-activate',
        state: 'hover',
        degree: 0,
      },
    ],

    plugins: [
      {
        key:    'grid-line',
        type:   'grid-line',
        follow: false,
        stroke: 'transparent',
        lineWidth: 0,
        size:   20,
        border: false,
      },
      {
        key:    'minimap',
        type:   'minimap',
        container: minimapRef.value,
        width:  196,
        height: 138,
        mode:   'keyShape',
      },
      {
        type:      'snapline',
        tolerance: 5,
      },
      {
        key:  'history',
        type: 'history',
      },
    ],

    data: { nodes: [], edges: [] },
  })

  await graph.render()
  store.setGraph(graph)
  syncHistoryState()

  const history = getHistoryPlugin()
  history?.on?.('change', () => {
    syncHistoryState()
    store.bumpDataRevision()
  })

  // ── Event bindings ────────────────────────────────────────
  graph.on('node:click', (e: any) => {
    store.selectNode(e.target?.id ?? null)
  })
  graph.on('edge:click', (e: any) => {
    store.selectEdge(e.target?.id ?? null)
  })
  graph.on('canvas:click', () => {
    store.clearSelection()
  })
  graph.on('viewportchange', () => {
    store.setZoom(graph!.getZoom())
  })
  graph.on('node:pointerdown', (e: any) => {
    setPendingPortDrag(e)
  })
  graph.on('combo:pointerdown', (e: any) => {
    setPendingPortDrag(e)
  })
  graph.on('canvas:pointerdown', () => {
    clearPendingPortDrag()
  })
  graph.on('afterelementupdate', (e: any) => {
    if (e.data?.type !== 'node') return
    touchNodeEdges(e.data?.id)
  })
  graph.on('node:drag', () => {
    scheduleSmartEdgeRefresh(true)
  })
  graph.on('node:dragend', () => {
    scheduleSmartEdgeRefresh(true)
    store.bumpDataRevision()
  })
  graph.on('pointerup', () => {
    window.setTimeout(() => {
      edgeCreationStartedFromPort = false
      sourcePortKey = null
      targetPortKey = null
      clearPendingPortDrag()
    }, 0)
  })

  // keyboard shortcuts
  window.addEventListener('keydown', handleKey)
}

async function handleKey(e: KeyboardEvent) {
  if (!graph) return
  const active = document.activeElement
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return

  if (e.key === 'Delete' || e.key === 'Backspace') {
    const nodeIds = graph.getElementDataByState('node', 'selected').map((n: any) => n.id)
    const edgeIds = graph.getElementDataByState('edge', 'selected').map((ex: any) => ex.id)
    if (nodeIds.length) await graph.removeNodeData(nodeIds)
    if (edgeIds.length) await graph.removeEdgeData(edgeIds)
    if (nodeIds.length || edgeIds.length) {
      await graph.draw()
      store.bumpDataRevision()
      store.clearSelection()
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    if (undoGraph()) e.preventDefault()
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
    if (redoGraph()) e.preventDefault()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault()
    const ids = graph.getNodeData().map((n: any) => n.id)
    const stateMap = Object.fromEntries(ids.map((id: string) => [id, 'selected']))
    await graph.setElementState(stateMap)
  }
}

// ── drag-drop from NodePanel ────────────────────────────────
function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  if (!graph || !containerRef.value) return
  const raw = e.dataTransfer?.getData('node-shape')
  if (!raw) return
  const info: NodeShapeConfig = JSON.parse(raw)

  const pt    = graph.getCanvasByClient([e.clientX, e.clientY])
  const cx    = (pt as any)[0] ?? (pt as any).x ?? 0
  const cy    = (pt as any)[1] ?? (pt as any).y ?? 0
  const id    = `node-${Date.now()}`

  await graph.addNodeData([{
    id,
    type:  info.nodeType ?? info.type,
    style: {
      x:         cx,
      y:         cy,
      width:     info.width,
      height:    info.height,
      fill:      info.fill,
      stroke:    info.stroke,
      lineWidth: info.lineWidth ?? 1.25,
      radius:    info.radius ?? 4,
      symbolType: info.symbolType ?? info.type,
      labelPlacement: info.labelPlacement ?? 'right',
      labelOffsetX: info.labelOffsetX ?? DEFAULT_NODE_LABEL_OFFSET_X,
      labelOffsetY: info.labelOffsetY ?? 0,
      labelFill: '#111827',
      labelFontSize: 12,
      labelText: info.label,
    },
    data: { shape: info.type, symbolType: info.symbolType ?? info.type, label: info.label },
  }])
  await graph.draw()
  store.bumpDataRevision()
}

// ── Grid / MiniMap toggles ──────────────────────────────────
watch(() => store.gridVisible, async () => {
  if (!graph) return
  graph.updatePlugin({
    key: 'grid-line',
    type: 'grid-line',
    stroke: 'transparent',
    lineWidth: 0,
    size: 20,
    border: false,
  } as any)
  await graph.draw()
})

watch(() => store.miniMapVisible, (v) => {
  if (minimapRef.value) minimapRef.value.style.display = v ? 'block' : 'none'
})

onMounted(initGraph)
onUnmounted(() => {
  window.removeEventListener('keydown', handleKey)
  edgeCreationStartedFromPort = false
  clearPendingPortDrag()
  if (edgeRefreshFrame) window.cancelAnimationFrame(edgeRefreshFrame)
  graph?.destroy()
  store.setHistoryState(false, false)
  store.setGraph(null)
})
</script>

<template>
  <div class="canvas-wrapper">
    <div
      ref="containerRef"
      class="graph-container"
      :style="getCanvasBackground()"
      @dragover="onDragOver"
      @drop="onDrop"
    />
    <div
      ref="minimapRef"
      class="minimap-container"
      :style="{ display: store.miniMapVisible ? 'block' : 'none' }"
    />
    <div class="canvas-hint">
      <el-icon><InfoFilled /></el-icon>
      <span>拖拽组件到画布 &nbsp;·&nbsp; 悬停节点后从端口拖出连线 &nbsp;·&nbsp; 滚轮缩放 &nbsp;·&nbsp; Delete 删除</span>
    </div>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #F8F9FB;
}
.graph-container { width: 100%; height: 100%; }
.minimap-container {
  position: absolute;
  bottom: 40px;
  right: 10px;
  width: 200px;
  height: 140px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,.1);
  overflow: hidden;
  z-index: 10;
  pointer-events: none;
}
.canvas-hint {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #bfbfbf;
  background: rgba(255,255,255,.92);
  padding: 4px 16px;
  border-radius: 20px;
  border: 1px solid #ebebeb;
  pointer-events: none;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}
</style>
