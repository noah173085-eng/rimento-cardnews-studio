import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Bold, Eraser } from 'lucide-react'
import { FreeItem } from '../types'
import { fontOptions, sanitizeRich, textToHtml } from '../lib/richText'

const sizes = [14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 72, 88, 104, 120]
type StyleProp = 'color' | 'font-size' | 'font-family' | 'font-weight'

/**
 * RichTextEditor 컴포넌트 — 텍스트 박스 내용 편집 + 선택한 부분만 글꼴·크기·색·굵기 바꾸기
 * 카드와 같은 비율로 줄여 보여준다(zoom). 크기는 카드 기준 px 로 저장된다.
 *
 * Props:
 * @param {FreeItem} item - 편집할 텍스트 박스 [Required]
 * @param {function} onChange - 내용 변경 콜백 ({ html, text }) [Required]
 *
 * Example usage:
 * <RichTextEditor item={item} onChange={patch => updateFree(item.id, patch)}/>
 */
export function RichTextEditor({ item, onChange }: { item: FreeItem; onChange: (patch: Partial<FreeItem>) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const saved = useRef<Range | null>(null)
  const [hasSelection, setHasSelection] = useState(false)
  const [color, setColor] = useState('#6d3fd1')
  const html = item.html ?? textToHtml(item.text ?? '')
  const zoom = Math.min(1, 248 / item.w) // 편집 칸 안쪽 폭(약 250px)에 맞춤

  // 바깥에서 내용이 바뀐 경우(다른 요소 선택·되돌리기)에만 편집기를 다시 채운다. 입력 중에 다시 채우면 커서가 튄다
  useLayoutEffect(() => {
    const el = ref.current
    if (el && el.innerHTML !== html) el.innerHTML = sanitizeRich(html)
  }, [item.id, html])

  // 편집기 안에서 고른 범위를 기억한다 (글꼴 목록·색 선택을 누르면 선택이 편집기 밖으로 나가므로)
  useEffect(() => {
    const onSelect = () => {
      const s = window.getSelection()
      const el = ref.current
      if (!s?.rangeCount || !el) return
      const r = s.getRangeAt(0)
      if (!el.contains(r.commonAncestorContainer)) return
      saved.current = r.cloneRange()
      setHasSelection(!r.collapsed)
    }
    document.addEventListener('selectionchange', onSelect)
    return () => document.removeEventListener('selectionchange', onSelect)
  }, [])

  const emit = () => {
    const el = ref.current
    if (!el) return
    el.querySelectorAll('span').forEach(s => { if (!s.textContent) s.remove() })
    onChange({ html: el.innerHTML, text: el.innerText })
  }

  const select = (node: Node) => {
    const r = document.createRange()
    r.selectNodeContents(node)
    const s = window.getSelection()
    s?.removeAllRanges()
    s?.addRange(r)
    saved.current = r
  }

  /** 선택 범위를 <span style> 로 감싸 스타일을 준다. 이미 한 span 전체를 고른 상태면 그 span 만 고친다 (중첩 방지) */
  const apply = (prop: StyleProp, value: string) => {
    const el = ref.current
    const r = saved.current
    if (!el || !r || r.collapsed || !el.contains(r.commonAncestorContainer)) return
    const c = r.startContainer
    let span: HTMLElement
    if (c === r.endContainer && c instanceof HTMLElement && c.tagName === 'SPAN' && r.startOffset === 0 && r.endOffset === c.childNodes.length) {
      span = c
    } else {
      span = document.createElement('span')
      span.appendChild(r.extractContents())
      r.insertNode(span)
    }
    // 안쪽에 같은 속성이 남아 있으면 새 값이 가려지므로 지운다
    span.querySelectorAll<HTMLElement>('span').forEach(s => s.style.removeProperty(prop))
    if (value) span.style.setProperty(prop, value)
    else span.style.removeProperty(prop)
    select(span)
    emit()
  }

  const toggleBold = () => {
    const r = saved.current
    if (!r) return
    const node = r.startContainer.nodeType === Node.TEXT_NODE ? r.startContainer.parentElement : r.startContainer as Element
    const isBold = node ? parseInt(getComputedStyle(node).fontWeight) >= 700 : false
    apply('font-weight', isBold ? '500' : '800')
  }

  /** 선택한 부분의 서식을 지우고 글자만 남긴다 */
  const clearFormat = () => {
    const el = ref.current
    const r = saved.current
    if (!el || !r || r.collapsed || !el.contains(r.commonAncestorContainer)) return
    const text = document.createTextNode(r.toString())
    r.deleteContents()
    r.insertNode(text)
    select(text)
    emit()
  }

  const keep = (e: React.MouseEvent) => e.preventDefault() // 버튼을 눌러도 편집기의 선택이 풀리지 않게

  return <div className="field-group">
    텍스트 <span className="hint">글자 일부를 드래그로 선택 → 아래에서 그 부분만 서식</span>
    <div className="rich-box">
      <div ref={ref} className="rich-editor" contentEditable suppressContentEditableWarning spellCheck={false}
        style={{ zoom, width: item.w, fontSize: item.fontSize ?? 40, fontWeight: item.isBold ? 800 : 500, fontFamily: item.fontFamily || undefined, textAlign: item.align, lineHeight: item.lineHeight ?? 1.4, color: item.color }}
        onInput={emit}
        onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')) }}/>
    </div>
    <div className={`rich-toolbar ${hasSelection ? '' : 'is-idle'}`} title={hasSelection ? '' : '먼저 위에서 글자를 선택하세요'}>
      <select value="" onChange={e => apply('font-family', e.target.value.slice(2))} title="선택 부분 글꼴">
        <option value="" disabled>글꼴</option>
        {fontOptions.map(o => <option key={o.label} value={`f:${o.value}`}>{o.label}</option>)}
      </select>
      <select value="" onChange={e => apply('font-size', `${e.target.value}px`)} title="선택 부분 크기 (카드 기준 px)">
        <option value="" disabled>크기</option>
        {sizes.map(v => <option key={v} value={v}>{v}px</option>)}
      </select>
      <input type="color" value={color} onChange={e => { setColor(e.target.value); apply('color', e.target.value) }} title="선택 부분 글씨색"/>
      <button onMouseDown={keep} onClick={toggleBold} title="선택 부분 굵게/보통"><Bold size={15}/></button>
      <button onMouseDown={keep} onClick={clearFormat} title="선택 부분 서식 지우기"><Eraser size={15}/></button>
    </div>
  </div>
}
