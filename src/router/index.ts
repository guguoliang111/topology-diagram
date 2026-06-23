import { createRouter, createWebHistory } from 'vue-router'
import TopologyEditor from '@/views/TopologyEditor.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'TopologyEditor',
      component: TopologyEditor,
    },
  ],
})

export default router
