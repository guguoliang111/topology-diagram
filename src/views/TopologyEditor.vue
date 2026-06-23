<script setup lang="ts">
import GraphToolbar from '@/components/GraphToolbar.vue'
import NodePanel from '@/components/NodePanel.vue'
import GraphCanvas from '@/components/GraphCanvas.vue'
import PropertyPanel from '@/components/PropertyPanel.vue'
</script>

<template>
  <div class="topology-editor">
    <GraphToolbar />
    <div class="editor-body">
      <NodePanel />
      <GraphCanvas />
      <PropertyPanel />
    </div>
  </div>
</template>

<style scoped>
.topology-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f0f2f5;
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
