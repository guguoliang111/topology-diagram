export const EDGE_VISUAL_GAP = 6

export function getParallelEdgeOffsetByIndex(index: number, total: number, gap = EDGE_VISUAL_GAP) {
  if (total <= 1) return 0
  return (index - (total - 1) / 2) * gap
}

export function isDoubleEdgeType(type: unknown) {
  return type === 'double-line' || type === 'double-polyline'
}

export function getEdgeLineCount(edgeData: any) {
  return isDoubleEdgeType(edgeData?.type) ? 2 : 1
}

export function getCanonicalPair(source: unknown, target: unknown) {
  const a = String(source ?? '')
  const b = String(target ?? '')
  return a <= b ? [a, b] : [b, a]
}

export function getVisibleLineOffsetsForEdge(relatedEdges: any[], currentId: string, gap = EDGE_VISUAL_GAP) {
  const sortedEdges = [...relatedEdges].sort((a: any, b: any) => {
    const [canonicalSource, canonicalTarget] = getCanonicalPair(a.source, a.target)
    const dirA = a.source === canonicalSource && a.target === canonicalTarget ? 0 : 1
    const dirB = b.source === canonicalSource && b.target === canonicalTarget ? 0 : 1
    if (dirA !== dirB) return dirA - dirB
    return String(a.id).localeCompare(String(b.id))
  })

  const totalVisibleLines = sortedEdges.reduce((sum: number, item: any) => sum + getEdgeLineCount(item), 0)
  let cursor = 0

  for (const item of sortedEdges) {
    const lineCount = getEdgeLineCount(item)
    const offsets = Array.from({ length: lineCount }, (_, index) => {
      const slot = cursor + index
      return (slot - (totalVisibleLines - 1) / 2) * gap
    })
    if (item.id === currentId) return offsets
    cursor += lineCount
  }

  return [0]
}
