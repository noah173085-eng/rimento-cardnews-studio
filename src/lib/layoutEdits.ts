import { AspectId, CardPage, LayoutEdit, PageLayoutEdits } from '../types'
import { sanitizeRich } from './richText'

export interface Box { x: number; y: number; w: number; h: number }

export const MIN_SCALE = 0.5
export const MAX_SCALE = 2

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d
const clampScale = (n: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, n))

/** 현재 템플릿·비율에 맞는 조정값만 돌려준다 (다르면 빈 값) */
export function activeEdits(page: CardPage, aspect: AspectId): Record<string, LayoutEdit> {
  const edits = page.layoutEdits
  return edits && edits.template === page.template && edits.aspect === aspect ? edits.items : {}
}

/** JSON 불러오기용: 형식이 맞지 않는 조정값은 버린다 */
export function sanitizeEdits(value: unknown): PageLayoutEdits | undefined {
  const v = value as PageLayoutEdits | undefined
  if (!v || typeof v !== 'object' || !v.items || typeof v.items !== 'object') return undefined
  const items: Record<string, LayoutEdit> = {}
  for (const [key, e] of Object.entries(v.items)) {
    if (e && Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.s)) {
      items[key] = { x: e.x, y: e.y, s: clampScale(e.s) }
      if (Number.isFinite(e.f) && e.f !== 1) items[key].f = clampScale(e.f as number)
      if (e.hide === true) items[key].hide = true
      if (typeof e.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(e.color)) items[key].color = e.color
      if (typeof e.font === 'string' && e.font.length < 80) items[key].font = e.font
      if (e.weight === 500 || e.weight === 800) items[key].weight = e.weight
      if (Number.isFinite(e.w) && (e.w as number) > 0 && (e.w as number) < 3000) items[key].w = e.w
      if (e.align === 'left' || e.align === 'center' || e.align === 'right') items[key].align = e.align
      if (Number.isFinite(e.lh) && (e.lh as number) >= 0.6 && (e.lh as number) <= 3) items[key].lh = e.lh
      if (typeof e.rich === 'string' && typeof e.richSrc === 'string') { items[key].rich = e.rich; items[key].richSrc = e.richSrc }
      if (Number.isFinite(e.h) && (e.h as number) > 0 && (e.h as number) < 3000) items[key].h = e.h
      if (e.icons && typeof e.icons === 'object') {
        const icons = Object.fromEntries(Object.entries(e.icons).filter(([i, n]) => /^\d+$/.test(i) && typeof n === 'string' && n.length < 40))
        if (Object.keys(icons).length) items[key].icons = icons
      }
    }
  }
  return { template: v.template, aspect: v.aspect, items }
}

/** 요소 하나의 조정값을 patch 로 바꾼 페이지 조정값. 기본값과 같아진 요소는 지우고, 남은 게 없으면 undefined */
export function withEdit(page: CardPage, aspect: AspectId, key: string, patch: Partial<LayoutEdit>): PageLayoutEdits | undefined {
  const items = { ...activeEdits(page, aspect) }
  const e: LayoutEdit = { ...(items[key] ?? { x: 0, y: 0, s: 1 }), ...patch }
  const clean: LayoutEdit = { x: round(e.x), y: round(e.y), s: round(clampScale(e.s), 3) }
  const f = round(clampScale(e.f ?? 1), 2)
  if (f !== 1) clean.f = f
  if (e.hide) clean.hide = true
  if (e.color) clean.color = e.color
  if (e.font) clean.font = e.font
  if (e.weight) clean.weight = e.weight
  if (e.icons && Object.keys(e.icons).length) clean.icons = e.icons
  if (e.w && e.w > 0) clean.w = Math.max(8, Math.round(e.w))
  if (e.h && e.h > 0) clean.h = Math.max(8, Math.round(e.h))
  if (e.align) clean.align = e.align
  if (e.lh) clean.lh = Math.round(e.lh * 100) / 100
  if (e.rich && e.richSrc !== undefined) { clean.rich = e.rich; clean.richSrc = e.richSrc }
  const hasStyle = clean.f || clean.hide || clean.color || clean.font || clean.weight || clean.icons || clean.w || clean.h || clean.align || clean.lh || clean.rich
  if (Math.abs(clean.x) < 0.5 && Math.abs(clean.y) < 0.5 && clean.s === 1 && !hasStyle) delete items[key]
  else items[key] = clean
  return Object.keys(items).length ? { template: page.template, aspect, items } : undefined
}

/**
 * parent 의 직계 자식과 그 키.
 * 키 = 태그 + 첫 고정 클래스 + 같은 키 안의 순번. 제목 길이에 따라 바뀌는 title-/body- 밀도 클래스는 키에서 뺀다.
 */
export function editableChildren(parent: Element): Map<string, HTMLElement> {
  const map = new Map<string, HTMLElement>()
  const seen: Record<string, number> = {}
  for (const child of Array.from(parent.children) as HTMLElement[]) {
    if (child.hasAttribute('data-icon-swap') || child.hasAttribute('data-rich-content')) continue // 아이콘 바꾸기·부분 서식으로 넣은 노드는 키 순번에서 뺀다
    const cls = Array.from(child.classList).find(c => !/^(title|body)-/.test(c))
    const base = child.tagName.toLowerCase() + (cls ? `.${cls}` : '')
    seen[base] = (seen[base] ?? -1) + 1
    map.set(`${base}#${seen[base]}`, child)
  }
  return map
}

/**
 * 요소 키 = .layout 에서 요소까지 각 단계 키를 '>' 로 이은 경로.
 * .layout 직계 자식은 한 단계라 기존 저장값과 같다.
 */
export function keyOf(layout: Element, el: Element): string | null {
  const path: string[] = []
  let node: Element | null = el
  while (node && node !== layout) {
    const parent: Element | null = node.parentElement
    if (!parent) return null
    const found = Array.from(editableChildren(parent)).find(([, c]) => c === node)
    if (!found) return null
    path.unshift(found[0])
    node = parent
  }
  return node === layout && path.length ? path.join('>') : null
}

/** 키로 요소 찾기 */
export function resolveKey(layout: Element, key: string): HTMLElement | undefined {
  let node: Element | undefined = layout
  for (const seg of key.split('>')) node = node && editableChildren(node).get(seg)
  return node as HTMLElement | undefined
}

export const layoutOf = (canvas: Element | null) => canvas?.querySelector(':scope > .layout') ?? null

/** 조정값을 뺀 원래 모습의 박스 (1080 기준 캔버스 좌표, 요소 자체 transform 포함) */
export function measureBase(el: HTMLElement, canvas: HTMLElement): Box {
  const { translate, scale } = el.style
  el.style.translate = ''
  el.style.scale = ''
  const r = el.getBoundingClientRect()
  const c = canvas.getBoundingClientRect()
  const k = c.width / canvas.offsetWidth || 1
  el.style.translate = translate
  el.style.scale = scale
  return { x: (r.left - c.left) / k, y: (r.top - c.top) / k, w: r.width / k, h: r.height / k }
}

/** 지금 보이는 모습 그대로의 박스 (1080 기준 캔버스 좌표, 조정값 포함) */
export function visualBox(el: Element, canvas: HTMLElement): Box {
  const r = el.getBoundingClientRect()
  const c = canvas.getBoundingClientRect()
  const k = c.width / canvas.offsetWidth || 1
  return { x: (r.left - c.left) / k, y: (r.top - c.top) / k, w: r.width / k, h: r.height / k }
}

const topLeft = visualBox

/**
 * CSS 개별 transform 속성(translate/scale)으로 적용한다.
 * 문서 흐름을 바꾸지 않아 다른 요소가 밀리지 않고, 요소에 원래 있던 transform(회전 등)도 그대로 남는다.
 * scale 을 먼저 넣고 박스 왼쪽 위가 (base + x, base + y)에 오도록 translate 를 잰 값으로 보정한다.
 * 안쪽 요소는 조상이 확대돼 있으면 translate 1px 이 1px 이 아니므로, 100px 옮겨 보고 비율(k)을 구한다.
 */
export function applyEdit(el: HTMLElement, canvas: HTMLElement, edit?: LayoutEdit) {
  el.style.translate = ''
  el.style.scale = ''
  if (!edit) return
  const base = measureBase(el, canvas)
  el.style.scale = String(edit.s)
  const p0 = topLeft(el, canvas)
  el.style.translate = '100px 100px'
  const p1 = topLeft(el, canvas)
  const kx = (p1.x - p0.x) / 100 || 1
  const ky = (p1.y - p0.y) / 100 || 1
  el.style.translate = `${(base.x + edit.x - p0.x) / kx}px ${(base.y + edit.y - p0.y) / ky}px`
}

const htmlNodes = (root: Element) =>
  Array.from(root.querySelectorAll('*')).filter((n): n is HTMLElement => n instanceof HTMLElement)

/** 글자 크기 수정 전 상태로 되돌린다. 그 사이 React 가 값을 바꿨으면 React 값을 둔다 */
function restoreFonts(nodes: HTMLElement[]) {
  for (const n of nodes) {
    if (n.dataset.fs === undefined) continue
    if (n.style.fontSize === n.dataset.fsSet) n.style.fontSize = n.dataset.fs
    delete n.dataset.fs
    delete n.dataset.fsSet
  }
}

/**
 * 글자 크기 배율: 요소와 그 안 모든 태그의 지금 글자 크기(px)에 f 를 곱해 inline 으로 넣는다.
 * 원래 inline 값은 처음 한 번만 data-fs 에 보관한다 (바깥·안쪽 요소를 둘 다 키우면 곱해진다).
 */
function scaleFont(el: HTMLElement, f: number) {
  const nodes = [el, ...htmlNodes(el)]
  const sizes = nodes.map(n => parseFloat(getComputedStyle(n).fontSize))
  nodes.forEach((n, i) => {
    if (n.dataset.fs === undefined) n.dataset.fs = n.style.fontSize
    n.style.fontSize = `${sizes[i] * f}px`
    n.dataset.fsSet = n.style.fontSize
  })
}

/**
 * 항목을 원래 디자인 개수보다 늘린 컨테이너([data-extended])가 카드 아래로 넘치면 CSS zoom 으로 5%씩 줄인다 (최소 60%).
 * 넘침 판단: .layout 의 흐름 안 자식 아래 끝이 안쪽 여백선을 넘거나, 컨테이너 조상 중 높이가 정해진 상자가 넘칠 때.
 * zoom 을 건 요소의 offsetHeight 는 줄기 전 값이 나오므로 직접 곱한다. 원래 개수 이하 페이지는 건드리지 않는다.
 */
export function fitExtended(layout: Element) {
  layout.querySelectorAll<HTMLElement>('[data-fit]').forEach(el => { el.style.zoom = ''; delete el.dataset.fit })
  const targets = Array.from(layout.querySelectorAll<HTMLElement>('[data-extended]'))
  if (!targets.length || !(layout instanceof HTMLElement)) return
  const overflows = () => {
    const limit = layout.clientHeight - parseFloat(getComputedStyle(layout).paddingBottom)
    for (const child of Array.from(layout.children) as HTMLElement[]) {
      if (/absolute|fixed/.test(getComputedStyle(child).position)) continue
      if (child.offsetTop + child.offsetHeight * (parseFloat(child.style.zoom) || 1) > limit + 1) return true
    }
    return targets.some(t => {
      for (let a = t.parentElement; a && a !== layout; a = a.parentElement) if (a.scrollHeight > a.clientHeight + 1) return true
      return false
    })
  }
  for (let z = 0.95; z >= 0.6 && overflows(); z -= 0.05) {
    targets.forEach(t => { t.style.zoom = z.toFixed(2); t.dataset.fit = '' })
  }
}

/**
 * 상자 너비·높이를 inline 으로 넣는다 (원래 inline 값은 data-sized 에 보관). 너비가 바뀌면 글자가 새 너비에 맞춰 줄바꿈된다.
 * 드래그 중 미리보기에서도 쓴다.
 */
export function setBoxSize(el: HTMLElement, w?: number, h?: number) {
  if (w === undefined && h === undefined) return
  if (el.dataset.sized === undefined) el.dataset.sized = JSON.stringify({ w: el.style.width, h: el.style.height, mw: el.style.maxWidth, mh: el.style.minHeight })
  if (w !== undefined) { el.style.width = `${w}px`; el.style.maxWidth = 'none' }
  if (h !== undefined) { el.style.height = `${h}px`; el.style.minHeight = '0' }
}

/**
 * 크기를 바꾼 조정값을 만든다. 보이는 왼쪽 위 모서리는 제자리에 둔다
 * (너비가 바뀌면 가운데 정렬 등으로 원래 자리가 움직일 수 있어, 크기를 넣고 원래 자리를 다시 잰다)
 */
export function resizedEdit(el: HTMLElement, canvas: HTMLElement, edit: LayoutEdit, size: { w?: number; h?: number }): LayoutEdit {
  const before = visualBox(el, canvas)
  setBoxSize(el, size.w, size.h)
  const nb = measureBase(el, canvas)
  return { ...edit, ...size, x: before.x - nb.x, y: before.y - nb.y }
}

function restoreBoxSizes(nodes: HTMLElement[]) {
  for (const n of nodes) {
    if (n.dataset.sized === undefined) continue
    const o = JSON.parse(n.dataset.sized) as { w: string; h: string; mw: string; mh: string }
    n.style.width = o.w
    n.style.height = o.h
    n.style.maxWidth = o.mw
    n.style.minHeight = o.mh
    delete n.dataset.sized
  }
}

/** 글자만 들어 있는 요소인지 (글자·줄바꿈만, 다른 태그 없음) — 부분 서식은 이런 요소에만 적용 */
export function isTextLeaf(el: Element) {
  let hasText = false
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE) { if (n.textContent?.trim()) hasText = true; continue }
    if (n instanceof HTMLElement && (n.tagName === 'BR' || n.dataset.richContent !== undefined)) continue
    return false
  }
  return hasText
}

/** 부분 서식을 넣기 전의 원래 글자 (부분 서식 노드 제외) */
export function leafText(el: Element) {
  return Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent ?? '').join('')
}

/** 부분 서식 되돌리기: 넣은 노드를 지우고 원래 글자 크기로 */
function restoreRich(layout: Element) {
  layout.querySelectorAll('[data-rich-content]').forEach(n => n.remove())
  layout.querySelectorAll<HTMLElement>('[data-rich]').forEach(el => { el.style.fontSize = el.dataset.rich ?? ''; delete el.dataset.rich })
}

/**
 * 부분 서식 적용: 원래 글자는 React 가 관리하므로 지우지 않고 글자 크기 0 으로 숨긴 뒤, 서식이 든 글자를 뒤에 붙인다.
 * 원래 크기·자간은 붙인 노드에 옮겨 준다. 원고가 바뀌어 원래 글자가 richSrc 와 다르면 적용하지 않는다.
 */
function applyRich(el: HTMLElement, edit: LayoutEdit) {
  if (!edit.rich || !isTextLeaf(el) || leafText(el) !== edit.richSrc) return
  const cs = getComputedStyle(el)
  const span = document.createElement('span')
  span.dataset.richContent = ''
  span.style.fontSize = cs.fontSize
  span.style.letterSpacing = cs.letterSpacing
  span.style.wordSpacing = cs.wordSpacing
  span.innerHTML = sanitizeRich(edit.rich)
  el.dataset.rich = el.style.fontSize
  el.style.fontSize = '0'
  el.appendChild(span)
}

/** 글자 모양 수정 전으로 되돌린다 (data-tstyle 에 보관한 원래 inline 값) */
function restoreTextStyles(nodes: HTMLElement[]) {
  for (const n of nodes) {
    if (n.dataset.tstyle === undefined) continue
    const o = JSON.parse(n.dataset.tstyle) as { c: string; f: string; w: string; a: string; l: string }
    n.style.color = o.c
    n.style.fontFamily = o.f
    n.style.fontWeight = o.w
    n.style.textAlign = o.a
    n.style.lineHeight = o.l
    delete n.dataset.tstyle
  }
}

/**
 * 글자 모양(글씨색·글꼴·굵기)을 요소와 그 안의 모든 태그에 넣는다. 안쪽 글자에 따로 지정된 색·굵기까지 덮어야 선택한 대로 보인다.
 * 부분만 바꾸려면 더블클릭으로 안쪽 요소를 골라 따로 지정한다 (바깥 요소부터 적용되므로 안쪽 지정이 이긴다).
 */
function styleText(el: HTMLElement, edit: LayoutEdit) {
  if (!edit.color && !edit.font && !edit.weight && !edit.align && !edit.lh) return
  for (const n of [el, ...htmlNodes(el)]) {
    if (n !== el && n.closest('[data-rich-content]')) continue // 부분 서식으로 따로 지정한 색·글꼴은 지킨다
    if (n.dataset.tstyle === undefined) n.dataset.tstyle = JSON.stringify({ c: n.style.color, f: n.style.fontFamily, w: n.style.fontWeight, a: n.style.textAlign, l: n.style.lineHeight })
    if (edit.align) n.style.textAlign = edit.align
    if (edit.lh) n.style.lineHeight = String(edit.lh)
    if (edit.color) n.style.color = edit.color
    if (edit.font) n.style.fontFamily = edit.font
    if (edit.weight) n.style.fontWeight = String(edit.weight)
  }
}

/**
 * 캔버스 한 장에 페이지 조정값 전체를 적용 (조정값 없는 요소는 원래대로 되돌림).
 * 글자 크기가 흐름을 바꾸므로 먼저 전부 적용한 뒤 위치를 잰다. 바깥 요소부터 적용해 안쪽 요소는 바깥 요소가 옮겨진 자리 기준이 된다.
 */
export function applyPageEdits(canvas: HTMLElement, edits: Record<string, LayoutEdit>) {
  const layout = layoutOf(canvas)
  if (!layout) return
  restoreRich(layout)
  const all = htmlNodes(layout)
  restoreFonts(all)
  restoreTextStyles(all)
  restoreBoxSizes(all)
  for (const n of all) {
    if (n.style.translate) n.style.translate = ''
    if (n.style.scale) n.style.scale = ''
    if (n.dataset.hidden !== undefined) { n.style.visibility = ''; delete n.dataset.hidden }
  }
  const targets = Object.entries(edits)
    .sort(([a], [b]) => a.split('>').length - b.split('>').length)
    .map(([key, edit]) => [resolveKey(layout, key), edit] as const)
    .filter((t): t is readonly [HTMLElement, LayoutEdit] => t[0] instanceof HTMLElement)
  targets.forEach(([el, edit]) => applyRich(el, edit))
  targets.forEach(([el, edit]) => { if (edit.f) scaleFont(el, edit.f) })
  targets.forEach(([el, edit]) => styleText(el, edit))
  targets.forEach(([el, edit]) => setBoxSize(el, edit.w, edit.h))
  fitExtended(layout)
  targets.forEach(([el, edit]) => applyEdit(el, canvas, edit))
  // 삭제한 요소는 자리를 비워 두고 안 보이게 한다 (다른 요소가 밀려 움직이지 않도록 display 대신 visibility)
  targets.forEach(([el, edit]) => { if (edit.hide) { el.style.visibility = 'hidden'; el.dataset.hidden = '' } })
}
