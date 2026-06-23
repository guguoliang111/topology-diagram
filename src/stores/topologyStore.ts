import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'
import type { Graph } from '@antv/g6'

export type PanelMode = 'node' | 'edge' | 'canvas'

export const useTopologyStore = defineStore('topology', () => {
  const graphInstance   = ref<Graph | null>(null)
  const panelMode       = ref<PanelMode>('canvas')
  const selectedNodeId  = ref<string | null>(null)
  const selectedEdgeId  = ref<string | null>(null)
  const zoom            = ref(1)
  const gridVisible     = ref(true)
  const miniMapVisible  = ref(true)
  const selectedEdgeType = ref('polyline')

  function setGraph(g: Graph | null) {
    graphInstance.value = g ? markRaw(g) : null
  }

  function selectNode(id: string | null) {
    selectedNodeId.value = id
    selectedEdgeId.value = null
    panelMode.value = id ? 'node' : 'canvas'
  }

  function selectEdge(id: string | null) {
    selectedEdgeId.value = id
    selectedNodeId.value = null
    panelMode.value = id ? 'edge' : 'canvas'
  }

  function clearSelection() {
    selectedNodeId.value = null
    selectedEdgeId.value = null
    panelMode.value = 'canvas'
  }

  function setZoom(v: number)   { zoom.value = v }
  function toggleGrid()         { gridVisible.value = !gridVisible.value }
  function toggleMiniMap()      { miniMapVisible.value = !miniMapVisible.value }
  function setSelectedEdgeType(type: string) { selectedEdgeType.value = type }

  return {
    graphInstance, panelMode, selectedNodeId, selectedEdgeId,
    zoom, gridVisible, miniMapVisible, selectedEdgeType,
    setGraph, selectNode, selectEdge, clearSelection, setZoom, toggleGrid, toggleMiniMap, setSelectedEdgeType,
  }
})
