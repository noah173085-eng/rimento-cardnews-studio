import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { toJpeg, toPng } from 'html-to-image'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import {
  ArrowDown, ArrowUp, Columns2, Copy, Download, FileJson, FileText, ImagePlus, LayoutGrid, LayoutTemplate,
  Move, Plus, Redo2, RefreshCcw, RotateCcw, Search, Shapes, Sparkles, Trash2, Type, Undo2, Upload, WandSparkles, X
} from 'lucide-react'
import { AlignDir } from './components/AlignBar'
import { CardCanvas } from './components/CardCanvas'
import { ElementPanel } from './components/ElementPanel'
import { ElementsPicker } from './components/ElementsPicker'
import { FreeItemPanel } from './components/FreeItemPanel'
import { LayoutEditor } from './components/LayoutEditor'
import { PageThumb } from './components/PageThumb'
import { SourcePane } from './components/SourcePane'
import { sampleProject } from './data'
import { activeEdits, layoutOf, resolveKey, sanitizeEdits, visualBox, withEdit } from './lib/layoutEdits'
import { sanitizeTextEdits } from './lib/textEdits'
import { FREE_PREFIX, freeIdOf, readImage, sanitizeFreeItems } from './lib/freeItems'
import { autoDesignPages, detectLogoCommand, splitScriptToPages, stripLogoCommands } from './lib/auto'
import { templateCategories, templateLibrary, templateMap, TemplateCategory, TemplateMeta } from './templateLibrary'
import { styleCategories, styleCategoryMap, themes } from './themes'
import { CardPage, CardProject, FreeItem, LogoId, TemplateId, ThemeId } from './types'
import './styles.css'

const STORAGE_KEY = 'rimento-cardnews-studio:v2'
const OLD_STORAGE_KEY = 'rimento-cardnews-studio:v1'

function cleanProject(p: CardProject): CardProject {
  const pages = Array.isArray(p.pages) ? p.pages : sampleProject.pages
  return {
    ...sampleProject,
    ...p,
    pages: pages.map(page => ({
      ...page,
      id: page.id || crypto.randomUUID(),
      items: Array.isArray(page.items) ? page.items : [],
      template: templateMap[page.template as TemplateId] ? page.template : 'editorial',
      layoutEdits: sanitizeEdits(page.layoutEdits),
      textEdits: sanitizeTextEdits(page.textEdits),
      freeItems: sanitizeFreeItems(page.freeItems),
    })),
  }
}

function TemplateMini({ meta, active = false }: { meta: TemplateMeta; active?: boolean }) {
  return <div className={`template-mini visual-${meta.visual} ${active ? 'active' : ''}`}>
    <div className="mini-top"/>
    <div className="mini-title"><i/><i/></div>
    <div className="mini-body"><i/><i/><i/></div>
    <div className="mini-accent"/>
  </div>
}

export default function App() {
  const [project, setProject] = useState<CardProject>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY)
      return cached ? cleanProject(JSON.parse(cached)) : sampleProject
    } catch { return sampleProject }
  })
  const [selected, setSelected] = useState(0)
  const [script, setScript] = useState('')
  const [busy, setBusy] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [category, setCategory] = useState<TemplateCategory | '전체'>('전체')
  const [templateQuery, setTemplateQuery] = useState('')
  const [isLayoutEditing, setIsLayoutEditing] = useState(false)
  /** 분할 보기: 왼쪽 작업 페이지 + 오른쪽 가져올 페이지 */
  const [isSplit, setIsSplit] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const [isElementsOpen, setIsElementsOpen] = useState(false)
  // 페이지 목록 끌어서 순서 바꾸기: 잡은 페이지와 놓을 자리
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  /** Ctrl+C 로 복사해 둔 추가 요소 (다른 페이지에도 붙여넣을 수 있다) */
  const copiedFree = useRef<FreeItem | null>(null)

  // 이미지가 많으면 localStorage 한도(보통 5MB)를 넘을 수 있다. 앱이 멈추지 않게 잡고 화면에 알린다
  const [isSaveFailed, setIsSaveFailed] = useState(false)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); setIsSaveFailed(false) }
    catch { setIsSaveFailed(true) }
  }, [project])
  useEffect(() => { if (selected > project.pages.length - 1) setSelected(Math.max(0, project.pages.length - 1)) }, [project.pages.length, selected])

  /** 되돌리기/다시 실행: project 가 바뀔 때마다 이전 상태를 쌓는다. 0.6초 안에 이어진 변경(타이핑 등)은 한 단계로 묶는다 */
  const [history, setHistory] = useState<{ past: CardProject[]; future: CardProject[] }>({ past: [], future: [] })
  const prevProject = useRef(project)
  const isTimeTravel = useRef(false)
  const lastChange = useRef(0)

  useEffect(() => {
    const prev = prevProject.current
    prevProject.current = project
    if (prev === project) return
    if (isTimeTravel.current) { isTimeTravel.current = false; return }
    const now = Date.now()
    const merge = now - lastChange.current < 600
    lastChange.current = now
    setHistory(h => ({ past: merge && h.past.length ? h.past : [...h.past, prev].slice(-100), future: [] }))
  }, [project])

  const undo = () => {
    const prev = history.past[history.past.length - 1]
    if (!prev) return
    isTimeTravel.current = true
    lastChange.current = 0
    setHistory({ past: history.past.slice(0, -1), future: [project, ...history.future] })
    setProject(prev)
  }

  const redo = () => {
    const next = history.future[0]
    if (!next) return
    isTimeTravel.current = true
    lastChange.current = 0
    setHistory({ past: [...history.past, project], future: history.future.slice(1) })
    setProject(next)
  }

  // Ctrl+Z 되돌리기, Ctrl+Shift+Z / Ctrl+Y 다시 실행 (입력칸 안에서도 앱 전체 기준으로 동작)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 선택한 요소 삭제 (입력칸에서 글자를 지울 때는 제외)
      // 글자 입력 중이면 단축키(삭제·방향키·복사/붙여넣기)는 브라우저 기본 동작에 맡긴다. 부분 서식 편집기(contentEditable)도 포함
      const isTyping = e.target instanceof HTMLElement && (e.target.matches('input, textarea, select') || e.target.isContentEditable)
      if ((e.key === 'Delete' || e.key === 'Backspace') && isLayoutEditing && editKey && !isTyping) { e.preventDefault(); deleteSelected(); return }
      // 방향키: 선택한 요소 1px (Shift 10px) 이동
      const arrow = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, number[]>)[e.key]
      if (arrow && isLayoutEditing && editKey && !isTyping) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        moveSelected(arrow[0] * step, arrow[1] * step)
        return
      }
      if (!(e.ctrlKey || e.metaKey)) return
      const k = e.key.toLowerCase()
      // 추가 요소 복사·붙여넣기·복제 (입력칸 안에서는 브라우저 기본 동작)
      if (!isTyping && k === 'c' && selectedFree) { copiedFree.current = selectedFree; return }
      if (!isTyping && k === 'v' && copiedFree.current) { e.preventDefault(); copiedFree.current = pasteFree(copiedFree.current); return }
      if (!isTyping && k === 'd' && selectedFree) { e.preventDefault(); pasteFree(selectedFree); return }
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const page = project.pages[selected]
  const canvasScale = isSplit ? (project.aspect === '1:1' ? 0.38 : 0.34) : project.aspect === '1:1' ? 0.58 : 0.47
  const previewSize = useMemo(() => project.aspect === '1:1' ? {w:1080,h:1080}:{w:1080,h:1350}, [project.aspect])
  const currentTemplate = page ? templateMap[page.template] : templateMap.editorial
  const filteredTemplates = templateLibrary.filter(t => {
    const categoryOk = category === '전체' || t.category === category
    const q = templateQuery.trim().toLowerCase()
    const searchOk = !q || [t.name,t.category,t.description,t.hint].join(' ').toLowerCase().includes(q)
    return categoryOk && searchOk
  })

  const updatePage = (patch: Partial<CardPage>) => {
    setProject(prev => ({ ...prev, pages: prev.pages.map((p, i) => i === selected ? { ...p, ...patch } : p) }))
  }

  const setItem = (index: number, value: string) => updatePage({ items: page.items.map((v, i) => i === index ? value : v) })

  const selectTemplate = (id: TemplateId) => {
    // 템플릿이 바뀌면 조정값은 의미가 없으므로 초기화
    updatePage(page.template === id ? { template: id } : { template: id, layoutEdits: undefined })
    setGalleryOpen(false)
  }

  const addPage = () => {
    const next: CardPage = { id: crypto.randomUUID(), template: 'editorial', eyebrow: 'INSIGHT', title: '새 페이지 제목', body: '한 페이지에 하나의 메시지를 입력하세요.', items: [], note: '' }
    setProject(prev => ({ ...prev, pages: [...prev.pages, next] }))
    setSelected(project.pages.length)
  }

  const duplicatePage = () => {
    const copy = { ...page, id: crypto.randomUUID() }
    setProject(prev => ({ ...prev, pages: [...prev.pages.slice(0, selected + 1), copy, ...prev.pages.slice(selected + 1)] }))
    setSelected(selected + 1)
  }

  const removePage = () => {
    if (project.pages.length <= 1) return
    setProject(prev => ({ ...prev, pages: prev.pages.filter((_, i) => i !== selected) }))
    setSelected(Math.max(0, selected - 1))
  }

  const movePage = (dir: -1 | 1) => {
    const nextIndex = selected + dir
    if (nextIndex < 0 || nextIndex >= project.pages.length) return
    setProject(prev => {
      const pages = [...prev.pages]
      ;[pages[selected], pages[nextIndex]] = [pages[nextIndex], pages[selected]]
      return { ...prev, pages }
    })
    setSelected(nextIndex)
  }

  /** 페이지를 from 자리에서 to 자리로 옮긴다. 보고 있던 페이지는 계속 선택된 채로 둔다 */
  const reorderPage = (from: number, to: number) => {
    if (from === to) return
    const pages = [...project.pages]
    const [moved] = pages.splice(from, 1)
    pages.splice(to, 0, moved)
    const selectedId = project.pages[selected]?.id
    setProject(prev => ({ ...prev, pages }))
    setSelected(Math.max(0, pages.findIndex(pg => pg.id === selectedId)))
  }

  const uploadImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updatePage({ imageDataUrl: String(reader.result) })
    reader.readAsDataURL(file)
  }

  /** 직접 추가한 이미지·텍스트 박스: 추가하면 레이아웃 편집을 켜고 바로 선택한다 */
  const selectedFreeId = isLayoutEditing ? freeIdOf(editKey) : null
  const selectedFree = selectedFreeId ? page?.freeItems?.find(it => it.id === selectedFreeId) : undefined

  const addFree = (item: FreeItem) => {
    updatePage({ freeItems: [...(page.freeItems ?? []), item] })
    setIsLayoutEditing(true)
    setEditKey(FREE_PREFIX + item.id)
  }

  const addText = () => addFree({
    id: crypto.randomUUID(), kind: 'text', x: 240, y: Math.round(previewSize.h / 2 - 40), w: 600,
    text: '텍스트를 입력하세요', fontSize: 44, isBold: true,
  })

  const addImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const img = await readImage(file)
      // 처음 크기: 폭 최대 480, 크기를 못 읽는 이미지는 정사각형 360
      const w = img.w ? Math.min(img.w, 480) : 360
      const h = img.w ? Math.round(img.h * w / img.w) : 360
      addFree({ id: crypto.randomUUID(), kind: 'image', src: img.src, w, h, x: Math.round((1080 - w) / 2), y: Math.round((previewSize.h - h) / 2) })
    } catch { alert('이미지를 불러올 수 없습니다. 다른 파일을 선택해주세요.') }
  }

  const updateFree = (id: string, patch: Partial<FreeItem>) =>
    updatePage({ freeItems: page.freeItems?.map(it => it.id === id ? { ...it, ...patch } : it) })

  const orderFree = (id: string, dir: 'front' | 'back') => {
    const items = page.freeItems ?? []
    const target = items.find(it => it.id === id)
    if (!target) return
    const rest = items.filter(it => it.id !== id)
    updatePage({ freeItems: dir === 'front' ? [...rest, target] : [target, ...rest] })
  }

  const removeFree = (id: string) => {
    const items = page.freeItems?.filter(it => it.id !== id)
    updatePage({ freeItems: items?.length ? items : undefined })
    setEditKey(null)
  }

  /** 선택한 요소 삭제: 추가 요소는 지우고, 템플릿 요소는 숨김으로 저장한다 (되살리기·Ctrl+Z 가능) */
  const deleteSelected = () => {
    if (!editKey) return
    if (selectedFreeId) return removeFree(selectedFreeId)
    updatePage({ layoutEdits: withEdit(page, project.aspect, editKey, { hide: true }) })
    setEditKey(null)
  }

  /** 이 페이지(현재 템플릿·규격)에서 숨긴 템플릿 요소 */
  const hiddenKeys = page ? Object.entries(activeEdits(page, project.aspect)).filter(([, e]) => e.hide).map(([k]) => k) : []

  const restoreHidden = () => {
    let next = page
    for (const key of hiddenKeys) next = { ...next, layoutEdits: withEdit(next, project.aspect, key, { hide: false }) }
    updatePage({ layoutEdits: next.layoutEdits })
  }

  /** 카드 가운데에 놓는다 */
  const centered = (w: number, h: number) => ({ x: Math.round((1080 - w) / 2), y: Math.round((previewSize.h - h) / 2) })

  const addShape = (shape: NonNullable<FreeItem['shape']>) => {
    const [w, h] = shape === 'line' ? [480, 8] : shape === 'ellipse' ? [260, 260] : [340, 220]
    addFree({ id: crypto.randomUUID(), kind: 'shape', shape, w, h, ...centered(w, h) })
    setIsElementsOpen(false)
  }

  const addIcon = (name: string) => {
    addFree({ id: crypto.randomUUID(), kind: 'icon', icon: name, w: 160, h: 160, ...centered(160, 160) })
    setIsElementsOpen(false)
  }

  /** 추가 요소를 살짝 비껴서 현재 페이지에 하나 더 만든다. 만든 요소를 돌려줘 연속 붙여넣기 때 계속 비껴가게 한다 */
  const pasteFree = (item: FreeItem) => {
    const copy = { ...item, id: crypto.randomUUID(), x: item.x + 24, y: item.y + 24 }
    addFree(copy)
    return copy
  }

  /** 선택한 요소를 옮긴다 (1080 기준 px): 추가 요소는 좌표를, 템플릿 요소는 위치 조정값을 바꾼다 */
  const moveSelected = (dx: number, dy: number) => {
    if (!editKey) return
    const key = editKey
    const freeId = selectedFreeId
    // 방향키를 누르고 있으면 렌더 사이에 여러 번 불릴 수 있어, 항상 최신 상태(prev)를 기준으로 더한다
    setProject(prev => ({ ...prev, pages: prev.pages.map((p, i) => {
      if (i !== selected) return p
      if (freeId) return { ...p, freeItems: p.freeItems?.map(it => it.id === freeId ? { ...it, x: Math.round(it.x + dx), y: Math.round(it.y + dy) } : it) }
      const cur = activeEdits(p, prev.aspect)[key] ?? { x: 0, y: 0, s: 1 }
      return { ...p, layoutEdits: withEdit(p, prev.aspect, key, { x: cur.x + dx, y: cur.y + dy }) }
    }) }))
  }

  /** 선택한 요소를 카드 가장자리·가운데에 맞춘다 (지금 보이는 박스 기준) */
  const alignSelected = (dir: AlignDir) => {
    const canvas = document.getElementById('card-preview')
    const layout = layoutOf(canvas)
    if (!canvas || !editKey) return
    const el = selectedFreeId ? canvas.querySelector(`[data-free-id="${selectedFreeId}"]`) : layout && resolveKey(layout, editKey)
    if (!el) return
    const b = visualBox(el, canvas)
    const W = canvas.offsetWidth
    const H = canvas.offsetHeight
    const dx = dir === 'left' ? -b.x : dir === 'hcenter' ? (W - b.w) / 2 - b.x : dir === 'right' ? W - b.w - b.x : 0
    const dy = dir === 'top' ? -b.y : dir === 'vcenter' ? (H - b.h) / 2 - b.y : dir === 'bottom' ? H - b.h - b.y : 0
    moveSelected(dx, dy)
  }

  const exportOne = async () => {
    const node = document.getElementById('card-preview')
    if (!node) return
    setBusy(true)
    try {
      await document.fonts?.ready
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 1, backgroundColor: getComputedStyle(node).backgroundColor })
      saveAs(dataUrl, `${project.issueLabel}_${String(selected + 1).padStart(2,'0')}.png`)
    } finally { setBusy(false) }
  }

  /** 모든 페이지를 화면 밖에 1080 기준 원래 크기로 그려 하나씩 캡처한다 (ZIP·PDF 공용) */
  const capturePages = async (capture: (node: HTMLElement) => Promise<string>) => {
    const urls: string[] = []
    const { createRoot } = await import('react-dom/client')
    for (let i = 0; i < project.pages.length; i++) {
      const host = document.createElement('div')
      host.style.position='fixed'; host.style.left='-99999px'; host.style.top='0'; host.style.zIndex='-1'
      document.body.appendChild(host)
      const target = document.createElement('div')
      host.appendChild(target)
      const root = createRoot(target)
      root.render(<CardCanvas project={project} page={project.pages[i]} pageIndex={i} exportId={`export-${i}`} />)
      await new Promise(r => setTimeout(r, 140))
      await document.fonts?.ready
      const node = document.getElementById(`export-${i}`)
      if (node) urls.push(await capture(node))
      root.unmount(); host.remove()
    }
    return urls
  }

  const exportPdf = async () => {
    setBusy(true)
    try {
      // JPEG 로 넣어 파일 크기를 줄인다 (PNG 대비 약 1/5). 페이지 크기 = 카드 크기(1080px 기준)
      const urls = await capturePages(node => toJpeg(node, { cacheBust: true, pixelRatio: 1, quality: 0.92, backgroundColor: getComputedStyle(node).backgroundColor }))
      const { jsPDF } = await import('jspdf')
      const [w, h] = project.aspect === '1:1' ? [1080, 1080] : [1080, 1350]
      const pdf = new jsPDF({ unit: 'px', format: [w, h], orientation: 'portrait', hotfixes: ['px_scaling'], compress: true })
      urls.forEach((url, i) => {
        if (i) pdf.addPage([w, h], 'portrait')
        pdf.addImage(url, 'JPEG', 0, 0, w, h)
      })
      pdf.save(`${project.issueLabel}.pdf`)
    } catch { alert('PDF 를 만들지 못했습니다. 다시 시도해주세요.') }
    finally { setBusy(false) }
  }

  const exportAll = async () => {
    setBusy(true)
    try {
      const zip = new JSZip()
      const urls = await capturePages(node => toPng(node, { cacheBust: true, pixelRatio: 1, backgroundColor: getComputedStyle(node).backgroundColor }))
      urls.forEach((url, i) => zip.file(`${String(i+1).padStart(2,'0')}.png`, url.split(',')[1], { base64:true }))
      const blob = await zip.generateAsync({ type:'blob' })
      saveAs(blob, `${project.issueLabel}_전체.zip`)
    } finally { setBusy(false) }
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type:'application/json;charset=utf-8' })
    saveAs(blob, `${project.issueLabel}_project.json`)
  }

  const importJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try { setProject(cleanProject(JSON.parse(String(reader.result)))); setSelected(0) }
      catch { alert('프로젝트 JSON 형식을 확인해주세요.') }
    }
    reader.readAsText(file)
  }

  const resetSample = () => {
    if (!confirm('현재 작업을 V2 샘플 프로젝트로 초기화할까요?')) return
    setProject({ ...sampleProject, pages: sampleProject.pages.map(p => ({...p, id:crypto.randomUUID()})) })
    setSelected(0)
  }

  const applyScript = () => {
    const logo = detectLogoCommand(script)
    const pages = splitScriptToPages(stripLogoCommands(script))
    if (!pages.length) return
    setProject(prev => ({ ...prev, ...(logo ? { logo } : {}), pages:autoDesignPages(pages) }))
    setSelected(0)
  }

  const autoDesign = () => setProject(prev => ({ ...prev, pages:autoDesignPages(prev.pages) }))

  if (!page) return null

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand-title"><div className="brand-symbol">LI</div><div><b>리멘토 카드뉴스 스튜디오 <em>V2</em></b><span>{templateLibrary.length} Templates · Content → Design → Export</span></div>{isSaveFailed && <span className="save-failed">자동 저장 실패(저장 용량 초과) · ‘저장’으로 JSON 백업하세요</span>}</div>
      <div className="top-actions">
        <button onClick={undo} disabled={!history.past.length} title="되돌리기 (Ctrl+Z)"><Undo2 size={17}/> 되돌리기</button>
        <button onClick={redo} disabled={!history.future.length} title="다시 실행 (Ctrl+Shift+Z / Ctrl+Y)"><Redo2 size={17}/> 다시 실행</button>
        <button onClick={() => setGalleryOpen(true)}><LayoutGrid size={17}/> 템플릿 {templateLibrary.length}</button>
        <button onClick={autoDesign}><WandSparkles size={17}/> 전체 자동배치</button>
        <button onClick={exportJson}><FileJson size={17}/> 저장</button>
        <button onClick={() => jsonInputRef.current?.click()}><Upload size={17}/> 불러오기</button>
        <input ref={jsonInputRef} type="file" accept="application/json" hidden onChange={importJson}/>
        <button onClick={exportPdf} disabled={busy} title="모든 페이지를 PDF 한 파일로 저장"><FileText size={17}/> PDF</button>
        <button className="primary" onClick={exportAll} disabled={busy}><Download size={17}/> {busy ? '렌더링 중…' : '전체 ZIP'}</button>
      </div>
    </header>

    <main className="workspace">
      <aside className="sidebar left-panel">
        <section>
          <div className="section-head"><h3>프로젝트</h3><button className="icon-btn" onClick={resetSample} title="샘플로 초기화"><RefreshCcw size={16}/></button></div>
          <label>호수/라벨<input value={project.issueLabel} onChange={e => setProject({...project,issueLabel:e.target.value})}/></label>
          <label>브랜드명<input value={project.brandName} onChange={e => setProject({...project,brandName:e.target.value})}/></label>
          <label>인스타/채널 핸들<input value={project.handle} onChange={e => setProject({...project,handle:e.target.value})}/></label>
          <label>하단 문구 <span className="hint">하단 로고가 ‘없음’일 때 표시</span><input value={project.footerText} onChange={e => setProject({...project,footerText:e.target.value})}/></label>
          <div className="two-col">
            <label>스타일 35<select value={project.theme} onChange={e=>setProject({...project,theme:e.target.value as ThemeId})}>{styleCategories.map(cat=><optgroup label={cat} key={cat}>{Object.values(themes).filter(t=>styleCategoryMap[t.id]===cat).map(t=><option value={t.id} key={t.id}>{t.name}</option>)}</optgroup>)}</select></label>
            <label>규격<select value={project.aspect} onChange={e=>setProject({...project,aspect:e.target.value as '4:5'|'1:1'})}><option value="4:5">1080×1350</option><option value="1:1">1080×1080</option></select></label>
          </div>
          <div className="theme-vibe">{themes[project.theme].vibe}</div>
          <div className="two-col">
            <label>상단 로고<select value={project.logo} onChange={e=>setProject({...project,logo:e.target.value as LogoId})}>
              <option value="none">없음</option>
              <option value="rimento">리멘토 로고 (세로·남색)</option>
              <option value="rimento-horizontal">리멘토 로고 (가로·남색)</option>
              <option value="rimento-horizontal-white">리멘토 로고 (가로·흰색)</option>
              <option value="company">회사 로고 (심볼·흰색)</option>
              <option value="company-full">리더스인싸이트그룹 로고</option>
            </select></label>
            <label>하단 로고<select value={project.footerLogo} onChange={e=>setProject({...project,footerLogo:e.target.value as LogoId})}>
              <option value="none">없음</option>
              <option value="rimento">리멘토 로고 (세로·남색)</option>
              <option value="rimento-horizontal">리멘토 로고 (가로·남색)</option>
              <option value="rimento-horizontal-white">리멘토 로고 (가로·흰색)</option>
              <option value="company">회사 로고 (심볼·흰색)</option>
              <option value="company-full">리더스인싸이트그룹 로고</option>
            </select></label>
          </div>
        </section>

        <section className="script-box">
          <div className="section-head"><h3>원고 → 카드뉴스</h3><Sparkles size={17}/></div>
          <textarea value={script} onChange={e=>setScript(e.target.value)} placeholder={'페이지 제목\n본문 문장\n- 핵심 1\n- 핵심 2\n\n다음 페이지 제목\n본문…\n\n페이지 사이에 --- 입력 가능\n\n"리멘토 로고를 넣어줘" 라고 쓰면 상단 로고가 자동 적용됩니다'} />
          <button className="wide" onClick={applyScript} disabled={!script.trim()}><WandSparkles size={17}/> {templateLibrary.length}개 템플릿으로 자동 디자인</button>
        </section>

        <section className="page-list-section">
          <div className="section-head"><h3>페이지 {project.pages.length} <span className="hint">끌어서 순서 변경</span></h3><button className="icon-btn" onClick={addPage}><Plus size={17}/></button></div>
          <div className="page-list">{project.pages.map((p,i)=><button key={p.id} draggable
            className={`page-row ${i===selected?'active':''} ${dragFrom!==null && dragOver===i && dragFrom!==i ? (dragFrom<i ? 'drop-after' : 'drop-before') : ''} ${dragFrom===i ? 'is-dragging' : ''}`}
            onClick={()=>setSelected(i)}
            onDragStart={e=>{ setDragFrom(i); e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain', String(i)) }}
            onDragOver={e=>{ e.preventDefault(); if (dragOver!==i) setDragOver(i) }}
            onDrop={e=>{ e.preventDefault(); if (dragFrom!==null) reorderPage(dragFrom, i); setDragFrom(null); setDragOver(null) }}
            onDragEnd={()=>{ setDragFrom(null); setDragOver(null) }}>
            <span className="page-index">{String(i+1).padStart(2,'0')}</span><PageThumb project={project} page={p} pageIndex={i}/><div><b>{p.title.split('\n')[0]||'제목 없음'}</b><small>{templateMap[p.template]?.name || p.template}</small></div></button>)}</div>
        </section>
      </aside>

      <section className="preview-area">
        <div className="preview-toolbar"><span><LayoutTemplate size={16}/> 실시간 미리보기 · <b>{currentTemplate.name}</b></span><div>
          <button onClick={()=>movePage(-1)} disabled={selected===0}><ArrowUp size={16}/></button>
          <button onClick={()=>movePage(1)} disabled={selected===project.pages.length-1}><ArrowDown size={16}/></button>
          <button onClick={duplicatePage}><Copy size={16}/></button>
          <button onClick={removePage} disabled={project.pages.length<=1}><Trash2 size={16}/></button>
          <button onClick={addText} title="텍스트 박스 추가"><Type size={16}/> 텍스트</button>
          <label className="toolbar-file" title="이미지 추가"><ImagePlus size={16}/> 이미지<input type="file" accept="image/*" hidden onChange={addImage}/></label>
          <span className="toolbar-pop"><button className={isElementsOpen?'active':''} onClick={()=>setIsElementsOpen(v=>!v)} title="도형·아이콘 추가"><Shapes size={16}/> 요소</button>
            {isElementsOpen && <ElementsPicker onAddShape={addShape} onAddIcon={addIcon} onClose={()=>setIsElementsOpen(false)}/>}</span>
          <button className={isSplit?'active':''} onClick={()=>setIsSplit(v=>!v)} title="다른 템플릿·페이지를 옆에 띄워 요소 가져오기"><Columns2 size={16}/> 분할</button>
          <button className={isLayoutEditing?'active':''} onClick={()=>{ setIsLayoutEditing(v=>!v); setEditKey(null) }} title="요소를 끌어 옮기고 모서리로 크기 조절"><Move size={16}/> 레이아웃 편집</button>
          <button onClick={()=>updatePage({ layoutEdits: undefined, textEdits: undefined })} disabled={!Object.keys(activeEdits(page, project.aspect)).length && !page.textEdits}><RotateCcw size={16}/> 원래대로</button>
          <button className="primary" onClick={exportOne} disabled={busy}><Download size={16}/> PNG</button>
        </div></div>
        {isSplit
          ? <div className="split-stage">
            <div className="work-pane"><div className="source-head"><span>작업 페이지</span><b>{String(selected+1).padStart(2,'0')} · {currentTemplate.name}</b></div>
              <div className="stage-pane" style={{width:previewSize.w*canvasScale,height:previewSize.h*canvasScale}}><div className="scaled-canvas is-left" style={{transform:`scale(${canvasScale})`,width:previewSize.w,height:previewSize.h}}><CardCanvas project={project} page={page} pageIndex={selected} exportId="card-preview"/>{isLayoutEditing && <LayoutEditor canvasId="card-preview" page={page} aspect={project.aspect} scale={canvasScale} selectedKey={editKey} onSelect={setEditKey} onChange={edits=>updatePage({ layoutEdits: edits })} onFreeChange={updateFree}/>}</div></div></div>
            <SourcePane project={project} page={page} scale={canvasScale} onInsert={addFree}/>
          </div>
          : <div className="canvas-stage" style={{height:previewSize.h*canvasScale+42}}><div className="scaled-canvas" style={{transform:`scale(${canvasScale})`,width:previewSize.w,height:previewSize.h}}><CardCanvas project={project} page={page} pageIndex={selected} exportId="card-preview"/>{isLayoutEditing && <LayoutEditor canvasId="card-preview" page={page} aspect={project.aspect} scale={canvasScale} selectedKey={editKey} onSelect={setEditKey} onChange={edits=>updatePage({ layoutEdits: edits })} onFreeChange={updateFree}/>}</div></div>}
      </section>

      <aside className="sidebar edit-panel">
        {hiddenKeys.length > 0 && <div className="hidden-bar"><span>삭제한 템플릿 요소 {hiddenKeys.length}개</span><button onClick={restoreHidden}><RotateCcw size={14}/> 모두 되살리기</button></div>}
        {selectedFree && <FreeItemPanel item={selectedFree} themeText={themes[project.theme].text} themeAccent={themes[project.theme].accent} onChange={patch=>updateFree(selectedFree.id, patch)} onAlign={alignSelected} onDuplicate={()=>pasteFree(selectedFree)} onOrder={dir=>orderFree(selectedFree.id, dir)} onDelete={()=>removeFree(selectedFree.id)}/>}
        {isLayoutEditing && editKey && !selectedFreeId && <ElementPanel canvasId="card-preview" page={page} aspect={project.aspect} elementKey={editKey} onSelect={setEditKey} onChange={updatePage} onAlign={alignSelected} onDelete={deleteSelected}/>}
        <section>
          <div className="section-head"><h3>페이지 편집</h3><span className="badge">{selected+1}/{project.pages.length}</span></div>
          <button className="template-selector" onClick={()=>setGalleryOpen(true)}><TemplateMini meta={currentTemplate} active/><div><small>{currentTemplate.category}</small><b>{currentTemplate.name}</b><span>{currentTemplate.description}</span></div><LayoutGrid size={19}/></button>
          <label>상단 라벨<input value={page.eyebrow} onChange={e=>updatePage({eyebrow:e.target.value})} placeholder="OPENING / CASE / INSIGHT"/></label>
          <label>제목<textarea className="short" value={page.title} onChange={e=>updatePage({title:e.target.value})}/></label>
          <label>본문<textarea value={page.body} onChange={e=>updatePage({body:e.target.value})}/></label>
          <div className="field-group">항목 <span className="hint">Enter로 줄바꿈 · ‘라벨|설명’ 지원</span>
            {page.items.map((item,i)=><div className="item-row" key={i}><textarea rows={2} value={item} onChange={e=>setItem(i,e.target.value)}/><button className="icon-btn" onClick={()=>updatePage({items:page.items.filter((_,j)=>j!==i)})} title="항목 삭제"><X size={14}/></button></div>)}
            <button className="wide secondary" onClick={()=>updatePage({items:[...page.items,'']})}><Plus size={15}/> 항목 추가</button>
          </div>
          <label>하단 메모/CTA<input value={page.note} onChange={e=>updatePage({note:e.target.value})}/></label>
        </section>

        <section>
          <div className="section-head"><h3>비주얼 옵션</h3><ImagePlus size={17}/></div>
          <label className="upload-box"><input type="file" accept="image/*" onChange={uploadImage}/><ImagePlus size={20}/><span>이미지 업로드</span></label>
          {page.imageDataUrl&&<div className="image-actions"><button onClick={()=>updatePage({imageFit:page.imageFit==='contain'?'cover':'contain'})}>맞춤: {page.imageFit||'cover'}</button><button onClick={()=>updatePage({imageDataUrl:undefined})}>이미지 제거</button></div>}
          <label>포인트 컬러<input type="color" value={page.accentOverride||themes[project.theme].accent} onChange={e=>updatePage({accentOverride:e.target.value})}/></label>
          <button className="wide secondary" onClick={()=>updatePage({accentOverride:undefined})}>테마 기본색 복원</button>
        </section>

        <section className="guide-card"><h4>V2 디자인 엔진</h4><p>리멘토의 큰 제목, 여백, 유기적 배경 도형, 정보 카드, 대화/진단/프로세스 문법을 30개 레이아웃으로 분리했습니다. 원고 자동배치는 내용 유형에 맞춰 템플릿을 순환 선택합니다.</p></section>
      </aside>
    </main>

    {galleryOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setGalleryOpen(false)}}>
      <div className="template-modal">
        <div className="modal-head"><div><span className="modal-kicker">RIMENTO TEMPLATE LIBRARY</span><h2>카드뉴스 템플릿 {templateLibrary.length}</h2><p>내용은 그대로 두고 레이아웃만 즉시 바꿀 수 있습니다.</p></div><button className="modal-close" onClick={()=>setGalleryOpen(false)}><X/></button></div>
        <div className="template-controls"><div className="category-tabs"><button className={category==='전체'?'active':''} onClick={()=>setCategory('전체')}>전체 {templateLibrary.length}</button>{templateCategories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="template-search"><Search size={17}/><input value={templateQuery} onChange={e=>setTemplateQuery(e.target.value)} placeholder="템플릿 검색"/></label></div>
        <div className="template-gallery">{filteredTemplates.map((meta,i)=><button key={meta.id} className={`template-card ${page.template===meta.id?'selected':''}`} onClick={()=>selectTemplate(meta.id)}><div className="template-number">{String(templateLibrary.indexOf(meta)+1).padStart(2,'0')}</div><TemplateMini meta={meta} active={page.template===meta.id}/><div className="template-card-copy"><small>{meta.category}</small><b>{meta.name}</b><p>{meta.description}</p><span>{meta.hint}</span></div></button>)}</div>
      </div>
    </div>}
  </div>
}
