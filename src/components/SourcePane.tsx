import React, { useEffect, useLayoutEffect, useState } from 'react'
import { toPng } from 'html-to-image'
import { ClipboardPaste, ImageDown, Type } from 'lucide-react'
import { CardCanvas } from './CardCanvas'
import { templateLibrary } from '../templateLibrary'
import { Box, editableChildren, keyOf, layoutOf, measureBase, resolveKey, visualBox } from '../lib/layoutEdits'
import { FREE_PREFIX, freeIdOf } from '../lib/freeItems'
import { CardPage, CardProject, FreeItem, TemplateId } from '../types'

const SOURCE_ID = 'source-preview'

/** 가져올 곳: 템플릿(작업 중인 페이지 원고로 그려 봄) 또는 이 프로젝트의 다른 페이지 */
type Source = { type: 'template'; id: TemplateId } | { type: 'page'; index: number }

/** 'rgb(r, g, b)' → '#rrggbb' (색 입력칸은 hex 만 받는다) */
const toHex = (color: string) => {
  const m = color.match(/\d+(\.\d+)?/g)
  if (!m || m.length < 3) return undefined
  return '#' + m.slice(0, 3).map(v => Math.round(+v).toString(16).padStart(2, '0')).join('')
}

/**
 * SourcePane 컴포넌트 — 분할 보기의 오른쪽 창. 다른 템플릿·페이지를 띄워 놓고 요소를 골라 작업 페이지로 가져온다
 * 템플릿 요소는 원고에서 그려지는 구조라 그대로 옮길 수 없어서 "이미지로"(모양 그대로) 또는 "텍스트로"(글자·크기·색 유지, 수정 가능) 가져온다.
 * 직접 추가한 요소(이미지·텍스트·도형·아이콘)는 그대로 복사한다. 가져온 요소는 원래와 같은 위치에 놓인다.
 *
 * Props:
 * @param {CardProject} project - 프로젝트 [Required]
 * @param {CardPage} page - 작업 중인 페이지 (템플릿 미리보기의 원고로 쓴다) [Required]
 * @param {number} scale - 미리보기 축소 배율 [Required]
 * @param {function} onInsert - 가져온 요소를 작업 페이지에 넣는 콜백 [Required]
 *
 * Example usage:
 * <SourcePane project={project} page={page} scale={0.36} onInsert={addFree}/>
 */
interface Props {
  project: CardProject
  page: CardPage
  scale: number
  onInsert: (item: FreeItem) => void
}

export function SourcePane({ project, page, scale, onInsert }: Props) {
  const [source, setSource] = useState<Source>({ type: 'template', id: page.template === 'cover' ? 'editorial' : 'cover' })
  const [key, setKey] = useState<string | null>(null)
  const [box, setBox] = useState<Box | null>(null)
  const [busy, setBusy] = useState(false)
  const size = project.aspect === '1:1' ? { w: 1080, h: 1080 } : { w: 1080, h: 1350 }

  const srcPage: CardPage = source.type === 'page'
    ? project.pages[source.index] ?? page
    : { ...page, id: 'source', template: source.id, layoutEdits: undefined, textEdits: undefined, freeItems: undefined }
  const sourceValue = source.type === 'page' ? `page:${source.index}` : `template:${source.id}`

  useEffect(() => setKey(null), [sourceValue])

  const getCanvas = () => document.getElementById(SOURCE_ID)
  const getEl = (k: string): HTMLElement | null => {
    const canvas = getCanvas()
    const freeId = freeIdOf(k)
    if (freeId) return canvas?.querySelector<HTMLElement>(`[data-free-id="${freeId}"]`) ?? null
    const layout = layoutOf(canvas)
    return (layout && resolveKey(layout, k)) || null
  }
  const freeItem = key && freeIdOf(key) ? srcPage.freeItems?.find(it => it.id === freeIdOf(key)) : undefined
  const el = key ? getEl(key) : null
  const hasText = !!el && !freeItem && !!el.innerText.trim()

  // 선택 표시 박스 (그린 뒤에 잰다). srcPage 는 템플릿 모드에서 매번 새로 만들어지므로 의존값은 원본(page·project)으로 둔다
  useLayoutEffect(() => {
    const canvas = getCanvas()
    const target = key ? getEl(key) : null
    setBox(canvas && target ? visualBox(target, canvas) : null)
  }, [key, sourceValue, page, project, scale])

  // 클릭: 덩어리 선택 (작업 창의 레이아웃 편집과 같은 규칙)
  const pick = (e: React.MouseEvent) => {
    const canvas = getCanvas()
    const layout = layoutOf(canvas)
    if (!canvas || !layout) return
    for (const hit of document.elementsFromPoint(e.clientX, e.clientY)) {
      const freeEl = hit.closest<HTMLElement>('[data-free-id]')
      if (freeEl && canvas.contains(freeEl)) return setKey(FREE_PREFIX + freeEl.dataset.freeId)
      let node: Element | null = hit
      while (node && node.parentElement !== layout) node = node.parentElement
      if (!node || !(node instanceof HTMLElement) || node.dataset.hidden !== undefined) continue
      const b = measureBase(node, canvas)
      if (b.x < -1 || b.y < -1 || b.x + b.w > canvas.offsetWidth + 1 || b.y + b.h > canvas.offsetHeight + 1) continue
      const k = keyOf(layout, node)
      if (k) return setKey(k)
    }
    setKey(null)
  }

  // 더블클릭: 한 단계 안쪽 요소
  const drill = (e: React.MouseEvent) => {
    const layout = layoutOf(getCanvas())
    const current = key && !freeIdOf(key) ? getEl(key) : null
    if (!layout || !current) return
    for (const hit of document.elementsFromPoint(e.clientX, e.clientY)) {
      if (hit === current || !current.contains(hit)) continue
      let node: Element = hit
      while (node.parentElement && node.parentElement !== current) node = node.parentElement
      if (!(node instanceof HTMLElement)) continue
      const k = keyOf(layout, node)
      if (k) return setKey(k)
    }
  }

  const place = () => box ? { x: Math.round(box.x), y: Math.round(box.y), w: Math.max(40, Math.round(box.w)) } : { x: 0, y: 0, w: 200 }

  const insertAsImage = async () => {
    if (!el || !box) return
    setBusy(true)
    try {
      await document.fonts?.ready
      // 요소만 떼어 그리므로 부모 기준 위치·이동값은 지우고 제자리에서 그린다
      const src = await toPng(el, {
        pixelRatio: 2, cacheBust: true,
        style: { position: 'relative', left: 'auto', top: 'auto', right: 'auto', bottom: 'auto', margin: '0', transform: 'none', translate: 'none', scale: 'none', zoom: '1' },
      })
      onInsert({ id: crypto.randomUUID(), kind: 'image', src, ...place(), h: Math.max(20, Math.round(box.h)) })
    } catch {
      alert('이 요소는 이미지로 만들 수 없어요. 다른 요소를 선택해 보세요.')
    } finally { setBusy(false) }
  }

  const insertAsText = () => {
    if (!el) return
    // 글자가 들어 있는 첫 태그의 글꼴 모양을 따른다
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let styleEl: Element = el
    while (walker.nextNode()) if (walker.currentNode.textContent?.trim()) { styleEl = walker.currentNode.parentElement ?? el; break }
    const cs = getComputedStyle(styleEl)
    const align = (['left', 'center', 'right'] as const).find(a => cs.textAlign === a)
    onInsert({
      id: crypto.randomUUID(), kind: 'text', ...place(), text: el.innerText.trim(),
      fontSize: Math.round(parseFloat(cs.fontSize)), color: toHex(cs.color), isBold: parseInt(cs.fontWeight) >= 700, align,
    })
  }

  const insertCopy = () => {
    if (freeItem) onInsert({ ...freeItem, id: crypto.randomUUID() })
  }

  return <div className="source-pane">
    <div className="source-head">
      <span>가져올 페이지</span>
      <select value={sourceValue} onChange={e => {
        const [type, value] = e.target.value.split(':')
        setSource(type === 'page' ? { type: 'page', index: +value } : { type: 'template', id: value as TemplateId })
      }}>
        <optgroup label="템플릿 (지금 원고로 보기)">{templateLibrary.map(t => <option key={t.id} value={`template:${t.id}`}>{t.category} · {t.name}</option>)}</optgroup>
        <optgroup label="이 프로젝트의 페이지">{project.pages.map((p, i) => <option key={p.id} value={`page:${i}`}>{String(i + 1).padStart(2, '0')} · {p.title.split('\n')[0] || '제목 없음'}</option>)}</optgroup>
      </select>
    </div>
    <div className="stage-pane" style={{ width: size.w * scale, height: size.h * scale }}>
      <div className="scaled-canvas is-left" style={{ transform: `scale(${scale})`, width: size.w, height: size.h }}>
        <CardCanvas project={project} page={srcPage} pageIndex={source.type === 'page' ? source.index : 0} exportId={SOURCE_ID}/>
        <div className="source-overlay" onMouseDown={pick} onDoubleClick={drill}>
          {box && <div className="source-select" style={{ left: box.x, top: box.y, width: box.w, height: box.h, ['--ui-scale' as string]: scale }}/>}
        </div>
      </div>
    </div>
    <div className="source-actions">
      {!key && <p className="panel-hint">가져올 요소를 클릭하세요 · 더블클릭하면 안쪽 항목</p>}
      {key && freeItem && <button className="primary" onClick={insertCopy}><ClipboardPaste size={15}/> 그대로 가져오기</button>}
      {key && !freeItem && <button className="primary" onClick={insertAsImage} disabled={busy}><ImageDown size={15}/> {busy ? '만드는 중…' : '이미지로 가져오기'}</button>}
      {hasText && <button onClick={insertAsText}><Type size={15}/> 텍스트로 가져오기</button>}
    </div>
  </div>
}
