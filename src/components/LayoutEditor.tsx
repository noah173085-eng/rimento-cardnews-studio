import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { AspectId, CardPage, FreeItem, LayoutEdit, PageLayoutEdits } from '../types'
import {
  activeEdits, applyEdit, Box, editableChildren, keyOf, layoutOf, MAX_SCALE, measureBase, MIN_SCALE, resolveKey, setBoxSize, withEdit
} from '../lib/layoutEdits'
import { FREE_PREFIX, freeIdOf } from '../lib/freeItems'
import { collectLines, Lines, snapBox } from '../lib/snapGuides'

/**
 * LayoutEditor 컴포넌트 — 미리보기 카드 위에 겹쳐서 요소를 끌어 옮기고, 모서리로 비율 고정 크기 조절
 * 클릭은 바깥 요소, 더블클릭은 선택한 요소의 한 단계 안쪽 요소를 선택한다
 * 끄는 동안 카드·여백·다른 요소의 가장자리/가운데에 붙고 분홍 안내선을 보여준다 (Alt 를 누르면 자유 이동)
 *
 * Props:
 * @param {string} canvasId - 편집할 CardCanvas 의 DOM id [Required]
 * @param {CardPage} page - 현재 페이지 [Required]
 * @param {AspectId} aspect - 현재 비율 [Required]
 * @param {number} scale - 미리보기 축소 배율 (react-rnd 좌표 환산용) [Required]
 * @param {string|null} selectedKey - 선택된 요소 키 [Required]
 * @param {function} onSelect - 요소 선택/해제 콜백 [Required]
 * @param {function} onChange - 조정값 저장 콜백 (없으면 undefined) [Required]
 * @param {function} onFreeChange - 직접 추가한 이미지·텍스트 박스 수정 콜백 (id, patch) [Required]
 *
 * Example usage:
 * <LayoutEditor canvasId="card-preview" page={page} aspect="4:5" scale={0.47} selectedKey={key} onSelect={setKey} onChange={edits => updatePage({ layoutEdits: edits })}/>
 */
interface Props {
  canvasId: string
  page: CardPage
  aspect: AspectId
  scale: number
  selectedKey: string | null
  onSelect: (key: string | null) => void
  onChange: (edits: PageLayoutEdits | undefined) => void
  onFreeChange: (id: string, patch: Partial<FreeItem>) => void
}

export function LayoutEditor({ canvasId, page, aspect, scale, selectedKey: key, onSelect: setKey, onChange, onFreeChange }: Props) {
  const [base, setBase] = useState<Box | null>(null)
  const [freeH, setFreeH] = useState(0)
  const resizeStart = useRef({ w: 0, fontSize: 0 })
  // 모서리 손잡이 = 비율 고정, 변 손잡이 = 너비·높이 따로.
  // 라이브러리의 비율 고정(lockAspectRatio)은 모서리를 옆으로만 끌면 크기가 안 바뀌어서, 비율은 직접 계산한다
  const isCorner = (dir: string) => /^(top|bottom)(Left|Right)$/.test(dir)
  const startBox = useRef({ x: 0, y: 0, w: 1, h: 1 })
  /** 모서리로 끈 크기를 비율 고정 크기로: 가로·세로 중 더 많이 바뀐 쪽 비율을 쓰고, 잡은 모서리의 반대쪽 모서리는 제자리 */
  const proportional = (dir: string, ref: HTMLElement) => {
    const sb = startBox.current
    const kx = ref.offsetWidth / sb.w
    const ky = ref.offsetHeight / sb.h
    const k = Math.abs(kx - 1) >= Math.abs(ky - 1) ? kx : ky
    const w = sb.w * k
    const h = sb.h * k
    return { w, h, x: /Left$/.test(dir) ? sb.x + sb.w - w : sb.x, y: /^top/.test(dir) ? sb.y + sb.h - h : sb.y }
  }
  const [guides, setGuides] = useState<Lines>({ x: [], y: [] })
  const snapLines = useRef<Lines>({ x: [], y: [] })
  const isDragged = useRef(false)
  const freeId = freeIdOf(key)
  const free = freeId ? page.freeItems?.find(it => it.id === freeId) : undefined
  // 텍스트는 내용 높이를 재고, 나머지(이미지·도형·아이콘)는 저장된 높이
  const freeHeight = free?.kind === 'text' ? freeH || 40 : free?.h ?? free?.w ?? 40
  const edits = activeEdits(page, aspect)
  const edit = key ? edits[key] ?? { x: 0, y: 0, s: 1 } : null

  const getCanvas = () => document.getElementById(canvasId)
  const getEl = (k: string) => {
    const layout = layoutOf(getCanvas())
    return !k.startsWith(FREE_PREFIX) && layout ? resolveKey(layout, k) : undefined
  }
  const getFreeEl = (id: string) => getCanvas()?.querySelector<HTMLElement>(`[data-free-id="${id}"]`) ?? null

  // 페이지·템플릿·비율이 바뀌면 선택 해제 (처음 켤 때는 유지: 추가 버튼이 새 박스를 선택해 둔 채로 켠다)
  const scope = `${page.id}|${page.template}|${aspect}`
  const prevScope = useRef(scope)
  useEffect(() => {
    if (prevScope.current === scope) return
    prevScope.current = scope
    setKey(null)
  }, [scope])

  // 선택 요소의 원래 박스를 잰다 (CardCanvas 의 조정값 적용 이후에 실행됨)
  useLayoutEffect(() => {
    const canvas = getCanvas()
    const el = key ? getEl(key) : undefined
    setBase(canvas && el ? measureBase(el, canvas) : null)
    // 텍스트 박스는 높이가 내용에 따라 정해지므로 잰다
    const freeEl = freeId ? getFreeEl(freeId) : null
    setFreeH(freeEl ? freeEl.offsetHeight : 0)
  }, [key, page, aspect])

  const pick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return // 선택 박스 위 클릭은 드래그로 처리
    const canvas = getCanvas()
    const layout = layoutOf(canvas)
    if (!canvas || !layout) return
    const children = editableChildren(layout)
    for (const hit of document.elementsFromPoint(e.clientX, e.clientY)) {
      // 직접 추가한 박스가 가장 위에 있으므로 먼저 확인
      const freeEl = hit.closest<HTMLElement>('[data-free-id]')
      if (freeEl && canvas.contains(freeEl)) return setKey(FREE_PREFIX + freeEl.dataset.freeId)
      let node: Element | null = hit
      while (node && node.parentElement !== layout) node = node.parentElement
      if (!node) continue
      const found = [...children].find(([, el]) => el === node)
      if (!found) continue
      // 카드 밖으로 걸쳐 있는 장식 도형은 "카드 안에서만 이동" 조건을 지킬 수 없으므로 제외
      const b = measureBase(found[1], canvas)
      if (b.x < -1 || b.y < -1 || b.x + b.w > canvas.offsetWidth + 1 || b.y + b.h > canvas.offsetHeight + 1) continue
      setKey(found[0])
      return
    }
    setKey(null)
  }

  // 더블클릭: 선택한 요소 안에서 커서 아래에 있는 한 단계 안쪽 요소를 선택
  const drill = (e: React.MouseEvent<HTMLDivElement>) => {
    const layout = layoutOf(getCanvas())
    const current = key ? getEl(key) : undefined
    if (!layout || !current) return
    for (const hit of document.elementsFromPoint(e.clientX, e.clientY)) {
      if (hit === current || !current.contains(hit)) continue
      let node: Element = hit
      while (node.parentElement && node.parentElement !== current) node = node.parentElement
      if (!(node instanceof HTMLElement)) continue // svg 아이콘은 제외
      const k = keyOf(layout, node)
      if (k) return setKey(k)
    }
  }

  // 드래그·리사이즈 중에는 저장 없이 DOM 에만 바로 반영
  const preview = (next: LayoutEdit) => {
    const canvas = getCanvas()
    const el = key ? getEl(key) : undefined
    if (canvas && el) applyEdit(el, canvas, next)
  }

  const commit = (next: LayoutEdit) => {
    if (key) onChange(withEdit(page, aspect, key, next))
  }

  // 직접 추가한 박스: 드래그 중에는 DOM 만 바꾸고, 놓을 때 저장
  const previewFree = (next: Partial<FreeItem>) => {
    const el = freeId ? getFreeEl(freeId) : null
    if (!el) return
    if (next.x !== undefined) el.style.left = `${next.x}px`
    if (next.y !== undefined) el.style.top = `${next.y}px`
    if (next.w !== undefined) el.style.width = `${next.w}px`
    if (next.h !== undefined) el.style.height = `${next.h}px`
    if (next.fontSize !== undefined) el.style.fontSize = `${next.fontSize}px`
  }

  /** 텍스트: 좌우 손잡이 = 폭만(줄바꿈 위치), 모서리 = 폭과 글자 크기를 함께 비율로. 이미지·아이콘: 비율 고정, 도형: 자유 크기 */
  const resized = (dir: string, ref: HTMLElement, pos: { x: number; y: number }): Partial<FreeItem> => {
    const r = (n: number) => Math.round(n)
    if (free && (free.kind === 'image' || free.kind === 'icon') && isCorner(dir)) {
      const p = proportional(dir, ref)
      return { x: r(p.x), y: r(p.y), w: r(p.w), h: r(p.h) }
    }
    if (free && free.kind !== 'text') return { x: r(pos.x), y: r(pos.y), w: r(ref.offsetWidth), h: r(ref.offsetHeight) }
    const w = ref.offsetWidth
    const isSide = dir === 'left' || dir === 'right'
    const fontSize = isSide ? resizeStart.current.fontSize : Math.max(8, Math.round(resizeStart.current.fontSize * w / resizeStart.current.w))
    return { x: r(pos.x), y: r(pos.y), w: r(w), fontSize }
  }

  // 스마트 안내선: 끌기 시작할 때 기준선을 모으고, 끄는 동안 가까운 기준선에 붙인다 (Alt 를 누르면 자유 이동)
  const noGuides: Lines = { x: [], y: [] }
  const startSnap = (el: Element | null | undefined) => {
    const canvas = getCanvas()
    snapLines.current = canvas ? collectLines(canvas, el ?? null) : noGuides
    isDragged.current = false
  }
  const snapped = (e: unknown, box: Box) => {
    if ((e as MouseEvent).altKey) { setGuides(noGuides); return box }
    const s = snapBox(box, snapLines.current)
    setGuides(s.guides)
    return { ...box, x: s.x, y: s.y }
  }
  // 클릭만 하고 움직이지 않았으면 붙이지 않는다 (선택만 했는데 요소가 움직이면 안 되므로)
  const dropped = (e: unknown, box: Box) => {
    const p = isDragged.current ? snapped(e, box) : box
    setGuides(noGuides)
    return p
  }

  /**
   * 변 손잡이(템플릿 요소): 상자 너비(좌우) 또는 높이(상하)만 바꾼다.
   * 너비가 바뀌면 글자가 다시 줄바꿈되고 원래 자리도 달라질 수 있어, 크기를 넣은 뒤 원래 자리를 다시 재서 위치를 맞춘다.
   */
  const resizeSide = (dir: string, ref: HTMLElement, pos: { x: number; y: number }, isFinal: boolean) => {
    const canvas = getCanvas()
    const el = key ? getEl(key) : undefined
    if (!canvas || !el || !edit) return
    const size = dir === 'left' || dir === 'right' ? { w: ref.offsetWidth / edit.s } : { h: ref.offsetHeight / edit.s }
    setBoxSize(el, size.w, size.h)
    const nb = measureBase(el, canvas)
    const next = { ...edit, ...size, x: pos.x - nb.x, y: pos.y - nb.y }
    applyEdit(el, canvas, next)
    if (isFinal) commit(next)
  }

  const hs = 18 / scale
  const corner = (v: 'top' | 'bottom', h: 'left' | 'right'): React.CSSProperties => ({
    width: hs, height: hs, [v]: -hs / 2, [h]: -hs / 2,
    background: '#fff', border: `${2 / scale}px solid #6d3fd1`, borderRadius: '50%',
  })
  /** 변 가운데의 막대 손잡이 */
  const side = (edge: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties => {
    const isV = edge === 'left' || edge === 'right'
    return {
      width: isV ? hs * 0.55 : hs * 1.7, height: isV ? hs * 1.7 : hs * 0.55,
      [edge]: -hs * 0.275, ...(isV ? { top: '50%', marginTop: -hs * 0.85 } : { left: '50%', marginLeft: -hs * 0.85 }),
      background: '#fff', border: `${2 / scale}px solid #6d3fd1`, borderRadius: hs,
    }
  }
  const handleStyles = {
    topLeft: corner('top', 'left'), topRight: corner('top', 'right'),
    bottomLeft: corner('bottom', 'left'), bottomRight: corner('bottom', 'right'),
    top: side('top'), bottom: side('bottom'), left: side('left'), right: side('right'),
  }

  return <div className="layout-editor" style={{ ['--ui-scale' as string]: scale }} onMouseDown={pick} onDoubleClick={drill}>
    {key && base && edit && <Rnd
      className="layout-edit-box"
      bounds="parent"
      scale={scale}
      position={{ x: base.x + edit.x, y: base.y + edit.y }}
      size={{ width: base.w * edit.s, height: base.h * edit.s }}
      minWidth={Math.min(24, base.w * MIN_SCALE)} maxWidth={Math.max(1080, base.w * MAX_SCALE)}
      minHeight={Math.min(16, base.h * MIN_SCALE)} maxHeight={Math.max(1350, base.h * MAX_SCALE)}
      enableResizing={{ topLeft: true, topRight: true, bottomLeft: true, bottomRight: true, top: true, bottom: true, left: true, right: true }}
      resizeHandleStyles={handleStyles}
      onResizeStart={() => { startBox.current = { x: base.x + edit.x, y: base.y + edit.y, w: base.w * edit.s, h: base.h * edit.s } }}
      onDragStart={() => startSnap(getEl(key))}
      onDrag={(e, d) => {
        isDragged.current = true
        const p = snapped(e, { x: d.x, y: d.y, w: base.w * edit.s, h: base.h * edit.s })
        preview({ ...edit, x: p.x - base.x, y: p.y - base.y })
      }}
      onDragStop={(e, d) => {
        const p = dropped(e, { x: d.x, y: d.y, w: base.w * edit.s, h: base.h * edit.s })
        commit({ ...edit, x: p.x - base.x, y: p.y - base.y })
      }}
      onResize={(_, dir, ref, __, pos) => {
        if (!isCorner(dir)) return resizeSide(dir, ref, pos, false)
        const p = proportional(dir, ref)
        preview({ ...edit, x: p.x - base.x, y: p.y - base.y, s: p.w / base.w })
      }}
      onResizeStop={(_, dir, ref, __, pos) => {
        if (!isCorner(dir)) return resizeSide(dir, ref, pos, true)
        const p = proportional(dir, ref)
        commit({ ...edit, x: p.x - base.x, y: p.y - base.y, s: p.w / base.w })
      }}
    />}
    {freeId && free && <Rnd
      className="layout-edit-box"
      bounds="parent"
      scale={scale}
      position={{ x: free.x, y: free.y }}
      size={{ width: free.w, height: freeHeight }}
      minWidth={40} minHeight={20}
      enableResizing={{ topLeft: true, topRight: true, bottomLeft: true, bottomRight: true, left: true, right: true, top: free.kind !== 'text', bottom: free.kind !== 'text' }}
      resizeHandleStyles={handleStyles}
      onDragStart={() => startSnap(getFreeEl(free.id))}
      onDrag={(e, d) => {
        isDragged.current = true
        const p = snapped(e, { x: d.x, y: d.y, w: free.w, h: freeHeight })
        previewFree({ x: p.x, y: p.y })
      }}
      onDragStop={(e, d) => {
        const p = dropped(e, { x: d.x, y: d.y, w: free.w, h: freeHeight })
        onFreeChange(free.id, { x: Math.round(p.x), y: Math.round(p.y) })
      }}
      onResizeStart={() => { resizeStart.current = { w: free.w, fontSize: free.fontSize ?? 40 }; startBox.current = { x: free.x, y: free.y, w: free.w, h: freeHeight } }}
      onResize={(_, dir, ref, __, pos) => previewFree(resized(dir, ref, pos))}
      onResizeStop={(_, dir, ref, __, pos) => onFreeChange(free.id, resized(dir, ref, pos))}
    />}
    {guides.x.map(x => <div key={`x${x}`} className="snap-guide is-vertical" style={{ left: x }}/>)}
    {guides.y.map(y => <div key={`y${y}`} className="snap-guide is-horizontal" style={{ top: y }}/>)}
  </div>
}
