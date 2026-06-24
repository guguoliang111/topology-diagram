<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTopologyStore } from '@/stores/topologyStore'
import { EDGE_TYPES, LINE_COLORS, getEdgeStylePreset } from '@/config/graphConfig'
import {
  DEFAULT_SMART_ROUTER_GRID_SIZE,
  DEFAULT_SMART_ROUTER_OFFSET,
  isSmartRoutingEnabled,
  resolveEdgeRouter,
} from '@/config/edgeRouting'

const store = useTopologyStore()
const g = () => store.graphInstance

const panelTab = ref<'style' | 'data' | 'registry'>('style')
const registryView = ref<'node' | 'edge'>('node')
const registrySearch = ref('')
const customDataText = ref('{}')
const customDataError = ref('')

const nf = ref({
  label: '',
  x: 0,
  y: 0,
  width: 100,
  height: 60,
  fill: '#EFF4FF',
  stroke: '#5F95FF',
  lineWidth: 1.5,
  radius: 6,
  opacity: 1,
  fontSize: 12,
  fontColor: '#262626',
  fontWeight: 'normal' as string,
  fontStyle: 'normal' as string,
  textAlign: 'center' as string,
  strokeDash: 'none',
  shadow: false,
})

const ef = ref({
  label: '',
  stroke: '#111111',
  lineWidth: 1,
  strokeDash: 'none',
  startArrow: false,
  endArrow: false,
  edgeType: 'polyline',
  fontSize: 12,
  fontColor: '#595959',
  smartRouting: true,
  smartRouterOffset: DEFAULT_SMART_ROUTER_OFFSET,
  smartRouterGridSize: DEFAULT_SMART_ROUTER_GRID_SIZE,
})

const cf = ref({ background: '#F8F9FB' })

const dashMap: Record<string, number[]> = {
  none: [],
  dashed: [6, 3],
  dotted: [2, 3],
}

const panelTagType = computed(() => {
  if (store.panelMode === 'node') return 'primary'
  if (store.panelMode === 'edge') return 'success'
  return 'info'
})

const panelTagLabel = computed(() => {
  if (store.panelMode === 'node') return '节点'
  if (store.panelMode === 'edge') return '连线'
  return '画布'
})

const selectedRegistryKind = computed<'node' | 'edge' | null>(() => {
  if (store.selectedNodeId) return 'node'
  if (store.selectedEdgeId) return 'edge'
  return null
})

const registryNodes = computed(() => {
  void store.dataRevision
  const graph = g()
  if (!graph) return []
  return graph.getNodeData().map((node: any) => {
    const style = node.style ?? {}
    return {
      id: String(node.id),
      label: String(node.data?.label ?? style.labelText ?? node.id),
      shape: String(node.data?.symbolType ?? node.data?.shape ?? node.type ?? ''),
      x: Math.round(Number(style.x ?? 0)),
      y: Math.round(Number(style.y ?? 0)),
    }
  })
})

const registryEdges = computed(() => {
  void store.dataRevision
  const graph = g()
  if (!graph) return []
  return graph.getEdgeData().map((edge: any) => ({
    id: String(edge.id),
    label: String(edge.data?.label ?? edge.style?.labelText ?? edge.id),
    type: String(edge.type ?? 'polyline'),
    source: String(edge.source ?? ''),
    target: String(edge.target ?? ''),
  }))
})

const registryStats = computed(() => ({
  nodes: registryNodes.value.length,
  edges: registryEdges.value.length,
}))

const filteredRegistryNodes = computed(() => {
  const keyword = registrySearch.value.trim().toLowerCase()
  if (!keyword) return registryNodes.value
  return registryNodes.value.filter((node) =>
    [node.id, node.label, node.shape, `${node.x}`, `${node.y}`].some((value) => value.toLowerCase().includes(keyword)),
  )
})

const filteredRegistryEdges = computed(() => {
  const keyword = registrySearch.value.trim().toLowerCase()
  if (!keyword) return registryEdges.value
  return registryEdges.value.filter((edge) =>
    [edge.id, edge.label, edge.type, edge.source, edge.target].some((value) => value.toLowerCase().includes(keyword)),
  )
})

const activeRegistryCount = computed(() =>
  registryView.value === 'node' ? filteredRegistryNodes.value.length : filteredRegistryEdges.value.length,
)

const selectedSnapshot = computed(() => {
  void store.dataRevision
  const graph = g()
  if (!graph) return ''
  if (store.selectedNodeId) {
    const node = graph.getNodeData(store.selectedNodeId) as any
    return node ? JSON.stringify(node, null, 2) : ''
  }
  if (store.selectedEdgeId) {
    const edge = graph.getEdgeData(store.selectedEdgeId) as any
    return edge ? JSON.stringify(edge, null, 2) : ''
  }
  return ''
})

watch(
  () => store.panelMode,
  (mode) => {
    if (mode === 'canvas' && panelTab.value === 'data') {
      panelTab.value = 'style'
    }
  },
)

watch(
  () => store.selectedNodeId,
  (id) => {
    if (!id) return
    registryView.value = 'node'
    const graph = g()
    if (!graph) return
    const node = graph.getNodeData(id) as any
    if (!node) return
    const style = node.style ?? {}
    nf.value.label = node.data?.label ?? style.labelText ?? ''
    nf.value.x = Math.round(style.x ?? 0)
    nf.value.y = Math.round(style.y ?? 0)
    nf.value.width = Math.round(style.width ?? 100)
    nf.value.height = Math.round(style.height ?? 60)
    nf.value.fill = style.fill ?? '#EFF4FF'
    nf.value.stroke = style.stroke ?? '#5F95FF'
    nf.value.lineWidth = style.lineWidth ?? 1.5
    nf.value.radius = style.radius ?? 6
    nf.value.opacity = style.opacity ?? 1
    nf.value.fontSize = style.labelFontSize ?? 12
    nf.value.fontColor = style.labelFill ?? '#262626'
    nf.value.fontWeight = style.labelFontWeight ?? 'normal'
    nf.value.fontStyle = style.labelFontStyle ?? 'normal'
    nf.value.textAlign = style.labelTextAlign ?? 'center'
    const dash = style.lineDash
    nf.value.strokeDash = !Array.isArray(dash) || dash.length === 0 ? 'none' : dash[0] >= 6 ? 'dashed' : 'dotted'
    nf.value.shadow = Number(style.shadowBlur ?? 0) > 0
    customDataText.value = JSON.stringify(node.data ?? {}, null, 2)
    customDataError.value = ''
    if (panelTab.value !== 'registry') panelTab.value = 'style'
  },
)

watch(
  () => store.selectedEdgeId,
  (id) => {
    if (!id) return
    registryView.value = 'edge'
    const graph = g()
    if (!graph) return
    const edge = graph.getEdgeData(id) as any
    if (!edge) return
    const style = edge.style ?? {}
    ef.value.label = edge.data?.label ?? style.labelText ?? ''
    ef.value.stroke = style.stroke ?? '#111111'
    ef.value.lineWidth = style.lineWidth ?? 1
    ef.value.endArrow = !!style.endArrow
    ef.value.startArrow = !!style.startArrow
    ef.value.edgeType = edge.type ?? 'polyline'
    ef.value.fontSize = style.labelFontSize ?? 12
    ef.value.fontColor = style.labelFill ?? '#595959'
    ef.value.smartRouting = isSmartRoutingEnabled(edge)
    ef.value.smartRouterOffset = Number(style.smartRouterOffset ?? DEFAULT_SMART_ROUTER_OFFSET)
    ef.value.smartRouterGridSize = Number(style.smartRouterGridSize ?? DEFAULT_SMART_ROUTER_GRID_SIZE)
    const dash = style.lineDash
    ef.value.strokeDash = !Array.isArray(dash) || dash.length === 0 ? 'none' : dash[0] >= 6 ? 'dashed' : 'dotted'
    customDataText.value = JSON.stringify(edge.data ?? {}, null, 2)
    customDataError.value = ''
    if (panelTab.value !== 'registry') panelTab.value = 'style'
  },
)

function touchRelatedEdges(graph: any, edgeData: any) {
  if (!edgeData?.source || !edgeData?.target) return
  const related = graph.getEdgeData().filter(
    (edge: any) =>
      (edge.source === edgeData.source && edge.target === edgeData.target) ||
      (edge.source === edgeData.target && edge.target === edgeData.source),
  )
  if (!related.length) return
  graph.updateEdgeData(
    related.map((edge: any) => ({
      id: edge.id,
      style: { ...(edge.style ?? {}) },
    })),
  )
}

async function applyNode() {
  const graph = g()
  const id = store.selectedNodeId
  if (!graph || !id) return
  const current = graph.getNodeData(id) as any
  const data = { ...(current?.data ?? {}), label: nf.value.label }
  await graph.updateNodeData([
    {
      id,
      data,
      style: {
        ...(current?.style ?? {}),
        x: nf.value.x,
        y: nf.value.y,
        width: nf.value.width,
        height: nf.value.height,
        fill: nf.value.fill,
        stroke: nf.value.stroke,
        lineWidth: nf.value.lineWidth,
        radius: nf.value.radius,
        opacity: nf.value.opacity,
        lineDash: dashMap[nf.value.strokeDash],
        labelText: nf.value.label,
        labelFontSize: nf.value.fontSize,
        labelFill: nf.value.fontColor,
        labelFontWeight: nf.value.fontWeight as any,
        labelFontStyle: nf.value.fontStyle as any,
        labelTextAlign: nf.value.textAlign as any,
        shadowColor: nf.value.shadow ? 'rgba(0,0,0,0.2)' : 'transparent',
        shadowBlur: nf.value.shadow ? 8 : 0,
      },
    },
  ])
  customDataText.value = JSON.stringify(data, null, 2)
  await graph.draw()
  store.bumpDataRevision()
}

async function applyEdge() {
  const graph = g()
  const id = store.selectedEdgeId
  if (!graph || !id) return
  const current = graph.getEdgeData(id) as any
  if (!current) return
  const data = { ...(current?.data ?? {}), label: ef.value.label }
  const preset = getEdgeStylePreset(ef.value.edgeType, ef.value.lineWidth)
  const lineWidth = 'lineWidth' in preset ? Number((preset as any).lineWidth) : ef.value.lineWidth
  const lineDash = 'lineDash' in preset ? ((preset as any).lineDash as number[]) : dashMap[ef.value.strokeDash]
  const nextStyle: any = {
    ...(current?.style ?? {}),
    ...preset,
    stroke: ef.value.stroke,
    lineWidth,
    lineDash,
    startArrow: !!ef.value.startArrow,
    endArrow: !!ef.value.endArrow,
    markerStart: null,
    markerEnd: null,
    labelText: ef.value.label,
    labelFontSize: ef.value.fontSize,
    labelFill: ef.value.fontColor,
    smartRouting: ef.value.smartRouting,
    smartRouterOffset: ef.value.smartRouterOffset,
    smartRouterGridSize: ef.value.smartRouterGridSize,
  }
  nextStyle.router = resolveEdgeRouter(
    {
      ...current,
      type: ef.value.edgeType,
      source: current.source,
      target: current.target,
      style: nextStyle,
    },
    graph,
  )
  await graph.updateEdgeData([
    {
      id,
      type: ef.value.edgeType,
      data,
      style: nextStyle,
    },
  ])
  touchRelatedEdges(graph, {
    ...current,
    id,
    source: current.source,
    target: current.target,
    style: nextStyle,
  })
  await graph.draw()
  await graph.setElementState({ [id]: 'selected' })
  store.selectEdge(id)
  ef.value.lineWidth = lineWidth
  customDataText.value = JSON.stringify(data, null, 2)
  store.bumpDataRevision()
}

async function onEdgeTypeChange() {
  if (ef.value.edgeType === 'double-line' || ef.value.edgeType === 'double-polyline') {
    ef.value.strokeDash = 'none'
  }
  await applyEdge()
}

async function applyCanvas() {
  const graph = g()
  if (!graph) return
  await graph.setOptions({ background: cf.value.background } as any)
  await graph.draw()
}

async function applyData() {
  const graph = g()
  if (!graph) return
  try {
    const data = JSON.parse(customDataText.value)
    const nodeId = store.selectedNodeId
    const edgeId = store.selectedEdgeId
    if (nodeId) {
      await graph.updateNodeData([{ id: nodeId, data, style: { labelText: data.label ?? nf.value.label } }])
      nf.value.label = data.label ?? nf.value.label
      await graph.draw()
      store.bumpDataRevision()
    }
    if (edgeId) {
      await graph.updateEdgeData([{ id: edgeId, data, style: { labelText: data.label ?? ef.value.label } }])
      ef.value.label = data.label ?? ef.value.label
      await graph.draw()
      store.bumpDataRevision()
    }
    customDataError.value = ''
  } catch {
    customDataError.value = 'JSON 格式错误'
  }
}

function openRegistryItem(kind: 'node' | 'edge', id: string) {
  panelTab.value = 'registry'
  if (kind === 'node') store.selectNode(id)
  else store.selectEdge(id)
}

function isRegistryItemActive(kind: 'node' | 'edge', id: string) {
  return (kind === 'node' && store.selectedNodeId === id) || (kind === 'edge' && store.selectedEdgeId === id)
}
</script>

<template>
  <div class="property-panel">
    <div class="panel-header">
      <el-tag :type="panelTagType" size="small">{{ panelTagLabel }}</el-tag>
      <span class="panel-title">属性面板</span>
    </div>

    <el-tabs v-model="panelTab" class="prop-tabs">
      <el-tab-pane :label="store.panelMode === 'canvas' ? '画布' : '样式'" name="style">
        <template v-if="store.panelMode === 'node'">
          <div class="form-body">
            <div class="sec">文本</div>
            <div class="row">
              <label>标签</label>
              <el-input v-model="nf.label" size="small" @input="applyNode" />
            </div>
            <div class="row">
              <label>字号</label>
              <el-input-number v-model="nf.fontSize" size="small" :min="8" :max="48" :controls="false" class="w70" @change="applyNode" />
              <el-color-picker v-model="nf.fontColor" size="small" @change="applyNode" />
              <el-button size="small" :type="nf.fontWeight === 'bold' ? 'primary' : ''" text @click="nf.fontWeight = nf.fontWeight === 'bold' ? 'normal' : 'bold'; applyNode()"><b>B</b></el-button>
              <el-button size="small" :type="nf.fontStyle === 'italic' ? 'primary' : ''" text @click="nf.fontStyle = nf.fontStyle === 'italic' ? 'normal' : 'italic'; applyNode()"><i>I</i></el-button>
            </div>

            <div class="sec">位置 / 尺寸</div>
            <div class="grid2">
              <div><label>X</label><el-input-number v-model="nf.x" size="small" :controls="false" @change="applyNode" /></div>
              <div><label>Y</label><el-input-number v-model="nf.y" size="small" :controls="false" @change="applyNode" /></div>
              <div><label>宽</label><el-input-number v-model="nf.width" size="small" :min="10" :controls="false" @change="applyNode" /></div>
              <div><label>高</label><el-input-number v-model="nf.height" size="small" :min="10" :controls="false" @change="applyNode" /></div>
            </div>

            <div class="sec">填充</div>
            <div class="row">
              <label>颜色</label>
              <el-color-picker v-model="nf.fill" size="small" show-alpha @change="applyNode" />
              <span class="hex">{{ nf.fill }}</span>
            </div>
            <div class="dots">
              <span v-for="color in LINE_COLORS" :key="color" class="dot" :style="{ background: color }" @click="nf.fill = color; applyNode()" />
            </div>

            <div class="sec">边框</div>
            <div class="row">
              <label>颜色</label>
              <el-color-picker v-model="nf.stroke" size="small" @change="applyNode" />
              <span class="hex">{{ nf.stroke }}</span>
            </div>
            <div class="dots">
              <span v-for="color in LINE_COLORS" :key="color" class="dot" :style="{ background: color }" @click="nf.stroke = color; applyNode()" />
            </div>
            <div class="row">
              <label>线宽</label>
              <el-slider v-model="nf.lineWidth" :min="0" :max="10" :step="0.5" @change="applyNode" />
              <span class="badge">{{ nf.lineWidth }}</span>
            </div>
            <div class="row">
              <label>线型</label>
              <el-select v-model="nf.strokeDash" size="small" @change="applyNode">
                <el-option value="none" label="实线" />
                <el-option value="dashed" label="虚线" />
                <el-option value="dotted" label="点线" />
              </el-select>
            </div>
            <div class="row">
              <label>圆角</label>
              <el-slider v-model="nf.radius" :min="0" :max="40" @change="applyNode" />
              <span class="badge">{{ nf.radius }}</span>
            </div>

            <div class="sec">效果</div>
            <div class="row">
              <label>透明度</label>
              <el-slider v-model="nf.opacity" :min="0.1" :max="1" :step="0.05" @change="applyNode" />
              <span class="badge">{{ Math.round(nf.opacity * 100) }}%</span>
            </div>
            <div class="row">
              <label>阴影</label>
              <el-switch v-model="nf.shadow" @change="applyNode" />
            </div>
          </div>
        </template>

        <template v-else-if="store.panelMode === 'edge'">
          <div class="form-body">
            <div class="sec">标签</div>
            <div class="row">
              <label>文本</label>
              <el-input v-model="ef.label" size="small" @input="applyEdge" />
            </div>
            <div class="row">
              <label>字号</label>
              <el-input-number v-model="ef.fontSize" size="small" :min="8" :max="36" :controls="false" class="w70" @change="applyEdge" />
              <el-color-picker v-model="ef.fontColor" size="small" @change="applyEdge" />
            </div>

            <div class="sec">线条</div>
            <div class="row">
              <label>颜色</label>
              <el-color-picker v-model="ef.stroke" size="small" @change="applyEdge" />
              <span class="hex">{{ ef.stroke }}</span>
            </div>
            <div class="dots">
              <span v-for="color in LINE_COLORS" :key="color" class="dot" :style="{ background: color }" @click="ef.stroke = color; applyEdge()" />
            </div>
            <div class="row">
              <label>线宽</label>
              <el-slider v-model="ef.lineWidth" :min="1" :max="10" :step="0.5" @change="applyEdge" />
              <span class="badge">{{ ef.lineWidth }}</span>
            </div>
            <div class="row">
              <label>线型</label>
              <el-select v-model="ef.strokeDash" size="small" @change="applyEdge">
                <el-option value="none" label="实线" />
                <el-option value="dashed" label="虚线" />
                <el-option value="dotted" label="点线" />
              </el-select>
            </div>
            <div class="row">
              <label>类型</label>
              <el-select v-model="ef.edgeType" size="small" @change="onEdgeTypeChange">
                <el-option v-for="option in EDGE_TYPES" :key="option.type" :value="option.type" :label="option.label" />
              </el-select>
            </div>

            <div class="sec">箭头</div>
            <div class="row">
              <label>起点</label>
              <el-switch v-model="ef.startArrow" @change="applyEdge" />
            </div>
            <div class="row">
              <label>终点</label>
              <el-switch v-model="ef.endArrow" @change="applyEdge" />
            </div>

            <div class="sec">路由</div>
            <div class="row">
              <label>智能避让</label>
              <el-switch v-model="ef.smartRouting" @change="applyEdge" />
            </div>
            <div class="row">
              <label>避让距离</label>
              <el-slider v-model="ef.smartRouterOffset" :min="8" :max="40" :step="2" @change="applyEdge" />
              <span class="badge">{{ ef.smartRouterOffset }}</span>
            </div>
            <div class="row">
              <label>网格粒度</label>
              <el-slider v-model="ef.smartRouterGridSize" :min="4" :max="20" :step="2" @change="applyEdge" />
              <span class="badge">{{ ef.smartRouterGridSize }}</span>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="form-body">
            <div class="empty-hint">
              <el-icon :size="42" color="#d9d9d9"><Connection /></el-icon>
              <p>点击节点或连线后编辑属性</p>
            </div>
            <div class="sec">画布外观</div>
            <div class="row">
              <label>背景色</label>
              <el-color-picker v-model="cf.background" size="small" show-alpha @change="applyCanvas" />
            </div>
          </div>
        </template>
      </el-tab-pane>

      <el-tab-pane v-if="store.panelMode !== 'canvas'" label="数据" name="data">
        <div class="form-body">
          <div class="sec">自定义数据 (JSON)</div>
          <el-input v-model="customDataText" type="textarea" :rows="13" class="mono-input" @input="customDataError = ''" />
          <span v-if="customDataError" class="err">{{ customDataError }}</span>
          <el-button type="primary" size="small" style="margin-top: 8px; width: 100%" @click="applyData">应用</el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="数据配置" name="registry">
        <div class="form-body registry-body">
          <div class="registry-toolbar">
            <el-input v-model="registrySearch" size="small" placeholder="搜索节点、连线、ID">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <div class="registry-topbar">
              <div class="registry-switch">
                <button type="button" class="scope-button" :class="{ active: registryView === 'node' }" @click="registryView = 'node'">
                  节点
                </button>
                <button type="button" class="scope-button" :class="{ active: registryView === 'edge' }" @click="registryView = 'edge'">
                  连线
                </button>
              </div>
              <div class="registry-stats-inline">
                <span class="stat-chip">节点 {{ registryStats.nodes }}</span>
                <span class="stat-chip">连线 {{ registryStats.edges }}</span>
              </div>
            </div>
          </div>

          <section class="registry-panel">
            <div class="registry-panel-header">
              <div>
                <div class="registry-panel-title">{{ registryView === 'node' ? '节点列表' : '连接线列表' }}</div>
                <div class="registry-panel-caption">{{ registryView === 'node' ? `当前显示 ${activeRegistryCount} 个节点` : `当前显示 ${activeRegistryCount} 条连接线` }}</div>
              </div>
            </div>

            <div class="registry-scroller">
              <div class="registry-list" v-if="registryView === 'node'">
                <button
                  v-for="node in filteredRegistryNodes"
                  :key="node.id"
                  type="button"
                  class="registry-item"
                  :class="{ active: isRegistryItemActive('node', node.id) }"
                  @click="openRegistryItem('node', node.id)"
                >
                  <div class="registry-row">
                    <div class="registry-main">
                      <span class="registry-title">{{ node.label }}</span>
                      <span class="registry-subtitle">{{ node.id }}</span>
                    </div>
                    <div class="registry-side">
                      <span class="registry-badge">{{ node.shape }}</span>
                      <span class="registry-position">{{ node.x }}, {{ node.y }}</span>
                    </div>
                  </div>
                </button>
              </div>

              <div class="registry-list" v-else>
                <button
                  v-for="edge in filteredRegistryEdges"
                  :key="edge.id"
                  type="button"
                  class="registry-item"
                  :class="{ active: isRegistryItemActive('edge', edge.id) }"
                  @click="openRegistryItem('edge', edge.id)"
                >
                  <div class="registry-row">
                    <div class="registry-main">
                      <span class="registry-title">{{ edge.label || edge.id }}</span>
                      <span class="registry-subtitle">{{ edge.source }} → {{ edge.target }}</span>
                    </div>
                    <div class="registry-side">
                      <span class="registry-badge">{{ edge.type }}</span>
                      <span class="registry-position">{{ edge.id }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </section>

          <section v-if="selectedRegistryKind" class="registry-panel detail-panel">
            <div class="registry-panel-header detail-header">
              <div>
                <div class="registry-panel-title">当前对象</div>
                <div class="registry-panel-caption">{{ selectedRegistryKind === 'node' ? '节点信息编辑' : '连接线信息编辑' }}</div>
              </div>
              <span class="detail-kind">{{ selectedRegistryKind === 'node' ? '节点' : '连线' }}</span>
            </div>

            <template v-if="selectedRegistryKind === 'node'">
              <div class="row">
                <label>标签</label>
                <el-input v-model="nf.label" size="small" @input="applyNode" />
              </div>
              <div class="grid2 compact-grid">
                <div><label>ID</label><div class="readonly">{{ store.selectedNodeId }}</div></div>
                <div><label>位置</label><div class="readonly">{{ nf.x }}, {{ nf.y }}</div></div>
              </div>
            </template>

            <template v-else>
              <div class="row">
                <label>标签</label>
                <el-input v-model="ef.label" size="small" @input="applyEdge" />
              </div>
              <div class="grid2 compact-grid">
                <div><label>ID</label><div class="readonly">{{ store.selectedEdgeId }}</div></div>
                <div><label>类型</label><div class="readonly">{{ ef.edgeType }}</div></div>
              </div>
            </template>

            <div class="detail-section">
              <div class="detail-section-title">数据 JSON</div>
              <el-input v-model="customDataText" type="textarea" :rows="8" class="mono-input" @input="customDataError = ''" />
              <span v-if="customDataError" class="err">{{ customDataError }}</span>
              <el-button type="primary" size="small" class="detail-action" @click="applyData">应用</el-button>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">对象快照</div>
              <el-input :model-value="selectedSnapshot" type="textarea" :rows="9" class="mono-input" readonly />
            </div>
          </section>

          <section v-else class="registry-panel registry-empty-panel">
            <div class="registry-empty-title">未选择对象</div>
            <div class="registry-empty">先从上面的列表里点一个节点或连接线，再在这里编辑信息。</div>
          </section>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.property-panel {
  width: 380px;
  min-width: 380px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}

.prop-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

:deep(.el-tabs__header) {
  margin: 0;
  padding: 0 10px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

:deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

:deep(.el-tab-pane) {
  height: 100%;
}

.form-body {
  padding: 10px 12px 20px;
  display: flex;
  flex-direction: column;
  gap: 7px;
  overflow-y: auto;
  flex: 1;
}

.sec {
  font-size: 11px;
  font-weight: 700;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
  margin-top: 2px;
}

.sec:first-child {
  border-top: none;
  padding-top: 0;
  margin-top: 0;
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
}

.row label {
  font-size: 12px;
  color: #595959;
  min-width: 44px;
  white-space: nowrap;
}

.row .el-input,
.row .el-select {
  flex: 1;
}

.row :deep(.el-slider) {
  flex: 1;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.grid2 > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.grid2 > div label {
  font-size: 11px;
  color: #8c8c8c;
}

.grid2 :deep(.el-input-number) {
  width: 100%;
}

.compact-grid .readonly {
  min-height: 30px;
}

.w70 {
  width: 70px !important;
}

.hex {
  font-size: 10px;
  color: #aaa;
  font-family: monospace;
  max-width: 64px;
  overflow: hidden;
  white-space: nowrap;
}

.dots {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-left: 50px;
}

.dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  transition: transform 0.15s;
  flex-shrink: 0;
}

.dot:hover {
  transform: scale(1.4);
}

.badge {
  font-size: 11px;
  color: #8c8c8c;
  min-width: 28px;
  text-align: right;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 28px 0 16px;
}

.empty-hint p {
  font-size: 12px;
  color: #bfbfbf;
  text-align: center;
  line-height: 1.7;
}

.mono-input :deep(textarea) {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
}

.err {
  font-size: 12px;
  color: #ff4d4f;
}

.registry-body {
  gap: 12px;
}

.registry-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.registry-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.registry-stats-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 11px;
  white-space: nowrap;
}

.registry-switch {
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
}

.scope-button {
  min-width: 72px;
  height: 30px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
}

.scope-button:hover {
  color: #111827;
}

.scope-button.active {
  background: #ffffff;
  color: #111827;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(229, 231, 235, 0.9);
}

.registry-panel {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
}

.registry-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #eef0f3;
  background: #fcfcfd;
}

.registry-panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
}

.registry-panel-caption {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.4;
  margin-top: 2px;
}

.registry-scroller {
  max-height: 260px;
  overflow-y: auto;
  padding: 8px 10px;
}

.registry-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.registry-item {
  width: 100%;
  padding: 0;
  border: 0;
  border-bottom: 1px solid #eef0f3;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: background 0.18s, border-color 0.18s;
}

.registry-item:last-child {
  border-bottom: 0;
}

.registry-item:hover {
  background: #f8fafc;
}

.registry-item.active {
  background: #f8fafc;
}

.registry-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 54px;
  padding: 0 2px;
}

.registry-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.registry-side {
  flex-shrink: 0;
  width: 116px;
  min-width: 116px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  text-align: right;
}

.registry-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.registry-subtitle {
  display: block;
  font-size: 11px;
  color: #6b7280;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.registry-badge {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 10px;
  line-height: 1.2;
}

.registry-position {
  display: block;
  font-size: 11px;
  color: #6b7280;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-panel {
  padding: 0;
}

.detail-header {
  align-items: center;
}

.detail-kind {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 11px;
  line-height: 1;
}

.detail-panel .row,
.detail-panel .grid2,
.detail-section {
  padding-left: 12px;
  padding-right: 12px;
}

.detail-panel .row {
  margin-top: 10px;
}

.detail-panel .grid2 {
  margin-top: 8px;
}

.detail-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eef0f3;
}

.detail-section-title {
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.detail-action {
  margin-top: 8px;
  width: 100%;
}

.registry-empty-panel {
  padding: 20px 16px;
}

.registry-empty-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 6px;
}

.registry-empty {
  font-size: 12px;
  color: #9ca3af;
  line-height: 1.6;
}

.readonly {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 12px;
  color: #374151;
  word-break: break-all;
}
</style>
