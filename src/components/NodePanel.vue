<script setup lang="ts">
import { computed, ref } from 'vue'
import { EDGE_TYPES, NODE_ICONS, NODE_SHAPES } from '@/config/graphConfig'
import { useTopologyStore } from '@/stores/topologyStore'

const store = useTopologyStore()
const searchText = ref('')
const allCategory = '\u5168\u90e8'
const panelTitle = '\u7ec4\u4ef6\u5e93'
const searchPlaceholder = '\u641c\u7d22\u56fe\u5143'
const edgeSectionTitle = '\u8fde\u7ebf\u7c7b\u578b'
const activeCategory = ref(allCategory)

const categories = computed(() => [allCategory, ...new Set(NODE_SHAPES.map((node) => node.category))])

const filteredShapes = computed(() => {
  let shapes = NODE_SHAPES
  if (activeCategory.value !== allCategory) {
    shapes = shapes.filter((shape) => shape.category === activeCategory.value)
  }
  if (searchText.value.trim()) {
    shapes = shapes.filter((shape) => shape.label.includes(searchText.value.trim()))
  }
  return shapes
})

function onDragStart(event: DragEvent, shape: typeof NODE_SHAPES[number]) {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('node-shape', JSON.stringify(shape))
}
</script>

<template>
  <div class="node-panel">
    <div class="panel-header">
      <span class="panel-title">{{ panelTitle }}</span>
    </div>

    <div class="search-box">
      <el-input v-model="searchText" :placeholder="searchPlaceholder" size="small" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </div>

    <div class="category-tabs">
      <span
        v-for="category in categories"
        :key="category"
        class="cat-tab"
        :class="{ active: activeCategory === category }"
        @click="activeCategory = category"
      >
        {{ category }}
      </span>
    </div>

    <div class="shape-grid">
      <div
        v-for="shape in filteredShapes"
        :key="shape.type"
        class="shape-item"
        draggable="true"
        @dragstart="onDragStart($event, shape)"
      >
        <svg viewBox="0 0 32 32" width="36" height="36" class="shape-svg" aria-hidden="true">
          <path
            :d="NODE_ICONS[shape.icon] || NODE_ICONS.station"
            :fill="shape.fill"
            :stroke="shape.stroke"
            :stroke-width="shape.icon === 'busbar' ? 2.2 : 1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill-rule="evenodd"
          />
        </svg>
        <span class="shape-label">{{ shape.label }}</span>
      </div>
    </div>

    <div class="panel-section">
      <div class="section-title">{{ edgeSectionTitle }}</div>
      <div class="edge-list">
        <div
          v-for="edge in EDGE_TYPES"
          :key="edge.type"
          class="edge-item"
          :class="{ active: store.selectedEdgeType === edge.type }"
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
  width: 208px;
  min-width: 208px;
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

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}

.search-box {
  padding: 8px 10px;
  flex-shrink: 0;
}

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

.cat-tab.active {
  background: #111827;
  color: #fff;
}

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
  gap: 6px;
  padding: 9px 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: grab;
  transition: border-color 0.18s, background 0.18s, transform 0.18s, box-shadow 0.18s;
  background: #fafafa;
  user-select: none;
}

.shape-item:hover {
  border-color: #111827;
  background: #f3f4f6;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.08);
  transform: translateY(-1px);
}

.shape-item:active {
  cursor: grabbing;
  transform: scale(0.97);
}

.shape-svg {
  display: block;
  overflow: visible;
}

.shape-label {
  font-size: 11px;
  color: #374151;
  text-align: center;
  line-height: 1.2;
}

.panel-section {
  padding: 10px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #8c8c8c;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.edge-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

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

.edge-item:hover {
  background: #f3f4f6;
}

.edge-item.active {
  background: #e5e7eb;
}

.edge-item.active .edge-label,
.edge-item.active .edge-icon {
  color: #111827;
  font-weight: 600;
}

.edge-icon {
  font-size: 15px;
  min-width: 20px;
  text-align: center;
  color: #374151;
}

.edge-label {
  font-size: 12px;
  color: #595959;
}
</style>
