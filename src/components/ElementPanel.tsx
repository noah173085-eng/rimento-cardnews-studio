import { useLayoutEffect, useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ArrowUpLeft, Minus, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { AspectId, CardPage, FreeItem, LayoutEdit } from '../types'
import { activeEdits, Box, editableChildren, isTextLeaf, layoutOf, leafText, resizedEdit, resolveKey, visualBox, withEdit } from '../lib/layoutEdits'
import { textSlots } from '../lib/textEdits'
import { AlignBar, AlignDir } from './AlignBar'
import { SizeFields } from './SizeFields'
import { fontOptions, textToHtml } from '../lib/richText'
import { RichTextEditor } from './RichTextEditor'
import { iconSet } from '../lib/iconSet'
import { iconSlots, iconSvg } from '../lib/iconSwap'

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
 * @param {function} onAlign - 카드 기준 정렬 콜백 [Required]
 * @param {function} onDelete - 요소 삭제(숨김) 콜백 [Required]
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
  onAlign: (dir: AlignDir) => void
  onDelete: () => void
}

export function ElementPanel({ canvasId, page, aspect, elementKey, onSelect, onChange, onAlign, onDelete }: Props) {
  const path = elementKey.split('>')
  const [texts, setTexts] = useState<ReturnType<typeof splitTexts>>({ fields: [], fixed: [] })
  const { fields, fixed } = texts
  const edit = activeEdits(page, aspect)[elementKey]
  const f = edit?.f ?? 1
  /** 글씨색 칸에 보여줄 지금 색 (지정하지 않았으면 템플릿 원래 색) */
  const [baseColor, setBaseColor] = useState('#000000')
  /** 요소 안 아이콘 미리보기(svg 마크업) · 바꾸기 창을 연 아이콘 순번 · 검색어 */
  const [icons, setIcons] = useState<string[]>([])
  const [openIcon, setOpenIcon] = useState<number | null>(null)
  const [iconQuery, setIconQuery] = useState('')
  /**
   * 글자만 든 요소(부분 서식 가능)의 정보: 원래 글자(src), 서식 없는 HTML(plainHtml), 편집기에 넘길 모양(editorItem),
   * 원고가 바뀌어 저장된 부분 서식이 안 맞는지(isStale). 글자만 든 요소가 아니면 null
   */
  const [leaf, setLeaf] = useState<{ src: string; plainHtml: string; isStale: boolean; editorItem: FreeItem } | null>(null)
  /** 줄간격 칸에 보여줄 지금 값 (지정하지 않았으면 템플릿 원래 값) */
  const [baseLh, setBaseLh] = useState(1.4)
  /** 지금 보이는 위치·크기 (px, 카드 1080 기준) */
  const [box, setBox] = useState<Box | null>(null)

  // 선택이 바뀔 때만 다시 찾는다 (입력 중 글자를 지워도 입력칸이 사라지지 않도록)
  useLayoutEffect(() => {
    const layout = layoutOf(document.getElementById(canvasId))
    setTexts(layout ? splitTexts(layout, elementKey, page) : { fields: [], fixed: [] })
    const el = layout ? resolveKey(layout, elementKey) : undefined
    const rgb = el ? getComputedStyle(el).color.match(/\d+/g) : null
    if (rgb && !edit?.color) setBaseColor('#' + rgb.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join(''))
  }, [canvasId, elementKey, page.id, page.template, aspect])

  // 아이콘 미리보기는 바꿀 때마다 다시 그린다 (카드가 먼저 그려진 뒤 실행됨)
  useLayoutEffect(() => {
    const layout = layoutOf(document.getElementById(canvasId))
    const el = layout ? resolveKey(layout, elementKey) : undefined
    setIcons(el ? iconSlots(el).slice(0, 12).map((svg, i) => (edit?.icons?.[i] && iconSvg(edit.icons[i])?.outerHTML) || svg.outerHTML) : [])
  }, [canvasId, elementKey, page, aspect])

  useLayoutEffect(() => setOpenIcon(null), [elementKey])

  // 위치·크기 칸: 드래그·방향키·입력으로 바뀔 때마다 다시 잰다
  useLayoutEffect(() => {
    const canvas = document.getElementById(canvasId)
    const layout = layoutOf(canvas)
    const el = layout ? resolveKey(layout, elementKey) : undefined
    setBox(canvas && el ? visualBox(el, canvas) : null)
    if (!el) { setLeaf(null); return }
    const shown = el.querySelector<HTMLElement>('[data-rich-content]')
    const cs = getComputedStyle(shown ?? el)
    const fontSize = parseFloat(cs.fontSize) || 16
    const lhPx = parseFloat(cs.lineHeight)
    const lh = Number.isFinite(lhPx) ? Math.round((lhPx / fontSize) * 10) / 10 : 1.4
    if (!edit?.lh) setBaseLh(lh)
    if (!isTextLeaf(el)) { setLeaf(null); return }
    // 줄바꿈(<br>)까지 살린 원래 글자
    const lines = Array.from(el.childNodes).map(n => n.nodeType === Node.TEXT_NODE ? n.textContent ?? '' : (n as Element).tagName === 'BR' ? '\n' : '').join('')
    const src = leafText(el)
    const plainHtml = textToHtml(lines)
    const isStale = !!edit?.rich && edit.richSrc !== src
    const rgb = cs.color.match(/\d+/g)
    setLeaf({
      src, plainHtml, isStale,
      editorItem: {
        id: elementKey, kind: 'text', x: 0, y: 0, w: Math.max(40, el.offsetWidth),
        html: edit?.rich && !isStale ? edit.rich : plainHtml, text: lines,
        fontSize, fontFamily: cs.fontFamily, isBold: parseInt(cs.fontWeight) >= 700, lineHeight: lh,
        align: (['left', 'center', 'right'] as const).find(a => a === cs.textAlign),
        color: rgb ? '#' + rgb.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('') : undefined,
      },
    })
  }, [canvasId, elementKey, page, aspect])

  /** 부분 서식 편집기 저장: 원래 글자와 똑같아지면(서식·글자 변경 없음) 저장값을 지운다 */
  const setRich = (patch: Partial<FreeItem>) => {
    if (!leaf || patch.html === undefined) return
    setStyle(patch.html === leaf.plainHtml ? { rich: undefined, richSrc: undefined } : { rich: patch.html, richSrc: leaf.src })
  }

  /** 입력한 px 값 적용: X·Y 는 이동량으로, 너비·높이는 상자 크기로 바꾼다 (배율이 걸려 있으면 나눠서 저장) */
  const resize = (patch: { x?: number; y?: number; w?: number; h?: number }) => {
    const canvas = document.getElementById(canvasId)
    const layout = layoutOf(canvas)
    const el = layout ? resolveKey(layout, elementKey) : undefined
    if (!canvas || !el || !box) return
    const cur = edit ?? { x: 0, y: 0, s: 1 }
    let next = { ...cur }
    if (patch.w !== undefined || patch.h !== undefined) {
      next = resizedEdit(el, canvas, cur, { w: patch.w !== undefined ? patch.w / cur.s : cur.w, h: patch.h !== undefined ? patch.h / cur.s : cur.h })
    }
    if (patch.x !== undefined) next.x = cur.x + (patch.x - box.x)
    if (patch.y !== undefined) next.y = cur.y + (patch.y - box.y)
    onChange({ layoutEdits: withEdit(page, aspect, elementKey, next) })
  }

  const setIcon = (index: number, name: string | null) => {
    const next = { ...(edit?.icons ?? {}) }
    if (name) next[index] = name
    else delete next[index]
    setStyle({ icons: Object.keys(next).length ? next : undefined })
  }
  const q = iconQuery.trim().toLowerCase()
  const iconChoices = q ? iconSet.filter(i => (i.name + " " + i.tags).toLowerCase().includes(q)) : iconSet

  const setStyle = (patch: Partial<LayoutEdit>) =>
    onChange({ layoutEdits: withEdit(page, aspect, elementKey, patch) })

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
    {box && <SizeFields box={box} onChange={resize} onReset={edit?.w || edit?.h ? () => setStyle({ w: undefined, h: undefined }) : undefined}/>}
    <div className="field-group">
      글자 모양 <span className="hint">이 요소 안의 글자 전체 · 일부만은 더블클릭으로 안쪽을 골라서</span>
      <select value={edit?.font ?? ''} onChange={e => setStyle({ font: e.target.value || undefined })}>
        {fontOptions.map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
      </select>
      <div className="style-row">
        <input type="color" value={edit?.color ?? baseColor} onChange={e => setStyle({ color: e.target.value })} title="글씨색"/>
        <select value={edit?.weight ?? ''} onChange={e => setStyle({ weight: e.target.value ? +e.target.value : undefined })} title="굵기">
          <option value="">굵기: 원래대로</option>
          <option value="800">굵게</option>
          <option value="500">보통</option>
        </select>
        <button onClick={() => setStyle({ color: undefined, font: undefined, weight: undefined, align: undefined, lh: undefined })} disabled={!edit?.color && !edit?.font && !edit?.weight && !edit?.align && !edit?.lh} title="글자 모양 원래대로"><RotateCcw size={15}/></button>
      </div>
      <div className="style-row is-para">
        <div className="segmented">
          {([['left', AlignLeft, '왼쪽'], ['center', AlignCenter, '가운데'], ['right', AlignRight, '오른쪽']] as const).map(([value, Icon, label]) =>
            <button key={value} className={edit?.align === value ? 'active' : ''} onClick={() => setStyle({ align: edit?.align === value ? undefined : value })} title={`문단 ${label} 정렬`}><Icon size={16}/></button>)}
        </div>
        <div className="font-stepper" title="줄간격">
          <button onClick={() => setStyle({ lh: Math.max(0.8, Math.round(((edit?.lh ?? baseLh) - 0.1) * 10) / 10) })}><Minus size={15}/></button>
          <b>{(edit?.lh ?? baseLh).toFixed(1)}</b>
          <button onClick={() => setStyle({ lh: Math.min(3, Math.round(((edit?.lh ?? baseLh) + 0.1) * 10) / 10) })}><Plus size={15}/></button>
        </div>
      </div>
    </div>
    {leaf
      ? <>
        {leaf.isStale && <div className="stale-note">원고 글자가 바뀌어 저장된 부분 서식이 적용되지 않았어요.
          <button onClick={() => setStyle({ rich: undefined, richSrc: undefined })}>부분 서식 지우기</button></div>}
        <RichTextEditor item={leaf.editorItem} onChange={setRich}/>
        {edit?.rich && !leaf.isStale && <button className="wide secondary" onClick={() => setStyle({ rich: undefined, richSrc: undefined })}>부분 서식 지우고 원고 글자로</button>}
        <p className="panel-hint">여기서 고친 글자·서식은 카드에만 보이고 원고 칸은 그대로예요. 원고 칸을 고치면 부분 서식은 다시 해야 해요.</p>
      </>
      : <p className="panel-hint">글자 일부만 서식을 바꾸려면 더블클릭으로 글자만 든 안쪽 요소(제목·문장)를 선택하세요.</p>}
    {icons.length > 0 && <div className="field-group">
      아이콘 <span className="hint">눌러서 다른 아이콘으로 바꾸기</span>
      <div className="icon-slots">{icons.map((markup, i) => <button key={i} className={`${openIcon === i ? 'active' : ''} ${edit?.icons?.[i] ? 'is-changed' : ''}`} onClick={() => setOpenIcon(openIcon === i ? null : i)} title={`아이콘 ${i + 1}`} dangerouslySetInnerHTML={{ __html: markup }}/>)}</div>
      {openIcon !== null && <div className="icon-choose">
        <input value={iconQuery} onChange={e => setIconQuery(e.target.value)} placeholder="검색: 목표, 성장, 사람…"/>
        <div className="picker-icons">{iconChoices.map(({ name, Icon }) => <button key={name} className={edit?.icons?.[openIcon] === name ? 'active' : ''} onClick={() => setIcon(openIcon, name)} title={name}><Icon size={20}/></button>)}</div>
        {edit?.icons?.[openIcon] && <button className="wide secondary" onClick={() => setIcon(openIcon, null)}>원래 아이콘으로</button>}
      </div>}
    </div>}
    <AlignBar onAlign={onAlign}/>
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
    <button className="wide danger-soft" onClick={onDelete} title="Delete 키"><Trash2 size={15}/> 이 요소 삭제</button>
    <p className="panel-hint">삭제해도 원고 내용은 남아요 · 오른쪽 위 「모두 되살리기」나 Ctrl+Z 로 복원</p>
  </section>
}
