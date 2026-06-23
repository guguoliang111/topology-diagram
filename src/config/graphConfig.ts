export interface NodeShapeConfig {
  type: string
  label: string
  icon: string
  width: number
  height: number
  category: string
  fill: string
  stroke: string
  radius?: number
}

export const NODE_SHAPES: NodeShapeConfig[] = [
  { type: 'rect', label: '矩形', icon: 'rect', width: 120, height: 60, category: '基础图形', fill: '#EFF4FF', stroke: '#5F95FF', radius: 6 },
  { type: 'circle', label: '圆形', icon: 'circle', width: 60, height: 60, category: '基础图形', fill: '#F0FFF4', stroke: '#52C41A' },
  { type: 'ellipse', label: '椭圆', icon: 'ellipse', width: 120, height: 60, category: '基础图形', fill: '#E6F7FF', stroke: '#1890FF' },
  { type: 'diamond', label: '菱形', icon: 'diamond', width: 80, height: 80, category: '基础图形', fill: '#FFFBE6', stroke: '#FAAD14' },
  { type: 'rect', label: '数据库', icon: 'db', width: 80, height: 96, category: '网络节点', fill: '#E8F4FD', stroke: '#5DADE2', radius: 4 },
  { type: 'rect', label: '服务器', icon: 'server', width: 80, height: 80, category: '网络节点', fill: '#EFF4FF', stroke: '#5F95FF', radius: 8 },
  { type: 'ellipse', label: '云', icon: 'cloud', width: 120, height: 72, category: '网络节点', fill: '#E6F7FF', stroke: '#91D5FF' },
  { type: 'diamond', label: '路由器', icon: 'router', width: 80, height: 80, category: '网络节点', fill: '#FFF7E6', stroke: '#FFB347' },
  { type: 'rect', label: '交换机', icon: 'switch', width: 96, height: 56, category: '网络节点', fill: '#F6FFED', stroke: '#73D13D', radius: 4 },
  { type: 'rect', label: '防火墙', icon: 'firewall', width: 96, height: 56, category: '网络节点', fill: '#FFF1F0', stroke: '#FF4D4F', radius: 4 },
  { type: 'rect', label: '开始', icon: 'start', width: 100, height: 44, category: '流程图形', fill: '#F6FFED', stroke: '#52C41A', radius: 22 },
  { type: 'rect', label: '结束', icon: 'end', width: 100, height: 44, category: '流程图形', fill: '#FFF1F0', stroke: '#FF4D4F', radius: 22 },
  { type: 'rect', label: '流程', icon: 'process', width: 120, height: 50, category: '流程图形', fill: '#F9F0FF', stroke: '#9254DE', radius: 4 },
  { type: 'diamond', label: '判断', icon: 'decision', width: 80, height: 80, category: '流程图形', fill: '#FFFBE6', stroke: '#FAAD14' },
  { type: 'ellipse', label: '终端', icon: 'terminal', width: 100, height: 48, category: '流程图形', fill: '#E6FFFB', stroke: '#13C2C2' },
  { type: 'rect', label: '注释', icon: 'note', width: 100, height: 80, category: '流程图形', fill: '#FFFEF0', stroke: '#D9D9D9', radius: 2 },
]

export const EDGE_TYPES = [
  { type: 'line', label: '直线', icon: '-' },
  { type: 'polyline', label: '折线', icon: '┐' },
  { type: 'quadratic', label: '曲线', icon: '~' },
  { type: 'cubic', label: '三次曲线', icon: '∿' },
  { type: 'double-line', label: '双直线', icon: '═' },
  { type: 'double-polyline', label: '双折线', icon: '╔' },
  { type: 'dashed-line', label: '虚直线', icon: '╌' },
  { type: 'dotted-line', label: '点直线', icon: '⋯' },
  { type: 'thick-line', label: '粗直线', icon: '━' },
]

export function getEdgeStylePreset(type: string, lineWidth = 1) {
  if (type === 'dashed-line') return { lineDash: [8, 4] }
  if (type === 'dotted-line') return { lineDash: [2, 4] }
  if (type === 'thick-line') return { lineWidth: Math.max(lineWidth, 5) }
  if (type === 'double-line' || type === 'double-polyline') {
    return { doubleLineGap: 2, lineDash: [] }
  }
  return {}
}

export const LINE_COLORS = [
  '#5F95FF', '#61C1B9', '#73D13D', '#FF7A45', '#9254DE',
  '#F759AB', '#1890FF', '#FF4D4F', '#FAAD14', '#13C2C2',
]

export const NODE_ICONS: Record<string, string> = {
  rect: 'M4,8 h24 a2,2 0 0,1 2,2 v12 a2,2 0 0,1 -2,2 h-24 a2,2 0 0,1 -2,-2 v-12 a2,2 0 0,1 2,-2 z',
  circle: 'M16,4 a12,12 0 1,1 0,24 a12,12 0 1,1 0,-24 z',
  ellipse: 'M16,10 a12,6 0 1,1 0,12 a12,6 0 1,1 0,-12 z',
  diamond: 'M16,4 L28,16 L16,28 L4,16 z',
  db: 'M6,9 a10,4 0 1,1 20,0 v14 a10,4 0 1,1 -20,0 v-14 z M6,9 a10,4 0 1,0 20,0',
  server: 'M4,6 h24 v8 h-24 z M4,18 h24 v8 h-24 z M8,11 h2 v-2 h-2 z M8,23 h2 v-2 h-2 z',
  cloud: 'M10,20 a5,5 0 0,1 0,-10 a5,5 0 0,1 9,-3 a4,4 0 0,1 5,4 a4,4 0 0,1 -1,9 z',
  router: 'M16,4 L28,16 L16,28 L4,16 z M16,10 v12 M10,16 h12',
  switch: 'M4,12 h24 M4,20 h24 M8,8 v16 M24,8 v16',
  firewall: 'M16,4 L28,12 v8 a8,8 0 0,1 -24,0 v-8 z',
  start: 'M8,16 a8,8 0 1,1 16,0 a8,8 0 1,1 -16,0 z',
  end: 'M4,12 h24 v8 h-24 z M4,12 a4,4 0 0,1 0,8 M28,12 a4,4 0 0,1 0,8',
  process: 'M6,10 h20 a2,2 0 0,1 2,2 v8 a2,2 0 0,1 -2,2 h-20 a2,2 0 0,1 -2,-2 v-8 a2,2 0 0,1 2,-2 z',
  decision: 'M16,6 L26,16 L16,26 L6,16 z',
  terminal: 'M8,13 a8,5 0 1,1 16,0 v6 a8,5 0 1,1 -16,0 v-6 z',
  note: 'M6,4 h18 l4,4 v20 h-22 z M22,4 v4 h4',
}
