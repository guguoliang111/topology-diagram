import assert from 'node:assert/strict'
import { build } from 'vite'

const edgeRouting = await import('../dist-check/config/edgeRouting.js').catch(() => null)
const edgeSpacing = await import('../dist-check/config/edgeSpacing.js').catch(() => null)
const graphConfig = await import('../dist-check/config/graphConfig.js').catch(() => null)

if (!edgeRouting || !edgeSpacing || !graphConfig) {
  throw new Error('dist-check artifacts are missing')
}

const {
  DEFAULT_SMART_ROUTER_GRID_SIZE,
  DEFAULT_SMART_ROUTER_OFFSET,
  getEdgeRouter,
  getRenderedEdgeType,
  isSmartRoutingEnabled,
} = edgeRouting
const { EDGE_VISUAL_GAP, getParallelEdgeOffsetByIndex, getVisibleLineOffsetsForEdge } = edgeSpacing
const { NODE_ICONS, NODE_SHAPES, getEdgeStylePreset } = graphConfig

assert.equal(isSmartRoutingEnabled({ style: {} }), true)
assert.equal(isSmartRoutingEnabled({ style: { smartRouting: false } }), false)

const smartRouter = getEdgeRouter({ type: 'line', style: { smartRouting: true } })
assert.equal(smartRouter.type, 'shortest-path')
assert.equal(smartRouter.enableObstacleAvoidance, true)
assert.equal(smartRouter.offset, DEFAULT_SMART_ROUTER_OFFSET)
assert.equal(smartRouter.gridSize, DEFAULT_SMART_ROUTER_GRID_SIZE)

const normalLineRouter = getEdgeRouter({ type: 'line', style: { smartRouting: false } })
assert.equal(normalLineRouter, false)

const normalPolylineRouter = getEdgeRouter({ type: 'polyline', style: { smartRouting: false } })
assert.equal(normalPolylineRouter.type, 'orth')

assert.equal(
  getRenderedEdgeType({ type: 'double-line', style: { smartRouting: true, router: { type: 'shortest-path' } } }),
  'double-polyline',
)
assert.equal(
  getRenderedEdgeType({ type: 'quadratic', style: { smartRouting: true, router: { type: 'shortest-path' } } }),
  'polyline',
)
assert.equal(getRenderedEdgeType({ type: 'double-line', style: { smartRouting: false } }), 'double-line')

assert.equal(getParallelEdgeOffsetByIndex(0, 1), 0)
assert.equal(getParallelEdgeOffsetByIndex(0, 2), -3)
assert.equal(getParallelEdgeOffsetByIndex(1, 2), 3)
assert.equal(getParallelEdgeOffsetByIndex(0, 3), -6)
assert.equal(getParallelEdgeOffsetByIndex(1, 3), 0)
assert.equal(getParallelEdgeOffsetByIndex(2, 3), 6)

const pairDoubleOffsets = getVisibleLineOffsetsForEdge([
  { id: 'ab', source: 'A', target: 'B', type: 'double-line' },
  { id: 'ba', source: 'B', target: 'A', type: 'double-line' },
], 'ab')
const reverseDoubleOffsets = getVisibleLineOffsetsForEdge([
  { id: 'ab', source: 'A', target: 'B', type: 'double-line' },
  { id: 'ba', source: 'B', target: 'A', type: 'double-line' },
], 'ba')
assert.deepEqual(pairDoubleOffsets, [-EDGE_VISUAL_GAP * 1.5, -EDGE_VISUAL_GAP * 0.5])
assert.deepEqual(reverseDoubleOffsets, [EDGE_VISUAL_GAP * 0.5, EDGE_VISUAL_GAP * 1.5])

const mixedOffsets = getVisibleLineOffsetsForEdge([
  { id: 'a-line', source: 'A', target: 'B', type: 'line' },
  { id: 'b-double', source: 'A', target: 'B', type: 'double-line' },
], 'b-double')
assert.deepEqual(mixedOffsets, [0, EDGE_VISUAL_GAP])

for (const type of ['ring-junction', 'cabinet', 'box', 'fuse', 'cross-box']) {
  assert.equal(NODE_SHAPES.some((shape) => shape.type === type && shape.nodeType === 'schematic-node'), true)
  assert.equal(typeof NODE_ICONS[type], 'string')
  assert.notEqual(NODE_ICONS[type].length, 0)
}

const doubleLinePreset = getEdgeStylePreset('double-line', 1)
assert.equal(doubleLinePreset.doubleLineGap, EDGE_VISUAL_GAP)
assert.equal(doubleLinePreset.startArrow, false)
assert.equal(doubleLinePreset.endArrow, false)
assert.equal(doubleLinePreset.startArrowSize, 16)
assert.equal(doubleLinePreset.endArrowSize, 16)

console.log('edge routing checks passed')
