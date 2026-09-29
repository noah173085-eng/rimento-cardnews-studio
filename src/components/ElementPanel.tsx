import { useLayoutEffect, useState } from 'react'
import { ArrowUpLeft, Minus, Plus, RotateCcw } from 'lucide-react'
import { AspectId, CardPage } from '../types'
import { activeEdits, editableChildren, layoutOf, resolveKey, withEdit } from '../lib/layoutEdits'
import { textSlots } from '../lib/textEdits'

/** 원고 필드: 문자열 = 페이지 필드, 숫자 = items 순번 */
type Field = 'eyebrow' | 'title' | 'body' | 'note' | number

const fieldLabel = { eyebrow: '상단 라벨', title: '제목', body: '본문', note: '하단 메모/CTA' }

const norm = (s: string) => s.replace(/\s+/g, '')

/**
 * 글자 조각이 원고 필드에서 왔는지 판단한다.
 * 필드 전체·줄·'라벨|설명' 조각과 같거나, 4자 이상이면서 필드 안에 들어 있으면 그 필드로 본다.
 */
function fromField(text: string, value: string) {
  const t = norm(text)
  const whole = norm(value)
  if (!t || !whole) return false
  return whole === t || value.split(/[\n|]/).map(norm).includes(t) || (t.length >= 4 && whole.includes(t))
}

/** 요소 안 글자를 원고 필드(입력칸으로 수정)와 템플릿 문구(덮어쓰기로 수정)로 나눈다 */
function splitTexts(layout: Element, key: string, page: CardPage) {
  // 문구 수정 id 는 .layout 직계 자식 기준이므로, 바깥 요소에서 찾은 뒤 선택한 요소 안의 것만 남긴다
  const top = key.split('>')[0]
  const topEl = editableChildren(layout).get(top)
  const el = resolveKey(layout, key)
  const slots = topEl && el ? textSlots(page.template, top, topEl).filter(s => el.contains(s.node)) : []
  const candidates: [Field, string][] = [
    ['eyebrow', page.eyebrow], ['title', page.title], ['body', page.body], ['note', page.note],
    ...page.items.map((v, i): [Field, string] => [i, v]),
  ]
  return {
    fields: candidates.filter(([, v]) => slots.some(s => fromField(s.original, v))).map(([field]) => field),
    fixed: slots.filter(s => !candidates.some(([, v]) => fromField(s.original, v))).map(({ id, original }) => ({ id, original })),
  }
}

/** 키 마지막 단계를 읽기 쉬운 이름으로: 'div.question-item#2' → 'question-item 3' */
function elementName(key: string) {
  const m = key.split('>').pop()?.match(/^(\w+)(?:\.([\w-]+))?#(\d+)$/)
  return m ? `${m[2] ?? m[1]} ${Number(m[3]) + 1}` : key
}

/**
 * ElementPanel 컴포넌트 — 레이아웃 편집에서 선택한 요소의 글자 크기와 텍스트를 수정
 *
 * Props:
 * @param {string} canvasId - 미리보기 CardCanvas 의 DOM id [Required]
 * @param {CardPage} page - 현재 페이지 [Required]
 * @param {AspectId} aspect - 현재 비율 [Required]
 * @param {string} elementKey - 선택된 요소 키 (keyOf 경로) [Required]
 * @param {function} onSelect - 다른 요소 선택 콜백 (상위 요소 이동용) [Required]
 * @param {function} onChange - 페이지 수정 콜백 (patch 전달) [Required]
 *
 * Example usage:
 * <ElementPanel canvasId="card-preview" page={page} aspect="4:5" elementKey={key} onSelect={setKey} onChange={updatePage}/>
 */
interface Props {
  canvasId: string
  page: CardPage
  aspect: AspectId
  elementKey: string
  onSelect: (key: string) => void
  onChange: (patch: Partial<CardPage>) => void
}

export function ElementPanel({ canvasId, page, aspect, elementKey, onSelect, onChange }: Props) {
  const path = elementKey.split('>')
  const [texts, setTexts] = useState<ReturnType<typeof splitTexts>>({ fields: [], fixed: [] })
  const { fields, fixed } = texts
  const f = activeEdits(page, aspect)[elementKey]?.f ?? 1

  // 선택이 바뀔 때만 다시 찾는다 (입력 중 글자를 지워도 입력칸이 사라지지 않도록)
  useLayoutEffect(() => {
    const layout = layoutOf(document.getElementById(canvasId))
    setTexts(layout ? splitTexts(layout, elementKey, page) : { fields: [], fixed: [] })
  }, [canvasId, elementKey, page.id, page.template, aspect])

  const setFixed = (id: string, original: string, value: string) => {
    const next = { ...page.textEdits }
    if (value === original) delete next[id]
    else next[id] = value
    onChange({ textEdits: Object.keys(next).length ? next : undefined })
  }

  const setFont = (next: number) => onChange({ layoutEdits: withEdit(page, aspect, elementKey, { f: next }) })

  const setText = (field: Field, value: string) => {
    if (typeof field === 'number') onChange({ items: page.items.map((v, i) => i === field ? value : v) })
    else onChange({ [field]: value })
  }

  return <section className="element-panel">
    <div className="section-head"><h3>선택한 요소</h3><span className="badge">{path.length}단계 · {elementName(elementKey)}</span></div>
    <div className="element-nav">
      <button onClick={() => onSelect(path.slice(0, -1).join('>'))} disabled={path.length === 1}><ArrowUpLeft size={15}/> 상위 요소</button>
      <span className="panel-hint">카드에서 더블클릭하면 안쪽 요소를 선택해요</span>
    </div>
    <div className="field-group">
      글자 크기
      <div className="font-stepper">
        <button onClick={() => setFont(f - 0.1)} disabled={f <= 0.5}><Minus size={15}/></button>
        <b>{Math.round(f * 100)}%</b>
        <button onClick={() => setFont(f + 0.1)} disabled={f >= 2}><Plus size={15}/></button>
        <button onClick={() => setFont(1)} disabled={f === 1} title="원래 크기"><RotateCcw size={15}/></button>
      </div>
    </div>
    {fields.length === 0 && fixed.length === 0 && <p className="panel-hint">이 요소에는 수정할 텍스트가 없어요.</p>}
    {fields.map(field => {
      const isItem = typeof field === 'number'
      const value = isItem ? page.items[field] ?? '' : page[field]
      const label = isItem ? `항목 ${field + 1}` : fieldLabel[field]
      return <label key={String(field)}>{label}
        {field === 'eyebrow'
          ? <input value={value} onChange={e => setText(field, e.target.value)}/>
          : <textarea className="short" value={value} onChange={e => setText(field, e.target.value)}/>}
      </label>
    })}
    {fixed.map(({ id, original }) => <label key={id}>템플릿 문구 <span className="hint">원래: {original}</span>
      <input value={page.textEdits?.[id] ?? original} onChange={e => setFixed(id, original, e.target.value)}/>
    </label>)}
  </section>
}
