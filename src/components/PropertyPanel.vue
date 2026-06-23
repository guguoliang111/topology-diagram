<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTopologyStore } from '@/stores/topologyStore'
import { EDGE_TYPES, LINE_COLORS, getEdgeStylePreset } from '@/config/graphConfig'

const store = useTopologyStore()
const g = () => store.graphInstance

// ── Node form ──────────────────────────────────────────────
const nf = ref({
  label: '', x: 0, y: 0, width: 100, height: 60,
  fill: '#EFF4FF', stroke: '#5F95FF', lineWidth: 1.5,
  radius: 6, opacity: 1,
  fontSize: 12, fontColor: '#262626',
  fontWeight: 'normal' as string, fontStyle: 'normal' as string,
  textAlign: 'center' as string,
  strokeDash: 'none',
  shadow: false,
})

// ── Edge form ──────────────────────────────────────────────
const ef = ref({
  label: '',
  stroke: '#5F95FF', lineWidth: 1, strokeDash: 'none',
  startArrow: false, endArrow: false,
  edgeType: 'polyline',
  fontSize: 12, fontColor: '#595959',
})

// ── Canvas form ────────────────────────────────────────────
const cf = ref({ background: '#F8F9FB' })

const customDataText  = ref('{}')
const customDataError = ref('')
const activeTab       = ref('style')

// ── Sync from selection ────────────────────────────────────
watch(() => store.selectedNodeId, (id) => {
  if (!id) return
  const graph = g(); if (!graph) return
  const node = graph.getNodeData(id) as any
  if (!node) return
  const s = node.style ?? {}
  nf.value.label     = node.data?.label ?? s.labelText ?? ''
  nf.value.x         = Math.round(s.x ?? 0)
  nf.value.y         = Math.round(s.y ?? 0)
  nf.value.width     = Math.round(s.width ?? 100)
  nf.value.height    = Math.round(s.height ?? 60)
  nf.value.fill      = s.fill ?? '#EFF4FF'
  nf.value.stroke    = s.stroke ?? '#5F95FF'
  nf.value.lineWidth = s.lineWidth ?? 1.5
  nf.value.radius    = s.radius ?? 6
  nf.value.opacity   = s.opacity ?? 1
  nf.value.fontSize  = s.labelFontSize ?? 12
  nf.value.fontColor = s.labelFill ?? '#262626'
  nf.value.fontWeight = s.labelFontWeight ?? 'normal'
  nf.value.fontStyle  = s.labelFontStyle  ?? 'normal'
  nf.value.textAlign  = s.labelTextAlign  ?? 'center'
  customDataText.value = JSON.stringify(node.data ?? {}, null, 2)
  activeTab.value = 'style'
})

watch(() => store.selectedEdgeId, (id) => {
  if (!id) return
  const graph = g(); if (!graph) return
  const edge = graph.getEdgeData(id) as any
  if (!edge) return
  const s = edge.style ?? {}
  ef.value.label     = edge.data?.label ?? s.labelText ?? ''
  ef.value.stroke    = s.stroke ?? '#5F95FF'
  ef.value.lineWidth = s.lineWidth ?? 1
  ef.value.endArrow  = !!s.endArrow
  ef.value.startArrow = !!s.startArrow
  ef.value.edgeType   = edge.type ?? 'polyline'
  ef.value.fontSize   = s.labelFontSize ?? 12
  ef.value.fontColor  = s.labelFill ?? '#595959'
  const dash = s.lineDash
  ef.value.strokeDash = !Array.isArray(dash) || dash.length === 0 ? 'none' : dash[0] >= 6 ? 'dashed' : 'dotted'
  customDataText.value = JSON.stringify(edge.data ?? {}, null, 2)
  activeTab.value = 'style'
})

// ── Apply ──────────────────────────────────────────────────
const dashMap: Record<string, number[]> = {
  none: [], dashed: [6, 3], dotted: [2, 3],
}

function touchRelatedEdges(graph: any, edgeData: any) {
  if (!edgeData?.source || !edgeData?.target) return
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

async function applyNode() {
  const graph = g(); const id = store.selectedNodeId
  if (!graph || !id) return
  const current = graph.getNodeData(id) as any
  const data = { ...(current?.data ?? {}), label: nf.value.label }
  await graph.updateNodeData([{
    id,
    data,
    style: {
      x:              nf.value.x,
      y:              nf.value.y,
      width:          nf.value.width,
      height:         nf.value.height,
      fill:           nf.value.fill,
      stroke:         nf.value.stroke,
      lineWidth:      nf.value.lineWidth,
      radius:         nf.value.radius,
      opacity:        nf.value.opacity,
      lineDash:       dashMap[nf.value.strokeDash],
      labelText:      nf.value.label,
      labelFontSize:  nf.value.fontSize,
      labelFill:      nf.value.fontColor,
      labelFontWeight: nf.value.fontWeight as any,
      labelFontStyle: nf.value.fontStyle as any,
      labelTextAlign: nf.value.textAlign as any,
      shadowColor:    nf.value.shadow ? 'rgba(0,0,0,0.2)' : undefined,
      shadowBlur:     nf.value.shadow ? 8 : undefined,
    },
  }])
  customDataText.value = JSON.stringify(data, null, 2)
  await graph.draw()
}

async function applyEdge() {
  const graph = g(); const id = store.selectedEdgeId
  if (!graph || !id) return
  const current = graph.getEdgeData(id) as any
  if (!current) return
  const data = { ...(current?.data ?? {}), label: ef.value.label }
  const preset = getEdgeStylePreset(ef.value.edgeType, ef.value.lineWidth)
  const lineWidth = 'lineWidth' in preset ? Number(preset.lineWidth) : ef.value.lineWidth
  const lineDash = 'lineDash' in preset ? preset.lineDash as number[] : dashMap[ef.value.strokeDash]
  const nextStyle = {
    ...(current?.style ?? {}),
    ...preset,
    stroke:        ef.value.stroke,
    lineWidth,
    lineDash,
    startArrow:    !!ef.value.startArrow,
    endArrow:      !!ef.value.endArrow,
    markerStart:   null,
    markerEnd:     null,
    labelText:     ef.value.label,
    labelFontSize: ef.value.fontSize,
    labelFill:     ef.value.fontColor,
    router:        ef.value.edgeType === 'double-line' ? false : ef.value.edgeType === 'double-polyline' ? { type: 'orth' } : current?.style?.router,
  }
  const nextEdge = {
    ...current,
    id,
    type: ef.value.edgeType,
    data,
    style: nextStyle,
  }
  await graph.removeEdgeData([id])
  await graph.draw()
  graph.addEdgeData([nextEdge])
  touchRelatedEdges(graph, nextEdge)
  await graph.draw()
  await graph.setElementState({ [id]: 'selected' })
  store.selectEdge(id)
  ef.value.lineWidth = lineWidth
  customDataText.value = JSON.stringify(data, null, 2)
}

async function onEdgeTypeChange() {
  if (ef.value.edgeType === 'double-line' || ef.value.edgeType === 'double-polyline') {
    ef.value.strokeDash = 'none'
  }
  await applyEdge()
}

async function applyCanvas() {
  const graph = g(); if (!graph) return
  await graph.setOptions({ background: cf.value.background } as any)
  await graph.draw()
}

async function applyData() {
  const graph = g(); if (!graph) return
  try {
    const data = JSON.parse(customDataText.value)
    const nid = store.selectedNodeId
    const eid = store.selectedEdgeId
    if (nid) {
      await graph.updateNodeData([{ id: nid, data, style: { labelText: data.label ?? nf.value.label } }])
      nf.value.label = data.label ?? nf.value.label
      await graph.draw()
    }
    if (eid) {
      await graph.updateEdgeData([{ id: eid, data, style: { labelText: data.label ?? ef.value.label } }])
      ef.value.label = data.label ?? ef.value.label
      await graph.draw()
    }
    customDataError.value = ''
  } catch { customDataError.value = 'JSON 格式错误' }
}

const edgeTypeOpts = [
  { value: 'line',     label: '直线' },
  { value: 'polyline', label: '折线' },
  { value: 'quadratic',label: '二次曲线' },
  { value: 'cubic',    label: '三次曲线' },
]
void edgeTypeOpts
</script>

<template>
  <div class="property-panel">
    <div class="panel-header">
      <el-tag v-if="store.panelMode==='node'" size="small" type="primary">节点</el-tag>
      <el-tag v-else-if="store.panelMode==='edge'" size="small" type="success">连线</el-tag>
      <el-tag v-else size="small" type="info">画布</el-tag>
      <span class="panel-title">属性面板</span>
    </div>

    <!-- ══════ NODE ══════ -->
    <template v-if="store.panelMode==='node'">
      <el-tabs v-model="activeTab" class="prop-tabs">
        <el-tab-pane label="样式" name="style">
          <div class="form-body">

            <div class="sec">文本</div>
            <div class="row"><label>标签</label>
              <el-input v-model="nf.label" size="small" @input="applyNode" />
            </div>
            <div class="row"><label>字号</label>
              <el-input-number v-model="nf.fontSize" size="small" :min="8" :max="48" :controls="false" class="w70" @change="applyNode" />
              <el-color-picker v-model="nf.fontColor" size="small" @change="applyNode" />
              <el-button size="small" :type="nf.fontWeight==='bold'?'primary':''" text @click="nf.fontWeight=nf.fontWeight==='bold'?'normal':'bold';applyNode()"><b>B</b></el-button>
              <el-button size="small" :type="nf.fontStyle==='italic'?'primary':''" text @click="nf.fontStyle=nf.fontStyle==='italic'?'normal':'italic';applyNode()"><i>I</i></el-button>
            </div>

            <div class="sec">位置 / 尺寸</div>
            <div class="grid2">
              <div><label>X</label><el-input-number v-model="nf.x" size="small" :controls="false" @change="applyNode" /></div>
              <div><label>Y</label><el-input-number v-model="nf.y" size="small" :controls="false" @change="applyNode" /></div>
              <div><label>宽</label><el-input-number v-model="nf.width" size="small" :min="10" :controls="false" @change="applyNode" /></div>
              <div><label>高</label><el-input-number v-model="nf.height" size="small" :min="10" :controls="false" @change="applyNode" /></div>
            </div>

            <div class="sec">填充</div>
            <div class="row"><label>颜色</label>
              <el-color-picker v-model="nf.fill" size="small" show-alpha @change="applyNode" />
              <span class="hex">{{ nf.fill }}</span>
            </div>
            <div class="dots">
              <span v-for="c in LINE_COLORS" :key="c" class="dot" :style="{background:c}" @click="nf.fill=c;applyNode()" />
            </div>

            <div class="sec">边框</div>
            <div class="row"><label>颜色</label>
              <el-color-picker v-model="nf.stroke" size="small" @change="applyNode" />
              <span class="hex">{{ nf.stroke }}</span>
            </div>
            <div class="dots">
              <span v-for="c in LINE_COLORS" :key="c" class="dot" :style="{background:c}" @click="nf.stroke=c;applyNode()" />
            </div>
            <div class="row"><label>线宽</label>
              <el-slider v-model="nf.lineWidth" :min="0" :max="10" :step="0.5" @change="applyNode" />
              <span class="badge">{{ nf.lineWidth }}</span>
            </div>
            <div class="row"><label>线型</label>
              <el-select v-model="nf.strokeDash" size="small" @change="applyNode">
                <el-option value="none"   label="实线 ───" />
                <el-option value="dashed" label="虚线 - - -" />
                <el-option value="dotted" label="点线 · · ·" />
              </el-select>
            </div>
            <div class="row"><label>圆角</label>
              <el-slider v-model="nf.radius" :min="0" :max="40" @change="applyNode" />
              <span class="badge">{{ nf.radius }}</span>
            </div>

            <div class="sec">效果</div>
            <div class="row"><label>透明度</label>
              <el-slider v-model="nf.opacity" :min="0.1" :max="1" :step="0.05" @change="applyNode" />
              <span class="badge">{{ Math.round(nf.opacity*100) }}%</span>
            </div>
            <div class="row"><label>阴影</label>
              <el-switch v-model="nf.shadow" @change="applyNode" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据" name="data">
          <div class="form-body">
            <div class="sec">自定义数据 (JSON)</div>
            <el-input v-model="customDataText" type="textarea" :rows="13" class="mono-input" @input="customDataError=''" />
            <span v-if="customDataError" class="err">{{ customDataError }}</span>
            <el-button type="primary" size="small" style="margin-top:8px;width:100%" @click="applyData">应用</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <!-- ══════ EDGE ══════ -->
    <template v-else-if="store.panelMode==='edge'">
      <el-tabs v-model="activeTab" class="prop-tabs">
        <el-tab-pane label="样式" name="style">
          <div class="form-body">

            <div class="sec">标签</div>
            <div class="row"><label>文本</label>
              <el-input v-model="ef.label" size="small" @input="applyEdge" />
            </div>
            <div class="row"><label>字号</label>
              <el-input-number v-model="ef.fontSize" size="small" :min="8" :max="36" :controls="false" class="w70" @change="applyEdge" />
              <el-color-picker v-model="ef.fontColor" size="small" @change="applyEdge" />
            </div>

            <div class="sec">线条</div>
            <div class="row"><label>颜色</label>
              <el-color-picker v-model="ef.stroke" size="small" @change="applyEdge" />
              <span class="hex">{{ ef.stroke }}</span>
            </div>
            <div class="dots">
              <span v-for="c in LINE_COLORS" :key="c" class="dot" :style="{background:c}" @click="ef.stroke=c;applyEdge()" />
            </div>
            <div class="row"><label>线宽</label>
              <el-slider v-model="ef.lineWidth" :min="1" :max="10" :step="0.5" @change="applyEdge" />
              <span class="badge">{{ ef.lineWidth }}</span>
            </div>
            <div class="row"><label>线型</label>
              <el-select v-model="ef.strokeDash" size="small" @change="applyEdge">
                <el-option value="none"   label="实线 ───" />
                <el-option value="dashed" label="虚线 - - -" />
                <el-option value="dotted" label="点线 · · ·" />
              </el-select>
            </div>
            <div class="row"><label>类型</label>
              <el-select v-model="ef.edgeType" size="small" @change="onEdgeTypeChange">
                <el-option v-for="o in EDGE_TYPES" :key="o.type" :value="o.type" :label="o.label" />
              </el-select>
            </div>

            <div class="sec">箭头</div>
            <div class="row"><label>起点箭头</label>
              <el-switch v-model="ef.startArrow" @change="applyEdge" />
            </div>
            <div class="row"><label>终点箭头</label>
              <el-switch v-model="ef.endArrow" @change="applyEdge" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="数据" name="data">
          <div class="form-body">
            <div class="sec">自定义数据 (JSON)</div>
            <el-input v-model="customDataText" type="textarea" :rows="13" class="mono-input" @input="customDataError=''" />
            <span v-if="customDataError" class="err">{{ customDataError }}</span>
            <el-button type="primary" size="small" style="margin-top:8px;width:100%" @click="applyData">应用</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <!-- ══════ CANVAS ══════ -->
    <template v-else>
      <div class="form-body">
        <div class="empty-hint">
          <el-icon :size="42" color="#d9d9d9"><Connection /></el-icon>
          <p>点击节点或连线<br>编辑属性</p>
        </div>
        <div class="sec">画布外观</div>
        <div class="row"><label>背景色</label>
          <el-color-picker v-model="cf.background" size="small" show-alpha @change="applyCanvas" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.property-panel {
  width: 256px; min-width: 256px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  display: flex; flex-direction: column; overflow: hidden;
}
.panel-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-bottom: 1px solid #f0f0f0;
  background: #fafafa; flex-shrink: 0;
}
.panel-title { font-size: 13px; font-weight: 600; color: #262626; }
.prop-tabs { flex: 1; min-height: 0; display: flex; flex-direction: column; }
:deep(.el-tabs__header) { margin: 0; padding: 0 10px; border-bottom: 1px solid #f0f0f0; background: #fafafa; flex-shrink: 0; }
:deep(.el-tabs__content) { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
:deep(.el-tab-pane) { height: 100%; }
.form-body { padding: 10px 12px 20px; display: flex; flex-direction: column; gap: 7px; overflow-y: auto; flex: 1; }
.sec { font-size: 11px; font-weight: 700; color: #8c8c8c; text-transform: uppercase; letter-spacing: .5px; border-top: 1px solid #f0f0f0; padding-top: 8px; margin-top: 2px; }
.sec:first-child { border-top: none; padding-top: 0; margin-top: 0; }
.row { display: flex; align-items: center; gap: 6px; min-height: 28px; }
.row label { font-size: 12px; color: #595959; min-width: 44px; white-space: nowrap; }
.row .el-input  { flex: 1; }
.row .el-select { flex: 1; }
.row :deep(.el-slider) { flex: 1; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.grid2 > div { display: flex; flex-direction: column; gap: 3px; }
.grid2 > div label { font-size: 11px; color: #8c8c8c; }
.grid2 :deep(.el-input-number) { width: 100%; }
.w70 { width: 70px !important; }
.hex { font-size: 10px; color: #aaa; font-family: monospace; max-width: 64px; overflow: hidden; white-space: nowrap; }
.dots { display: flex; flex-wrap: wrap; gap: 4px; padding-left: 50px; }
.dot { width: 14px; height: 14px; border-radius: 50%; cursor: pointer; border: 1.5px solid rgba(0,0,0,.08); transition: transform .15s; flex-shrink: 0; }
.dot:hover { transform: scale(1.4); }
.badge { font-size: 11px; color: #8c8c8c; min-width: 28px; text-align: right; }
.empty-hint { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 28px 0 16px; }
.empty-hint p { font-size: 12px; color: #bfbfbf; text-align: center; line-height: 1.7; }
.mono-input :deep(textarea) { font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.5; }
.err { font-size: 12px; color: #ff4d4f; }
</style>
