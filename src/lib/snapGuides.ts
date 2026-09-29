import { Box, editableChildren, layoutOf, visualBox } from './layoutEdits'

/** 세로 기준선의 x 들, 가로 기준선의 y 들 (캔버스 1080 기준 px) */
export interface Lines { x: number[]; y: number[] }

/** 이 거리(캔버스 px) 안으로 들어오면 붙는다. 미리보기 배율 0.47 에서 화면 약 4px */
export const SNAP_DISTANCE = 8

/**
 * 끌기 시작할 때 맞춤 기준선을 모은다.
 * 카드 가장자리·가운데, 여백선(.layout 박스), 템플릿 큰 덩어리, 같은 부모 안의 형제 요소, 직접 추가한 박스.
 * self 와 그 조상·자손은 빼서 자기 자신에게 붙지 않게 한다.
 */
export function collectLines(canvas: HTMLElement, self: Element | null): Lines {
  const lines: Lines = { x: [0, canvas.offsetWidth / 2, canvas.offsetWidth], y: [0, canvas.offsetHeight / 2, canvas.offsetHeight] }
  const add = (el: Element) => {
    if (self && (el.contains(self) || self.contains(el))) return
    if (el instanceof HTMLElement && el.dataset.hidden !== undefined) return // 삭제(숨김)한 요소
    const b = visualBox(el, canvas)
    lines.x.push(b.x, b.x + b.w / 2, b.x + b.w)
    lines.y.push(b.y, b.y + b.h / 2, b.y + b.h)
  }
  const layout = layoutOf(canvas)
  if (layout) {
    const b = visualBox(layout, canvas)
    lines.x.push(b.x, b.x + b.w)
    lines.y.push(b.y, b.y + b.h)
    editableChildren(layout).forEach(add)
  }
  const parent = self?.parentElement
  if (parent && parent !== layout && layout?.contains(parent)) Array.from(parent.children).forEach(add)
  canvas.querySelectorAll('[data-free-id]').forEach(add)
  return lines
}

/** 박스의 왼쪽·가운데·오른쪽(위·가운데·아래) 중 기준선에 가장 가까운 것을 붙인다. 붙은 기준선도 돌려준다 */
export function snapBox(box: Box, lines: Lines): { x: number; y: number; guides: Lines } {
  const nearest = (edges: number[], candidates: number[]) => {
    let best: { shift: number; line: number } | null = null
    for (const e of edges) for (const c of candidates) {
      if (Math.abs(c - e) <= SNAP_DISTANCE && (!best || Math.abs(c - e) < Math.abs(best.shift))) best = { shift: c - e, line: c }
    }
    return best
  }
  const sx = nearest([box.x, box.x + box.w / 2, box.x + box.w], lines.x)
  const sy = nearest([box.y, box.y + box.h / 2, box.y + box.h], lines.y)
  return {
    x: box.x + (sx?.shift ?? 0),
    y: box.y + (sy?.shift ?? 0),
    guides: { x: sx ? [sx.line] : [], y: sy ? [sy.line] : [] },
  }
}
