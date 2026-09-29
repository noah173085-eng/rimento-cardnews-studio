import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Rnd } from 'react-rnd'
import { AspectId, CardPage, FreeItem, LayoutEdit, PageLayoutEdits } from '../types'
import {
  activeEdits, applyEdit, Box, editableChildren, keyOf, layoutOf, MAX_SCALE, measureBase, MIN_SCALE, resolveKey, withEdit
} from '../lib/layoutEdits'
import { FREE_PREFIX, freeIdOf } from '../lib/freeItems'

/**
 * LayoutEditor 컴포넌트 — 미리보기 카드 위에 겹쳐서 요소를 끌어 옮기고, 모서리로 비율 고정 크기 조절
 * 클릭은 바깥 요소, 더블클릭은 선택한 요소의 한 단계 안쪽 요소를 선택한다
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
  const freeId = freeIdOf(key)
  const free = freeId ? page.freeItems?.find(it => it.id === freeId) : undefined
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

  /** 텍스트: 좌우 손잡이 = 폭만(줄바꿈 위치), 모서리 = 폭과 글자 크기를 함께 비율로. 이미지: 비율 고정 크기 */
  const resized = (dir: string, ref: HTMLElement, pos: { x: number; y: number }): Partial<FreeItem> => {
    const r = (n: number) => Math.round(n)
    if (free?.kind === 'image') return { x: r(pos.x), y: r(pos.y), w: r(ref.offsetWidth), h: r(ref.offsetHeight) }
    const w = ref.offsetWidth
    const isSide = dir === 'left' || dir === 'right'
    const fontSize = isSide ? resizeStart.current.fontSize : Math.max(8, Math.round(resizeStart.current.fontSize * w / resizeStart.current.w))
    return { x: r(pos.x), y: r(pos.y), w: r(w), fontSize }
  }

  const hs = 18 / scale
  const corner = (v: 'top' | 'bottom', h: 'left' | 'right'): React.CSSProperties => ({
    width: hs, height: hs, [v]: -hs / 2, [h]: -hs / 2,
    background: '#fff', border: `${2 / scale}px solid #6d3fd1`, borderRadius: '50%',
  })

  return <div className="layout-editor" style={{ ['--ui-scale' as string]: scale }} onMouseDown={pick} onDoubleClick={drill}>
    {key && base && edit && <Rnd
      className="layout-edit-box"
      bounds="parent"
      scale={scale}
      lockAspectRatio
      position={{ x: base.x + edit.x, y: base.y + edit.y }}
      size={{ width: base.w * edit.s, height: base.h * edit.s }}
      minWidth={base.w * MIN_SCALE} maxWidth={base.w * MAX_SCALE}
      minHeight={base.h * MIN_SCALE} maxHeight={base.h * MAX_SCALE}
      enableResizing={{ topLeft: true, topRight: true, bottomLeft: true, bottomRight: true }}
      resizeHandleStyles={{
        topLeft: corner('top', 'left'), topRight: corner('top', 'right'),
        bottomLeft: corner('bottom', 'left'), bottomRight: corner('bottom', 'right'),
      }}
      onDrag={(_, d) => preview({ ...edit, x: d.x - base.x, y: d.y - base.y })}
      onDragStop={(_, d) => commit({ ...edit, x: d.x - base.x, y: d.y - base.y })}
      onResize={(_, __, ref, ___, pos) => preview({ x: pos.x - base.x, y: pos.y - base.y, s: ref.offsetWidth / base.w })}
      onResizeStop={(_, __, ref, ___, pos) => commit({ x: pos.x - base.x, y: pos.y - base.y, s: ref.offsetWidth / base.w })}
    />}
    {freeId && free && <Rnd
      className="layout-edit-box"
      bounds="parent"
      scale={scale}
      lockAspectRatio={free.kind === 'image'}
      position={{ x: free.x, y: free.y }}
      size={{ width: free.w, height: free.kind === 'image' ? free.h ?? free.w : freeH || 40 }}
      minWidth={40} minHeight={20}
      enableResizing={{ topLeft: true, topRight: true, bottomLeft: true, bottomRight: true, left: free.kind === 'text', right: free.kind === 'text' }}
      resizeHandleStyles={{
        topLeft: corner('top', 'left'), topRight: corner('top', 'right'),
        bottomLeft: corner('bottom', 'left'), bottomRight: corner('bottom', 'right'),
      }}
      onDrag={(_, d) => previewFree({ x: d.x, y: d.y })}
      onDragStop={(_, d) => onFreeChange(free.id, { x: Math.round(d.x), y: Math.round(d.y) })}
      onResizeStart={() => { resizeStart.current = { w: free.w, fontSize: free.fontSize ?? 40 } }}
      onResize={(_, dir, ref, __, pos) => previewFree(resized(dir, ref, pos))}
      onResizeStop={(_, dir, ref, __, pos) => onFreeChange(free.id, resized(dir, ref, pos))}
    />}
  </div>
}
