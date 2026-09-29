import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { LayoutEdit } from '../types'
import { iconMap } from './iconSet'
import { layoutOf, resolveKey } from './layoutEdits'

/**
 * 템플릿 아이콘 바꾸기.
 * 템플릿 아이콘(<svg class="lucide">)은 React 가 그린 노드라 직접 고치면 다음 갱신 때 충돌한다.
 * 그래서 원래 아이콘은 display:none 으로 숨기고, 바로 뒤에 새 아이콘을 끼워 넣는다 (그릴 때마다 지우고 다시 넣음).
 * 크기·선 굵기·클래스는 원래 아이콘에서 복사하므로 템플릿 CSS 와 색(currentColor)이 그대로 적용된다.
 */

/** 요소 안에서 바꿀 수 있는 아이콘 목록 (끼워 넣은 아이콘 제외, 순서 = 저장 순번) */
export const iconSlots = (el: Element) => Array.from(el.querySelectorAll<SVGSVGElement>('svg.lucide:not([data-icon-swap])'))

const markupCache = new Map<string, string>()

/** 아이콘 이름 → 새 <svg> (한 번 만든 마크업은 저장해 두고 복제) */
export function iconSvg(name: string): SVGSVGElement | null {
  const Icon = iconMap[name]
  if (!Icon) return null
  if (!markupCache.has(name)) markupCache.set(name, renderToStaticMarkup(createElement(Icon)))
  const t = document.createElement('template')
  t.innerHTML = markupCache.get(name)!
  return t.content.firstElementChild as SVGSVGElement | null
}

/** 캔버스 한 장에 아이콘 바꾸기를 적용 (이전에 넣은 아이콘은 지우고 원래 아이콘을 다시 보이게 한 뒤) */
export function applyIconSwaps(canvas: HTMLElement, edits: Record<string, LayoutEdit>) {
  const layout = layoutOf(canvas)
  if (!layout) return
  layout.querySelectorAll('[data-icon-swap]').forEach(n => n.remove())
  layout.querySelectorAll<SVGSVGElement>('svg[data-icon-hidden]').forEach(s => { s.style.display = ''; s.removeAttribute('data-icon-hidden') })
  // 같은 아이콘을 바깥 요소와 안쪽 요소에서 모두 바꿨다면 안쪽(더 구체적인) 지정이 이긴다
  const entries = Object.entries(edits).sort(([a], [b]) => b.split('>').length - a.split('>').length)
  for (const [key, edit] of entries) {
    if (!edit.icons) continue
    const el = resolveKey(layout, key)
    if (!el) continue
    const slots = iconSlots(el)
    for (const [index, name] of Object.entries(edit.icons)) {
      const original = slots[+index]
      const next = iconSvg(name)
      if (!original || !next || original.hasAttribute('data-icon-hidden')) continue
      for (const attr of ['width', 'height', 'stroke-width', 'class', 'style']) {
        const v = original.getAttribute(attr)
        if (v !== null) next.setAttribute(attr, attr === 'style' ? v.replace(/display\s*:\s*none;?/, '') : v)
      }
      next.setAttribute('data-icon-swap', '')
      original.style.display = 'none'
      original.setAttribute('data-icon-hidden', '')
      original.after(next)
    }
  }
}
