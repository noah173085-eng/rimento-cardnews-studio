import { AspectId, CardPage, LayoutEdit, PageLayoutEdits } from '../types'

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
  if (Math.abs(clean.x) < 0.5 && Math.abs(clean.y) < 0.5 && clean.s === 1 && !clean.f) delete items[key]
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

/** 지금 모습 그대로의 박스 왼쪽 위 (1080 기준 캔버스 좌표) */
function topLeft(el: HTMLElement, canvas: HTMLElement) {
  const r = el.getBoundingClientRect()
  const c = canvas.getBoundingClientRect()
  const k = c.width / canvas.offsetWidth || 1
  return { x: (r.left - c.left) / k, y: (r.top - c.top) / k }
}

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
 * 캔버스 한 장에 페이지 조정값 전체를 적용 (조정값 없는 요소는 원래대로 되돌림).
 * 글자 크기가 흐름을 바꾸므로 먼저 전부 적용한 뒤 위치를 잰다. 바깥 요소부터 적용해 안쪽 요소는 바깥 요소가 옮겨진 자리 기준이 된다.
 */
export function applyPageEdits(canvas: HTMLElement, edits: Record<string, LayoutEdit>) {
  const layout = layoutOf(canvas)
  if (!layout) return
  const all = htmlNodes(layout)
  restoreFonts(all)
  for (const n of all) {
    if (n.style.translate) n.style.translate = ''
    if (n.style.scale) n.style.scale = ''
  }
  const targets = Object.entries(edits)
    .sort(([a], [b]) => a.split('>').length - b.split('>').length)
    .map(([key, edit]) => [resolveKey(layout, key), edit] as const)
    .filter((t): t is readonly [HTMLElement, LayoutEdit] => t[0] instanceof HTMLElement)
  targets.forEach(([el, edit]) => { if (edit.f) scaleFont(el, edit.f) })
  targets.forEach(([el, edit]) => applyEdit(el, canvas, edit))
}
