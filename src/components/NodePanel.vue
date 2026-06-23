<script setup lang="ts">
import { ref, computed } from 'vue'
import { NODE_SHAPES, EDGE_TYPES, NODE_ICONS } from '@/config/graphConfig'
import { useTopologyStore } from '@/stores/topologyStore'

const store = useTopologyStore()
const searchText = ref('')
const activeCategory = ref('全部')

const categories = computed(() => ['全部', ...new Set(NODE_SHAPES.map(n => n.category))])

const filteredShapes = computed(() => {
  let shapes = NODE_SHAPES
  if (activeCategory.value !== '全部') shapes = shapes.filter(s => s.category === activeCategory.value)
  if (searchText.value) shapes = shapes.filter(s => s.label.includes(searchText.value))
  return shapes
})

function onDragStart(e: DragEvent, shape: typeof NODE_SHAPES[0]) {
  e.dataTransfer!.effectAllowed = 'copy'
  e.dataTransfer!.setData('node-shape', JSON.stringify(shape))
}
</script>

<template>
  <div class="node-panel">
    <div class="panel-header">
      <span class="panel-title">组件库</span>
    </div>

    <div class="search-box">
      <el-input v-model="searchText" placeholder="搜索组件…" size="small" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </div>

    <div class="category-tabs">
      <span
        v-for="cat in categories" :key="cat"
        class="cat-tab" :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
      >{{ cat }}</span>
    </div>

    <div class="shape-grid">
      <div
        v-for="shape in filteredShapes" :key="shape.label"
        class="shape-item"
        draggable="true"
        @dragstart="onDragStart($event, shape)"
      >
        <svg viewBox="0 0 32 32" width="32" height="32" class="shape-svg">
          <path
            :d="NODE_ICONS[shape.icon] || NODE_ICONS['rect']"
            :fill="shape.fill"
            :stroke="shape.stroke"
            stroke-width="1.8"
            fill-rule="evenodd"
          />
        </svg>
        <span class="shape-label">{{ shape.label }}</span>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-title">连线类型</div>
      <div class="edge-list">
        <div
          v-for="edge in EDGE_TYPES" :key="edge.type"
          class="edge-item"
          :class="{ active: store.selectedEdgeType === edge.type }"
          :data-type="edge.type"
          @click="store.setSelectedEdgeType(edge.type)"
        >
          <span class="edge-icon">{{ edge.icon }}</span>
          <span class="edge-label">{{ edge.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-panel {
  width: 200px;
  min-width: 200px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  padding: 12px 14px 8px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.panel-title { font-size: 13px; font-weight: 600; color: #262626; }
.search-box { padding: 8px 10px; flex-shrink: 0; }
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 10px 8px;
  flex-shrink: 0;
}
.cat-tab {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  color: #595959;
  background: #f5f5f5;
  transition: all 0.2s;
  user-select: none;
}
.cat-tab.active { background: #5F95FF; color: #fff; }
.shape-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 0 10px 10px;
  overflow-y: auto;
  flex: 1;
}
.shape-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 4px 7px;
  border: 1px solid #e8e8e8;
  border-radius: 7px;
  cursor: grab;
  transition: all 0.18s;
  background: #fafafa;
  user-select: none;
}
.shape-item:hover {
  border-color: #5F95FF;
  background: #EFF4FF;
  box-shadow: 0 2px 8px rgba(95,149,255,0.18);
  transform: translateY(-1px);
}
.shape-item:active { cursor: grabbing; transform: scale(0.96); }
.shape-svg { display: block; overflow: visible; }
.shape-label { font-size: 11px; color: #595959; text-align: center; line-height: 1.2; }
.panel-section { padding: 10px; border-top: 1px solid #f0f0f0; flex-shrink: 0; }
.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #8c8c8c;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.edge-list { display: flex; flex-direction: column; gap: 3px; }
.edge-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 13px;
}
.edge-item:hover { background: #f0f4ff; }
.edge-item.active { background: #e8f1ff; }
.edge-item.active .edge-label,
.edge-item.active .edge-icon { color: #1677ff; font-weight: 600; }
.edge-icon { font-size: 15px; min-width: 20px; text-align: center; color: #5F95FF; }
.edge-label { font-size: 12px; color: #595959; }
</style>
