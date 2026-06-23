<script setup lang="ts">
import { computed } from 'vue'
import { useTopologyStore } from '@/stores/topologyStore'
import { ElMessage } from 'element-plus'

const store = useTopologyStore()
const g = () => store.graphInstance

function handleUndo() { (g() as any)?.undo?.() ?? ElMessage.info('没有可撤销的操作') }
function handleRedo() { (g() as any)?.redo?.() ?? ElMessage.info('没有可重做的操作') }

function handleCopy() {
  const graph = g(); if (!graph) return
  const ids = graph.getElementDataByState('node', 'selected').map((n: any) => n.id)
  if (!ids.length) return
  sessionStorage.setItem('g6_clipboard', JSON.stringify(
    graph.getNodeData(ids).map((n: any) => ({ ...n }))
  ))
  ElMessage.success(`已复制 ${ids.length} 个节点`)
}

async function handlePaste() {
  const graph = g(); if (!graph) return
  const raw = sessionStorage.getItem('g6_clipboard')
  if (!raw) return
  const nodes = JSON.parse(raw)
  await graph.addNodeData(nodes.map((n: any) => ({
    ...n,
    id: `node-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    style: { ...n.style, x: (n.style?.x ?? 100) + 20, y: (n.style?.y ?? 100) + 20 },
  })))
  await graph.draw()
}

async function handleDelete() {
  const graph = g(); if (!graph) return
  const nodeIds = graph.getElementDataByState('node', 'selected').map((n: any) => n.id)
  const edgeIds = graph.getElementDataByState('edge', 'selected').map((e: any) => e.id)
  if (!nodeIds.length && !edgeIds.length) return
  if (nodeIds.length) await graph.removeNodeData(nodeIds)
  if (edgeIds.length) await graph.removeEdgeData(edgeIds)
  await graph.draw()
  store.clearSelection()
  ElMessage.success('已删除')
}

function handleZoomIn()  { const z = (g()?.getZoom() ?? 1) + 0.1; g()?.zoomTo(z) }
function handleZoomOut() { const z = (g()?.getZoom() ?? 1) - 0.1; g()?.zoomTo(Math.max(0.2, z)) }
function handleFitView() { g()?.fitView() }
function handleActualSize() { g()?.zoomTo(1); g()?.fitCenter() }

async function handleClear() {
  const graph = g(); if (!graph) return
  const nodeIds = graph.getNodeData().map((n: any) => n.id)
  const edgeIds = graph.getEdgeData().map((e: any) => e.id)
  if (nodeIds.length) await graph.removeNodeData(nodeIds)
  if (edgeIds.length) await graph.removeEdgeData(edgeIds)
  await graph.draw()
  store.clearSelection()
  ElMessage.success('画布已清空')
}

function handleExportJSON() {
  const graph = g(); if (!graph) return
  const data = { nodes: graph.getNodeData(), edges: graph.getEdgeData() }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: 'topology.json' })
  a.click(); URL.revokeObjectURL(url)
}

function handleImportJSON() {
  const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json' })
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      const graph = g(); if (!graph) return
      await graph.setData(data)
      await graph.render()
      ElMessage.success('导入成功')
    } catch { ElMessage.error('文件格式错误') }
  }
  input.click()
}

async function handleExportPNG() {
  const graph = g(); if (!graph) return
  const url = await graph.toDataURL({ mode: 'overall', type: 'image/png' })
  const a   = Object.assign(document.createElement('a'), { href: url, download: 'topology.png' })
  a.click()
}

async function handleSelectAll() {
  const graph = g(); if (!graph) return
  const ids = graph.getNodeData().map((n: any) => n.id)
  await graph.setElementState(Object.fromEntries(ids.map((id: string) => [id, 'selected'])))
}

const zoom = computed(() => Math.round((store.zoom ?? 1) * 100))
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-group brand">
      <span class="brand-icon">🕸</span>
      <span class="brand-name">拓扑编辑器</span>
    </div>

    <div class="toolbar-divider" />

    <div class="toolbar-group">
      <el-tooltip content="撤销 Ctrl+Z"><el-button text @click="handleUndo"><el-icon><RefreshLeft /></el-icon></el-button></el-tooltip>
      <el-tooltip content="重做 Ctrl+Y"><el-button text @click="handleRedo"><el-icon><RefreshRight /></el-icon></el-button></el-tooltip>
    </div>

    <div class="toolbar-divider" />

    <div class="toolbar-group">
      <el-tooltip content="复制"><el-button text @click="handleCopy"><el-icon><CopyDocument /></el-icon></el-button></el-tooltip>
      <el-tooltip content="粘贴"><el-button text @click="handlePaste"><el-icon><DocumentAdd /></el-icon></el-button></el-tooltip>
      <el-tooltip content="删除 Delete"><el-button text @click="handleDelete"><el-icon><Delete /></el-icon></el-button></el-tooltip>
      <el-tooltip content="全选 Ctrl+A"><el-button text @click="handleSelectAll"><el-icon><Grid /></el-icon></el-button></el-tooltip>
    </div>

    <div class="toolbar-divider" />

    <div class="toolbar-group">
      <el-tooltip content="放大"><el-button text @click="handleZoomIn"><el-icon><ZoomIn /></el-icon></el-button></el-tooltip>
      <span class="zoom-display">{{ zoom }}%</span>
      <el-tooltip content="缩小"><el-button text @click="handleZoomOut"><el-icon><ZoomOut /></el-icon></el-button></el-tooltip>
      <el-tooltip content="适合窗口"><el-button text @click="handleFitView"><el-icon><FullScreen /></el-icon></el-button></el-tooltip>
      <el-tooltip content="实际大小"><el-button text @click="handleActualSize"><el-icon><Aim /></el-icon></el-button></el-tooltip>
    </div>

    <div class="toolbar-divider" />

    <div class="toolbar-group">
      <el-tooltip :content="store.gridVisible ? '隐藏网格' : '显示网格'">
        <el-button text :type="store.gridVisible ? 'primary' : ''" @click="store.toggleGrid()"><el-icon><Grid /></el-icon></el-button>
      </el-tooltip>
      <el-tooltip :content="store.miniMapVisible ? '隐藏缩略图' : '显示缩略图'">
        <el-button text :type="store.miniMapVisible ? 'primary' : ''" @click="store.toggleMiniMap()"><el-icon><PictureRounded /></el-icon></el-button>
      </el-tooltip>
    </div>

    <div class="toolbar-divider" />

    <div class="toolbar-group">
      <el-tooltip content="导入 JSON"><el-button text @click="handleImportJSON"><el-icon><Upload /></el-icon></el-button></el-tooltip>
      <el-dropdown>
        <el-button text><el-icon><Download /></el-icon><span class="btn-label">导出</span></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleExportJSON">导出 JSON</el-dropdown-item>
            <el-dropdown-item @click="handleExportPNG">导出 PNG</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-tooltip content="清空画布">
        <el-button text type="danger" @click="handleClear"><el-icon><Delete /></el-icon><span class="btn-label">清空</span></el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 12px;
  gap: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  z-index: 100;
  flex-shrink: 0;
}
.brand { gap: 6px; }
.brand-icon { font-size: 20px; }
.brand-name { font-size: 15px; font-weight: 600; color: #1a1a2e; white-space: nowrap; }
.toolbar-group { display: flex; align-items: center; gap: 2px; }
.toolbar-divider { width: 1px; height: 20px; background: #e8e8e8; margin: 0 6px; }
.zoom-display { font-size: 12px; color: #595959; min-width: 40px; text-align: center; }
.btn-label { margin-left: 4px; font-size: 13px; }
:deep(.el-button) { height: 32px; padding: 0 8px; }
</style>
