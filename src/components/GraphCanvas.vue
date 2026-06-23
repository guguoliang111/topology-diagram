<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Graph } from '@antv/g6'
import { useTopologyStore } from '@/stores/topologyStore'
import { getEdgeStylePreset, type NodeShapeConfig } from '@/config/graphConfig'

const store        = useTopologyStore()
const containerRef = ref<HTMLDivElement>()
const minimapRef   = ref<HTMLDivElement>()

let graph: Graph | null = null
let edgeCreationStartedFromPort = false

const PORT_HIT_RADIUS = 18

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

function getPortKeyFromEvent(e: any) {
  const className =
    e?.originalTarget?.className ??
    e?.originalTarget?.attributes?.className ??
    e?.originalTarget?.name ??
    ''
  const match = String(className).match(/^port-(.+)$/)
  return match?.[1]
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

function getNearestPortKeyFromEvent(e: any) {
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
    if (distance <= PORT_HIT_RADIUS && (!nearest || distance < nearest.distance)) {
      nearest = { key: port.key, distance }
    }
  }
  return nearest?.key ?? null
}

function isPortEvent(e: any) {
  return !!(getPortKeyFromEvent(e) || getNearestPortKeyFromEvent(e))
}

function enableCreateEdge(e: any) {
  if (e?.type === 'dragstart') {
    edgeCreationStartedFromPort = isPortEvent(e)
    return edgeCreationStartedFromPort
  }

  if (e?.type === 'pointerup') {
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

async function initGraph() {
  if (!containerRef.value || !minimapRef.value) return
  edgeCreationStartedFromPort = false

  graph = new Graph({
    container: containerRef.value,
    width:  containerRef.value.offsetWidth,
    height: containerRef.value.offsetHeight,
    autoResize: true,
    background: 'transparent',

    node: {
      style: {
        fill:      '#EFF4FF',
        stroke:    '#5F95FF',
        lineWidth: 1.5,
        radius:    6,
        cursor:    'move',

        labelText:      (d: any) => d.data?.label ?? '',
        labelFill:      '#262626',
        labelFontSize:  12,
        labelPlacement: 'center',
        labelWordWrap:  false,

        // ports – hidden by default, shown on hover via state
        ports: [
          { key: 'top',    placement: 'top'    },
          { key: 'bottom', placement: 'bottom' },
          { key: 'left',   placement: 'left'   },
          { key: 'right',  placement: 'right'  },
        ],
        portR:         5,
        portFill:      'rgba(255,255,255,0)',
        portStroke:    'transparent',
        portLineWidth: 0,
        portZIndex:    10,
        portCursor:    'crosshair',
      },
      state: {
        selected: {
          stroke:      '#1677FF',
          lineWidth:   2.5,
          shadowColor: 'rgba(22,119,255,0.35)',
          shadowBlur:  10,
          portR:        4,
          portFill:     'rgba(255,255,255,0)',
          portStroke:   'transparent',
          portLineWidth: 0,
        },
        hover: {
          stroke:      '#5F95FF',
          lineWidth:   2,
          portR:        4,
          portStroke:  '#5F95FF',
          portFill:    '#fff',
          portLineWidth: 1.5,
        },
        'port-connected': {
          portFill: '#5F95FF',
        },
      },
    },

    edge: {
      type: (d: any) => d.type ?? 'polyline',
      style: {
        stroke:              (d: any) => d.style?.stroke ?? '#5F95FF',
        lineWidth:           (d: any) => d.style?.lineWidth ?? 1,
        lineDash:            (d: any) => d.style?.lineDash ?? [],
        startArrow:          (d: any) => d.style?.startArrow ?? false,
        endArrow:            (d: any) => d.style?.endArrow ?? false,
        startArrowType:      (d: any) => d.style?.startArrowType ?? 'vee',
        endArrowType:        (d: any) => d.style?.endArrowType ?? 'vee',
        startArrowSize:      (d: any) => d.style?.startArrowSize ?? 8,
        endArrowSize:        (d: any) => d.style?.endArrowSize ?? 8,
        router:              (d: any) => d.style?.router ?? { type: 'orth' },
        doubleLineGap:       (d: any) => d.style?.doubleLineGap ?? 2,
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
          stroke: '#5F95FF',
          lineWidth: 1,
          startArrow: false,
          endArrow: false,
          endArrowType: 'vee',
          endArrowSize: 8,
          router: { type: 'orth' },
        },
        onCreate: (data: any) => ({
          ...data,
          id: data.id ?? `edge-${Date.now()}`,
          type: store.selectedEdgeType,
          style: {
            ...(data.style ?? {}),
            stroke: '#5F95FF',
            lineWidth: 1,
            lineDash: [],
            startArrow: false,
            endArrow: false,
            markerStart: null,
            markerEnd: null,
            endArrowType: 'vee',
            endArrowSize: 8,
            router: store.selectedEdgeType === 'double-line' ? false : { type: 'orth' },
            ...getEdgeStylePreset(store.selectedEdgeType, 1),
          },
          data: { label: '' },
        }),
        onFinish: (edgeData: any) => {
          touchRelatedEdges(edgeData)
          edgeCreationStartedFromPort = false
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
  graph.on('pointerup', () => {
    window.setTimeout(() => {
      edgeCreationStartedFromPort = false
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
    if (nodeIds.length || edgeIds.length) { await graph.draw(); store.clearSelection() }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') { (graph as any).undo?.(); e.preventDefault() }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
    (graph as any).redo?.(); e.preventDefault()
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

  const rect  = containerRef.value.getBoundingClientRect()
  const pt    = graph.getCanvasByClient([e.clientX - rect.left, e.clientY - rect.top])
  const cx    = (pt as any)[0] ?? (pt as any).x ?? 0
  const cy    = (pt as any)[1] ?? (pt as any).y ?? 0
  const id    = `node-${Date.now()}`

  await graph.addNodeData([{
    id,
    type:  info.type,
    style: {
      x:         cx,
      y:         cy,
      width:     info.width,
      height:    info.height,
      fill:      info.fill,
      stroke:    info.stroke,
      lineWidth: 1.5,
      radius:    info.radius ?? 4,
      labelText: info.label,
    },
    data: { shape: info.type, label: info.label },
  }])
  await graph.draw()
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
  graph?.destroy()
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
