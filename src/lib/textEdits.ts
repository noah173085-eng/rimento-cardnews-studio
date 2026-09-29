import { TemplateId } from '../types'
import { editableChildren, layoutOf } from './layoutEdits'

/** 덮어쓴 글자 조각: React 가 그린 원래 글자와 우리가 넣은 글자 */
const applied = new WeakMap<Text, { orig: string; set: string }>()

/** React 가 그린 원래 글자. 덮어쓴 뒤 React 가 값을 바꿨으면 React 값이 원래 글자다 */
function originalText(node: Text): string {
  const a = applied.get(node)
  return a && node.nodeValue === a.set ? a.orig : node.nodeValue ?? ''
}

export interface TextSlot { id: string; node: Text; original: string }

/**
 * 요소 안 글자 조각 목록. id = 템플릿/요소키/원래 글자#같은 글자 순번.
 * 원래 글자가 id 에 들어가므로 원고가 바뀌어 글자가 달라지면 수정값은 조용히 적용되지 않는다.
 */
export function textSlots(template: TemplateId, key: string, el: HTMLElement): TextSlot[] {
  const slots: TextSlot[] = []
  const seen: Record<string, number> = {}
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const original = originalText(node)
    if (!original.trim()) continue
    seen[original] = (seen[original] ?? -1) + 1
    slots.push({ id: `${template}/${key}/${original}#${seen[original]}`, node, original })
  }
  return slots
}

/** 캔버스 한 장에 템플릿 문구 수정값을 적용 (수정값 없는 조각은 원래 글자로 되돌림) */
export function applyTextEdits(canvas: HTMLElement, template: TemplateId, edits: Record<string, string> = {}) {
  const layout = layoutOf(canvas)
  if (!layout) return
  editableChildren(layout).forEach((el, key) => {
    for (const { id, node, original } of textSlots(template, key, el)) {
      const next = edits[id]
      if (next === undefined) {
        if (node.nodeValue !== original) node.nodeValue = original
        applied.delete(node)
      } else {
        node.nodeValue = next
        applied.set(node, { orig: original, set: next })
      }
    }
  })
}

/** JSON 불러오기용: 문자열 값만 남긴다 */
export function sanitizeTextEdits(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') return undefined
  const entries = Object.entries(value).filter(([, v]) => typeof v === 'string')
  return entries.length ? Object.fromEntries(entries) : undefined
}
