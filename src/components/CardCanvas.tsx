import React, { useLayoutEffect, useRef } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUpRight, Bookmark, Briefcase, CalendarCheck, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleCheck, Compass, Gauge, Globe, Heart, Laptop, Lightbulb, Mail, MessageCircle, MoreHorizontal, MousePointer2, Paperclip,
  Phone, PhoneCall, Quote, RotateCw, Search, Send, Sparkles, SquarePen, Star, Target, TrendingUp, UserRound, Users
} from 'lucide-react'
import { CardPage, CardProject, FreeItem, LogoId } from '../types'
import { themes } from '../themes'
import { activeEdits, applyPageEdits } from '../lib/layoutEdits'
import { applyTextEdits } from '../lib/textEdits'
import { applyIconSwaps } from '../lib/iconSwap'
import { iconMap } from '../lib/iconSet'
import { sanitizeRich } from '../lib/richText'
import rimentoLogo from '../assets/logos/rimento-logo-navy-vertical.png'
import rimentoLogoHorizontal from '../assets/logos/rimento-logo-navy-horizontal.png'
import rimentoLogoHorizontalWhite from '../assets/logos/rimento-logo-white-horizontal.png'
import companyLogo from '../assets/logos/company-logo-white.png'
import companyFullLogo from '../assets/logos/company-full-logo.png'

const logoMap: Partial<Record<LogoId, string>> = {
  rimento: rimentoLogo,
  'rimento-horizontal': rimentoLogoHorizontal,
  'rimento-horizontal-white': rimentoLogoHorizontalWhite,
  company: companyLogo,
  'company-full': companyFullLogo,
}

interface Props {
  project: CardProject
  page: CardPage
  pageIndex: number
  exportId?: string
}

const splitPair = (value: string) => {
  const [a, ...rest] = value.split('|')
  return [a?.trim() || '', rest.join('|').trim()]
}

const safeNum = (value: string, fallback = 7) => {
  const n = Number(String(value).replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : fallback
}

const withBreaks = (text: string) =>
  text.split('\n').map((line, i, arr) => <React.Fragment key={i}>{line}{i < arr.length - 1 && <br />}</React.Fragment>)

const titleDensity = (title: string) => {
  const n = title.replace(/\s/g, '').length
  return n > 58 ? 'title-dense' : n > 38 ? 'title-compact' : 'title-normal'
}

/**
 * 항목 늘리기: 원래 디자인 개수(base)까지는 기존 모습 그대로 두고, 넘으면 컨테이너에 data-extended 와 추가 스타일을 붙인다.
 * data-extended 가 붙은 컨테이너는 카드 밖으로 넘치면 fitExtended(layoutEdits.ts)가 줄여서 맞춘다.
 */
const grow = (count: number, base: number, style?: React.CSSProperties) =>
  count > base ? { 'data-extended': count, style } : {}

/** 가로 칸 수가 고정된 그리드가 넘칠 때: 4열까지는 열을 늘리고, 그 이상은 원래 열 수(2열은 3열)로 줄바꿈 */
const extraCols = (count: number, base: number): React.CSSProperties =>
  ({ gridTemplateColumns: `repeat(${count <= 4 ? count : Math.max(base, 3)},1fr)` })

/** Wheel 7개 이상: 가운데 원 둘레에 12시 방향부터 고르게 배치 (스테이지 720×600, 항목 180×100 기준) */
const ringPosition = (i: number, n: number): React.CSSProperties => {
  const a = (i / n) * Math.PI * 2
  return { left: Math.round(270 + 270 * Math.sin(a)), top: Math.round(250 - 245 * Math.cos(a)) }
}

/** Tool Fan 4장 이상: 가운데를 기준으로 좌우로 펼치고 바깥쪽일수록 더 기울인다. 글자가 왼쪽 정렬이라 오른쪽 카드가 위에 오게 쌓는다 */
const fanPosition = (i: number, n: number): React.CSSProperties => {
  const k = i - (n - 1) / 2
  return { transform: `translateX(${k * 165}px) translateY(${Math.abs(k) * 12 - 24}px) rotate(${k * 6}deg)`, zIndex: i + 1 }
}

const bodyDensity = (body: string) => body.length > 220 ? 'body-dense' : body.length > 130 ? 'body-compact' : ''

function BrandHeader({ project, pageIndex }: { project: CardProject; pageIndex: number }) {
  const logoSrc = logoMap[project.logo]
  return (
    <div className="brand-header">
      <div className="issue-mark">
        {logoSrc ? <img className="brand-logo" src={logoSrc} alt=""/> : <span className="issue-symbol">◉</span>}
        <span>{project.issueLabel}</span>
      </div>
      <div className="page-count">{String(pageIndex + 1).padStart(2, '0')} / {String(project.pages.length).padStart(2, '0')}</div>
    </div>
  )
}

function BrandFooter({ project }: { project: CardProject }) {
  const logoSrc = logoMap[project.footerLogo]
  return (
    <div className="brand-footer">
      <span>{project.handle}</span>
      {logoSrc ? <img className="brand-logo footer-logo" src={logoSrc} alt=""/> : <strong>{project.footerText}</strong>}
    </div>
  )
}

function OptionalImage({ page, className = '' }: { page: CardPage; className?: string }) {
  if (!page.imageDataUrl) return null
  return <div className={`media-box ${className}`}><img src={page.imageDataUrl} style={{ objectFit: page.imageFit || 'cover' }} /></div>
}

function PageHead({ page, lead = true }: { page: CardPage; lead?: boolean }) {
  return <>
    <div className="eyebrow">{page.eyebrow}</div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    {lead && page.body && <p className={`lead small ${bodyDensity(page.body)}`}>{page.body}</p>}
  </>
}

function Cover({ page }: { page: CardPage }) {
  return <div className="layout cover-layout">
    <div className="blob blob-a"/><div className="blob blob-b"/><div className="tiny-star star-a">✦</div><div className="tiny-star star-b">✦</div>
    <div className="cover-kicker">{page.eyebrow || 'HR MAGAZINE'}</div>
    <h1 className={titleDensity(page.title)}>{withBreaks(page.title)}</h1>
    <div className="accent-rule"/>
    <p className={`lead ${bodyDensity(page.body)}`}>{page.body}</p>
    <div className="tag-row" {...grow(page.items.length,4)}>{page.items.slice(0,8).map((v,i)=><span key={i}>{v}</span>)}</div>
    <OptionalImage page={page} className="cover-image"/>
    <div className="cover-note">{page.note || 'LEADERS INSIGHT'}</div>
  </div>
}

function CoverQuestion({ page }: { page: CardPage }) {
  const lines = page.title.split('\n')
  const kicker = /^(why|why\?|왜)/i.test(lines[0]) ? lines.shift() : 'Why?'
  return <div className="layout cover-question-layout">
    <div className="question-orb q1"/><div className="question-orb q2"/>
    <div className="question-topline"><span>{page.eyebrow || 'QUESTION'}</span><span>Leaders Insight</span></div>
    <div className="question-word">{kicker}</div>
    <h1 className={titleDensity(lines.join(''))}>{withBreaks(lines.join('\n'))}</h1>
    <div className="question-sub">{page.body}</div>
    <div className="question-card"><b>{page.note || '같은 행동도 역할과 맥락에 따라 영향이 달라집니다.'}</b><ArrowRight size={30}/></div>
    <div className="question-tags" {...grow(page.items.length,3)}>{page.items.slice(0,5).map((x,i)=><span key={i}>{x}</span>)}</div>
  </div>
}

function CoverBrowser({ page }: { page: CardPage }) {
  return <div className="layout cover-browser-layout">
    <div className="browser-window">
      <div className="browser-chrome"><div>−</div><div>□</div><div>×</div></div>
      <div className="browser-search"><Search size={28}/><span>{page.eyebrow || '리멘토 특집호'}</span></div>
      <h1 className={titleDensity(page.title)}>{withBreaks(page.title)}</h1>
      <p className={`lead ${bodyDensity(page.body)}`}>{page.body}</p>
      <div className="keyword-cloud" {...grow(page.items.length,8)}>{page.items.slice(0,12).map((x,i)=><span key={i}>{x}</span>)}</div>
      <OptionalImage page={page} className="browser-image"/>
      <div className="browser-note">{page.note}</div>
    </div>
  </div>
}

function CoverBinder({ page }: { page: CardPage }) {
  return <div className="layout cover-binder-layout">
    <div className="binder-bar"><i/><strong>LEADERS INSIGHT</strong><i/></div>
    <div className="binder-inner">
      <div className="cover-kicker">{page.eyebrow || 'OPEN PROGRAM'}</div>
      <h1 className={titleDensity(page.title)}>{withBreaks(page.title)}</h1>
      <p className={`lead ${bodyDensity(page.body)}`}>{page.body}</p>
      <div className="binder-list" {...grow(page.items.length,6)}>{page.items.slice(0,10).map((x,i)=><div key={i}><span>{i+1}</span><b>{x}</b></div>)}</div>
      {page.note && <div className="binder-note">{page.note}</div>}
    </div>
  </div>
}

function Editorial({ page }: { page: CardPage }) {
  return <div className="layout editorial-layout">
    <PageHead page={page} lead={false}/>
    <div className={`summary-box ${bodyDensity(page.body)}`}>{page.body}</div>
    <OptionalImage page={page}/>
    {page.items.length>0 && <div className="question-list" {...grow(page.items.length,5)}>{page.items.slice(0,8).map((item,i)=><div className="question-item" key={i}><span>{String(i+1).padStart(2,'0')}</span><b>{item}</b></div>)}</div>}
    {page.note && <div className="micro-note">{page.note}</div>}
  </div>
}

function OpeningQuestion({ page }: { page: CardPage }) {
  return <div className="layout opening-question-layout">
    <div className="eyebrow">{page.eyebrow || 'OPENING'}</div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    <div className="opening-panel"><div className="big-question">?</div><p>{page.body}</p></div>
    <div className="question-list compact" {...grow(page.items.length,4)}>{page.items.slice(0,7).map((item,i)=><div className="question-item" key={i}><span>{String(i+1).padStart(2,'0')}</span><b>{item}</b></div>)}</div>
    {page.note && <div className="section-label">{page.note}</div>}
  </div>
}

function KeyQuestions({ page }: { page: CardPage }) {
  return <div className="layout key-question-layout">
    <PageHead page={page}/>
    <div className="key-question-grid" {...grow(page.items.length,5)}>{page.items.slice(0,8).map((item,i)=><div className="key-q-card" key={i}><span>{String(i+1).padStart(2,'0')}</span><div className="key-q-icon"><MessageCircle size={30}/></div><b>{item}</b></div>)}</div>
    {page.note && <div className="note-band">{page.note}</div>}
  </div>
}

function Story({ page }: { page: CardPage }) {
  return <div className="layout story-layout">
    <PageHead page={page} lead={false}/>
    <div className="story-body"><p className={bodyDensity(page.body)}>{page.body}</p><OptionalImage page={page} className="story-image"/></div>
    <div className="story-pairs" {...grow(page.items.length,3)}>{page.items.slice(0,6).map((x,i)=>{const [a,b]=splitPair(x);return <div className="story-pair" key={i}><span>{a || `POINT ${i+1}`}</span><b>{b || x}</b></div>})}</div>
    {page.note && <div className="story-conclusion"><Lightbulb size={30}/><b>{page.note}</b></div>}
  </div>
}

function Dialogue({ page }: { page: CardPage }) {
  return <div className="layout dialogue-layout">
    <PageHead page={page}/>
    <div className="chat-stack" {...grow(page.items.length,5)}>{page.items.slice(0,8).map((item,i)=><div className={`chat-bubble ${i%2?'right':'left'}`} key={i}><Quote size={25}/><b>{item}</b></div>)}</div>
    {page.note && <div className="dialogue-insight"><Sparkles size={26}/><b>{page.note}</b></div>}
  </div>
}

function QuoteFocus({ page }: { page: CardPage }) {
  const quote = page.items[0] || page.body
  return <div className="layout quote-focus-layout">
    <div className="eyebrow">{page.eyebrow || 'QUOTE'}</div>
    <div className="quote-mark">“</div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    <div className="quote-focus-card"><b>{quote}</b></div>
    <p className={`lead small ${bodyDensity(page.body)}`}>{page.items.length ? page.body : ''}</p>
    {page.items.length>1 && <div className="quote-points" {...grow(page.items.length-1,3)}>{page.items.slice(1,7).map((x,i)=><span key={i}>{x}</span>)}</div>}
    {page.note && <div className="micro-note">{page.note}</div>}
  </div>
}

function ListLayout({ page }: { page: CardPage }) {
  return <div className="layout list-layout">
    <PageHead page={page}/>
    <div className={`list-grid count-${Math.min(page.items.length,6)}`} {...grow(page.items.length,6)}>{page.items.slice(0,10).map((item,i)=>{const [label,text]=splitPair(item); return <div className="list-card" key={i}><span className="list-no">{String(i+1).padStart(2,'0')}</span><div><b>{text?label:item}</b>{text&&<p>{text}</p>}</div></div>})}</div>
  </div>
}

function Cards3({ page }: { page: CardPage }) {
  const icons = [Target, Users, TrendingUp]
  return <div className="layout cards-3-layout">
    <PageHead page={page}/>
    <div className="pillars-grid" {...grow(page.items.length,3,extraCols(page.items.length,3))}>{page.items.slice(0,6).map((item,i)=>{const [a,b]=splitPair(item); const Icon=icons[i%icons.length]; return <div className="pillar-card" key={i}><div className="pillar-icon"><Icon size={44}/></div><span>{String(i+1).padStart(2,'0')}</span><b>{a || item}</b>{b&&<p>{b}</p>}</div>})}</div>
    {page.note && <div className="center-note">{page.note}</div>}
  </div>
}

function Cards4({ page }: { page: CardPage }) {
  const icons = [Compass, Gauge, Users, TrendingUp]
  return <div className="layout cards-4-layout">
    <PageHead page={page}/>
    <div className="block-grid" {...grow(page.items.length,4)}>{page.items.slice(0,8).map((item,i)=>{const [a,b]=splitPair(item); const Icon=icons[i % icons.length]; return <div className="block-card" key={i}><div className="block-icon"><Icon size={34}/></div><span>{String(i+1).padStart(2,'0')}</span><b>{a || item}</b>{b&&<p>{b}</p>}</div>})}</div>
    {page.note&&<div className="note-band">{page.note}</div>}
  </div>
}

function Stats({ page }: { page: CardPage }) {
  return <div className="layout stats-layout">
    <PageHead page={page}/>
    <div className="stats-grid" {...grow(page.items.length,6)}>{page.items.slice(0,10).map((item,i)=>{const [value,label]=splitPair(item);return <div className="stat-card" key={i}><strong>{value}</strong><span>{label||`KEY METRIC ${i+1}`}</span></div>})}</div>
    {page.note&&<div className="note-band">{page.note}</div>}
  </div>
}

function StatFocus({ page }: { page: CardPage }) {
  const [value,label] = splitPair(page.items[0] || page.note || '79|핵심 지표')
  return <div className="layout stat-focus-layout">
    <div className="eyebrow">{page.eyebrow || 'DATA'}</div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    <div className="big-stat-wrap"><span className="big-stat-sign">+</span><strong>{value}</strong><i>%</i></div>
    <div className="big-stat-label">{label}</div>
    <p className={`lead small ${bodyDensity(page.body)}`}>{page.body}</p>
    <div className="stat-focus-items" {...grow(page.items.length-1,3)}>{page.items.slice(1,6).map((x,i)=><span key={i}>{x}</span>)}</div>
    {page.note&&<div className="micro-note">{page.note}</div>}
  </div>
}

function ScoreProfile({ page }: { page: CardPage }) {
  return <div className="layout score-profile-layout">
    <PageHead page={page}/>
    <div className="score-panel" {...grow(page.items.length,4)}>{page.items.slice(0,8).map((item,i)=>{const [label,scoreText]=splitPair(item); const score=Math.max(0,Math.min(10,Math.round(safeNum(scoreText,7)))); return <div className="score-row" key={i}><div className="score-label"><CircleCheck size={24}/><b>{label || item}</b></div><div className="dot-scale">{Array.from({length:10}).map((_,j)=><i className={j<score?'on':''} key={j}/>)}</div><strong>{score}</strong></div>})}</div>
    {page.note&&<div className="profile-conclusion"><b>{page.note}</b></div>}
  </div>
}

function BarProfile({ page }: { page: CardPage }) {
  return <div className="layout bar-profile-layout">
    <PageHead page={page}/>
    <div className="bar-list" {...grow(page.items.length,6)}>{page.items.slice(0,10).map((item,i)=>{const [label,valueText]=splitPair(item); const raw=safeNum(valueText,70); const pct=raw<=10?raw*10:Math.min(raw,100); return <div className="bar-row" key={i}><div className="bar-meta"><b>{label || item}</b><strong>{valueText || `${Math.round(pct)}%`}</strong></div><div className="bar-track"><i style={{width:`${pct}%`}}/></div></div>})}</div>
    {page.note&&<div className="note-band">{page.note}</div>}
  </div>
}

function Process({ page }: { page: CardPage }) {
  return <div className="layout process-layout">
    <PageHead page={page}/>
    <div className="process-list" {...grow(page.items.length,5)}>{page.items.slice(0,9).map((item,i)=>{const [label,text]=splitPair(item);return <div className="process-row" key={i}><div className="process-step">STEP {i+1}</div><div className="process-dot"><Sparkles size={28}/></div><div className="process-copy"><b>{label||item}</b>{text&&<p>{text}</p>}</div>{i<page.items.length-1&&<ChevronRight className="process-arrow" size={30}/>}</div>})}</div>
  </div>
}

function Timeline({ page }: { page: CardPage }) {
  return <div className="layout timeline-layout">
    <PageHead page={page}/>
    <div className="timeline-line" {...grow(page.items.length,5,{ gridTemplateColumns: `repeat(${Math.min(page.items.length,7)},1fr)` })}>{page.items.slice(0,7).map((item,i)=>{const [a,b]=splitPair(item);return <div className="timeline-node" key={i}><div className="timeline-dot">{i+1}</div><div className="timeline-copy"><b>{a||item}</b>{b&&<p>{b}</p>}</div></div>})}</div>
    {page.note&&<div className="timeline-note">{page.note}</div>}
  </div>
}

function StepCards({ page }: { page: CardPage }) {
  return <div className="layout step-cards-layout">
    <PageHead page={page}/>
    <div className="step-card-grid" {...grow(page.items.length,4)}>{page.items.slice(0,8).map((item,i)=>{const [a,b]=splitPair(item);return <div className="step-card" key={i}><span>STEP {String(i+1).padStart(2,'0')}</span><div className="step-number">{i+1}</div><b>{a||item}</b>{b&&<p>{b}</p>}</div>})}</div>
    {page.note&&<div className="note-band">{page.note}</div>}
  </div>
}

function Comparison({ page }: { page: CardPage }) {
  return <div className="layout comparison-layout">
    <PageHead page={page}/>
    <div className="compare-grid" {...grow(page.items.length,2,extraCols(page.items.length,2))}>{page.items.slice(0,3).map((item,i)=>{const [label,text]=splitPair(item);return <div className={`compare-card ${i?'after':'before'}`} key={i}><span>{label||(i?'B':'A')}</span><b>{text||item}</b></div>})}</div>
    {page.note&&<div className="compare-bottom">{page.note}</div>}
  </div>
}

function BeforeAfter({ page }: { page: CardPage }) {
  const first=splitPair(page.items[0]||'BEFORE|기존 행동')
  const second=splitPair(page.items[1]||'AFTER|새로운 행동')
  return <div className="layout before-after-layout">
    <PageHead page={page}/>
    <div className="behavior-flow"><div className="behavior-card before"><span>{first[0]||'BEFORE'}</span><b>{first[1]||first[0]}</b></div><div className="behavior-arrow"><ArrowRight size={56}/></div><div className="behavior-card after"><span>{second[0]||'AFTER'}</span><b>{second[1]||second[0]}</b></div></div>
    {page.note&&<div className="behavior-note"><Sparkles size={28}/><b>{page.note}</b></div>}
  </div>
}

function Checklist({ page }: { page: CardPage }) {
  return <div className="layout checklist-layout">
    <PageHead page={page}/>
    <div className="check-list" {...grow(page.items.length,6)}>{page.items.slice(0,10).map((item,i)=><div className="check-row" key={i}><span className="checkbox"><Check size={25}/></span><b>{item}</b></div>)}</div>
    {page.note&&<div className="save-chip">{page.note}</div>}
  </div>
}

function Insight({ page }: { page: CardPage }) {
  return <div className="layout insight-layout">
    <PageHead page={page} lead={false}/>
    <div className="insight-main"><Lightbulb size={58}/><p>{page.body}</p></div>
    <div className="insight-list" {...grow(page.items.length,4)}>{page.items.slice(0,8).map((item,i)=>{const [a,b]=splitPair(item);return <div key={i}><span>{String(i+1).padStart(2,'0')}</span><section><b>{a||item}</b>{b&&<p>{b}</p>}</section></div>})}</div>
    {page.note&&<div className="insight-bottom">{page.note}</div>}
  </div>
}

function Matrix({ page }: { page: CardPage }) {
  return <div className="layout matrix-layout">
    <PageHead page={page}/>
    <div className="matrix-grid" {...grow(page.items.length,4,{ gridTemplateColumns: 'repeat(3,1fr)' })}>{page.items.slice(0,6).map((item,i)=>{const [a,b]=splitPair(item);return <div className={`matrix-cell cell-${i+1}`} key={i}><span>{String(i+1).padStart(2,'0')}</span><b>{a||item}</b>{b&&<p>{b}</p>}</div>})}<div className="matrix-center">{page.note||'FRAMEWORK'}</div></div>
  </div>
}

function Wheel({ page }: { page: CardPage }) {
  const positions=['top','right-top','right-bottom','bottom','left-bottom','left-top']
  return <div className="layout wheel-layout">
    <PageHead page={page}/>
    <div className="wheel-stage" {...grow(page.items.length,6)}><div className="wheel-center"><Compass size={46}/><b>{page.note||'핵심 역할'}</b></div>{page.items.slice(0,8).map((item,i,all)=>{const [a,b]=splitPair(item); return <div className={`wheel-item ${all.length>6 ? 'ring' : positions[i]}`} style={all.length>6 ? ringPosition(i, all.length) : undefined} key={i}><span>{i+1}</span><b>{a||item}</b>{b&&<small>{b}</small>}</div>})}</div>
  </div>
}

function Testimonial({ page }: { page: CardPage }) {
  return <div className="layout testimonial-layout">
    <PageHead page={page}/>
    <div className="testimonial-grid" {...grow(page.items.length,3,extraCols(page.items.length,3))}>{page.items.slice(0,6).map((item,i)=>{const [quote,role]=splitPair(item);return <div className="testimonial-card" key={i}><div className="testimonial-icon"><UserRound size={34}/></div><Quote size={30}/><b>{quote||item}</b>{role&&<span>{role}</span>}</div>})}</div>
    {page.note&&<div className="center-note">{page.note}</div>}
  </div>
}

function ProgramInfo({ page }: { page: CardPage }) {
  const icons=[Briefcase, Users, Gauge, CircleCheck, Globe]
  return <div className="layout program-info-layout">
    <PageHead page={page} lead={false}/>
    <div className="program-summary">{page.body}</div>
    <div className="program-table" {...grow(page.items.length,5)}>{page.items.slice(0,9).map((item,i)=>{const [a,b]=splitPair(item); const Icon=icons[i%icons.length]; return <div className="program-row" key={i}><div className="program-key"><Icon size={26}/><b>{a||`안내 ${i+1}`}</b></div><div className="program-value">{b||item}</div></div>})}</div>
    {page.note&&<div className="program-note">{page.note}</div>}
  </div>
}

function CTA({ page, project }: { page: CardPage; project: CardProject }) {
  const iconFor=(x:string)=>x.includes('@')?Mail:x.includes('http')||x.includes('.co')?Globe:Phone
  return <div className="layout cta-layout">
    <div className="eyebrow">{page.eyebrow||'CONTACT'}</div>
    <div className="cta-orb"><Sparkles size={84}/></div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    <p className={`lead ${bodyDensity(page.body)}`}>{page.body}</p>
    <div className="contact-box" {...grow(page.items.length,4)}>{page.items.slice(0,8).map((item,i)=>{const Icon=iconFor(item);return <div key={i}><Icon size={23}/><b>{item}</b></div>})}</div>
    <div className="cta-button">{page.note||`${project.brandName} 더 알아보기`}<ChevronRight size={27}/></div>
  </div>
}

function Closing({ page, project }: { page: CardPage; project: CardProject }) {
  return <div className="layout closing-layout">
    <div className="closing-spark">✦</div>
    <div className="eyebrow">{page.eyebrow||'CLOSING'}</div>
    <div className="closing-quote">“</div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    <p className={`lead ${bodyDensity(page.body)}`}>{page.body}</p>
    {page.items.length>0&&<div className="closing-values" {...grow(page.items.length,4)}>{page.items.slice(0,8).map((x,i)=><span key={i}>{x}</span>)}</div>}
    <div className="closing-sign"><Star size={24}/><b>{page.note||project.brandName}</b></div>
  </div>
}

/* ---------- Penpot 구조 참고 템플릿 ---------- */

// 'a|b' 항목에서 b가 없으면 a를 본문으로, 라벨은 기본값으로 쓴다
const labelText = (item: string, fallback: string) => {
  const [a, b] = splitPair(item)
  return b ? [a, b] : [fallback, a]
}

function Persona({ page }: { page: CardPage }) {
  const icons = [Briefcase, Target, Users, Lightbulb]
  const tags = page.note.split(/[,#]/).map(v => v.trim()).filter(Boolean)
  return <div className="layout persona-layout">
    <div className="eyebrow">{page.eyebrow || 'PERSONA'}</div>
    <div className="persona-card">
      <div className="persona-photo"><div className="persona-blob"/>{page.imageDataUrl ? <img src={page.imageDataUrl} style={{ objectFit: page.imageFit || 'cover' }}/> : <UserRound size={130}/>}</div>
      <div><h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>{page.body && <p className="persona-quote">{page.body}</p>}</div>
    </div>
    <div className="persona-attrs" {...grow(page.items.length,4)}>{page.items.slice(0,6).map((item,i)=>{const [a,b]=labelText(item,`POINT ${i+1}`); const Icon=icons[i % icons.length]; return <div className="persona-attr" key={i}><span><Icon size={26}/></span><div><small>{a}</small><b>{b}</b></div></div>})}</div>
    {tags.length>0 && <div className="persona-tags">{tags.slice(0,5).map((t,i)=><span key={i}>#{t}</span>)}</div>}
  </div>
}

function EmpathyMap({ page }: { page: CardPage }) {
  const labels = ['SAYS','THINKS','DOES','FEELS']
  return <div className="layout empathy-layout">
    <PageHead page={page}/>
    <div className="empathy-stage">
      {labels.map((label,i)=>{const [a,b]=labelText(page.items[i] || '', label); return <div className={`empathy-cell e${i+1}`} key={i}><span>{a}</span><b>{b}</b></div>})}
      <div className="empathy-center"><UserRound size={58}/><b>{page.note || '구성원'}</b></div>
    </div>
  </div>
}

function CsdBoard({ page }: { page: CardPage }) {
  const heads = [['C','확실한 것'],['S','가정'],['D','의문']]
  const cols: string[][] = [[],[],[]]
  page.items.slice(0,15).forEach((item,i)=>{
    const [a,b]=splitPair(item)
    const col = /^(c|확실)/i.test(a) ? 0 : /^(s|가정)/i.test(a) ? 1 : /^(d|의문|질문)/i.test(a) ? 2 : i % 3
    cols[col].push(b || a)
  })
  return <div className="layout csd-layout">
    <PageHead page={page}/>
    <div className="csd-board" {...grow(page.items.length,9)}>{heads.map(([letter,name],i)=><div className={`csd-col c${i+1}`} key={i}>
      <div className="csd-head"><b>{name}</b><em>{letter}</em></div>
      {cols[i].map((text,j)=><div className="csd-note" key={j}>{text}</div>)}
    </div>)}</div>
    {page.note && <div className="note-band">{page.note}</div>}
  </div>
}

function DecisionFlow({ page }: { page: CardPage }) {
  return <div className="layout decision-layout">
    <PageHead page={page} lead={false}/>
    <div className="flow-start">{page.body || '이 상황에서 먼저 확인할 것은?'}</div>
    <div className="flow-stem"/><div className="flow-split"/>
    <div className="flow-branches">{[0,1].map(k=>{const [label,text]=labelText(page.items[k] || '', k ? '아니오' : '예'); const next=page.items[k+2]; return <div className={`flow-branch ${k?'no':'yes'}`} key={k}>
      <span className="flow-tag">{label}</span>
      <div className="flow-result"><b>{text}</b></div>
      {next && <><ArrowDown className="flow-arrow" size={34}/><div className="flow-next">{next}</div></>}
    </div>})}</div>
    {page.note && <div className="note-band flow-merge">{page.note}</div>}
  </div>
}

function Swimlane({ page }: { page: CardPage }) {
  const lanes = page.items.slice(0,6).map(item=>{const [role,steps]=splitPair(item); return { role, steps: steps.split('>').map(s=>s.trim()) }})
  const cols = Math.min(6, Math.max(1, ...lanes.map(l=>l.steps.length)))
  return <div className="layout swimlane-layout">
    <PageHead page={page}/>
    <div className="swim-board" style={{ ['--cols' as string]: cols }} {...(lanes.length > 4 || cols > 4 ? { 'data-extended': lanes.length } : {})}>
      <div className="swim-head"><span>ROLE</span>{Array.from({length:cols}).map((_,j)=><span key={j}>STEP {j+1}</span>)}</div>
      {lanes.map((lane,i)=><div className="swim-lane" key={i}>
        <div className="swim-role">{lane.role}</div>
        {Array.from({length:cols}).map((_,j)=><div className={`swim-cell ${lane.steps[j] && lane.steps[j-1] ? 'linked' : ''}`} key={j}>{lane.steps[j] && <div className="swim-step">{lane.steps[j]}</div>}</div>)}
      </div>)}
    </div>
    {page.note && <div className="note-band">{page.note}</div>}
  </div>
}

function CardStack({ page }: { page: CardPage }) {
  return <div className="layout stack-layout">
    <PageHead page={page}/>
    <div className="stack-list" {...grow(page.items.length,5)}>{page.items.slice(0,8).map((item,i)=>{const [a,b]=splitPair(item); return <div className="stack-card" key={i}><span>{String(i+1).padStart(2,'0')}</span><div><b>{a}</b>{b && <p>{b}</p>}</div></div>})}</div>
  </div>
}

function ToolFan({ page }: { page: CardPage }) {
  const icons = [Compass, MessageCircle, Target]
  const tools = page.items.slice(0,5).map(item=>splitPair(item))
  return <div className="layout fan-layout">
    <PageHead page={page}/>
    <div className="fan-stage" {...grow(tools.length,3)}>{tools.map(([a],i)=>{const Icon=icons[i % icons.length]; return <div className={`fan-card ${tools.length>3 ? 'spread' : `f${i+1}`}`} style={tools.length>3 ? fanPosition(i, tools.length) : undefined} key={i}><div className="fan-top"><Icon size={72}/></div><div className="fan-body"><span>CARD {String(i+1).padStart(2,'0')}</span><b>{a}</b></div></div>})}</div>
    <div className="fan-desc">{tools.map(([a,b],i)=><div key={i}><span>{String(i+1).padStart(2,'0')}</span><p><b>{a}</b>{b && ` — ${b}`}</p></div>)}</div>
  </div>
}

function ExpertProfile({ page }: { page: CardPage }) {
  return <div className="layout expert-layout">
    <div className="expert-panel">
      {page.imageDataUrl ? <img src={page.imageDataUrl} style={{ objectFit: page.imageFit || 'cover' }}/> : <div className="expert-initial">{page.title.trim().charAt(0)}</div>}
      <div className="expert-role">{page.eyebrow || 'EXPERT'}</div>
    </div>
    <div className="expert-copy">
      <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
      {page.body && <p className={`lead small ${bodyDensity(page.body)}`}>{page.body}</p>}
      <div className="expert-skills" {...grow(page.items.length,4)}>{page.items.slice(0,6).map((item,i)=>{const [a,b]=splitPair(item); return <div className="expert-skill" key={i}><b>{a}</b>{b && <p>{b}</p>}</div>})}</div>
      {page.note && <div className="expert-quote">“{page.note}”</div>}
    </div>
  </div>
}

function Bingo({ page }: { page: CardPage }) {
  const cells = Array.from({length:9}).map((_,i)=>{
    const item = page.items[i]
    if (!item) return null
    const [a,b] = splitPair(item)
    const done = !!b && /^(v|✓|✔|o|done|완료)$/i.test(a)
    return { done, text: done ? b : item }
  })
  return <div className="layout bingo-layout">
    <PageHead page={page}/>
    <div className="bingo-grid">{cells.map((cell,i)=>cell
      ? <div className={`bingo-cell ${cell.done?'done':''}`} key={i}><span>{String(i+1).padStart(2,'0')}</span>{cell.done && <Check className="bingo-check" size={120}/>}<b>{cell.text}</b></div>
      : <div className="bingo-cell empty" key={i}/>)}</div>
    {page.note && <div className="center-note">{page.note}</div>}
  </div>
}

function Donut({ page }: { page: CardPage }) {
  const colors = ['var(--accent)','var(--accent2)','color-mix(in srgb,var(--accent) 40%,var(--paper))','var(--line)','color-mix(in srgb,var(--accent2) 45%,var(--paper))','var(--muted)']
  const data = page.items.slice(0,6).map(item=>{const [label,raw]=splitPair(item); return { label, raw, value: Math.max(0, safeNum(raw, 25)) }})
  const total = data.reduce((s,d)=>s+d.value,0) || 1
  const r = 170, C = 2 * Math.PI * r
  let acc = 0
  return <div className="layout donut-layout">
    <PageHead page={page}/>
    <div className="donut-wrap">
      <div className="donut">
        <svg viewBox="0 0 440 440"><circle cx="220" cy="220" r={r} fill="none" stroke="var(--soft)" strokeWidth="64"/>
          {data.map((d,i)=>{const len=d.value/total*C; const el=<circle key={i} cx="220" cy="220" r={r} fill="none" strokeWidth="64" style={{ stroke: colors[i] }} strokeDasharray={`${len} ${C-len}`} strokeDashoffset={-acc} transform="rotate(-90 220 220)"/>; acc+=len; return el})}
        </svg>
        {data[0] && <div className="donut-center"><strong>{data[0].raw || `${Math.round(data[0].value/total*100)}%`}</strong><span>{data[0].label}</span></div>}
      </div>
      <div className="donut-legend" {...grow(data.length,4)}>{data.map((d,i)=><div className="donut-row" key={i}><i style={{ background: colors[i] }}/><b>{d.label}</b><strong>{d.raw || `${Math.round(d.value/total*100)}%`}</strong></div>)}</div>
    </div>
    {page.note && <div className="note-band">{page.note}</div>}
  </div>
}

/* ---------- Figma Community 구조 참고 템플릿 ---------- */

function CoverType({ page }: { page: CardPage }) {
  return <div className="layout cover-type-layout">
    <div className="type-label">{page.eyebrow || 'HR INSIGHT'}</div>
    <h1 className={titleDensity(page.title)}>{withBreaks(page.title)}</h1>
    {page.items.length>0 && <div className="type-index" {...grow(page.items.length,3)}>{page.items.slice(0,6).map((x,i)=><span key={i}>{String(i+1).padStart(2,'0')} {x}</span>)}</div>}
    <div className="type-bottom"><p className={`lead ${bodyDensity(page.body)}`}>{page.body}</p><div className="type-swipe"><ArrowRight size={44}/></div></div>
  </div>
}

function CoverSwipe({ page }: { page: CardPage }) {
  return <div className="layout cover-swipe-layout">
    <div className="swipe-circle"/><div className="swipe-blob"/>
    <div className="cover-kicker">{page.eyebrow || 'SERIES'}</div>
    <h1 className={titleDensity(page.title)}>{withBreaks(page.title)}</h1>
    <div className="accent-rule"/>
    <p className={`lead ${bodyDensity(page.body)}`}>{page.body}</p>
    <div className="tag-row" {...grow(page.items.length,3)}>{page.items.slice(0,6).map((v,i)=><span key={i}>{v}</span>)}</div>
    <div className="swipe-hint"><span>{page.note || '옆으로 넘겨보세요'}</span><i><ArrowRight size={26}/></i></div>
  </div>
}

function CoverBook({ page }: { page: CardPage }) {
  return <div className="layout cover-book-layout">
    <div className="book">
      <div className="book-spine"/>
      <div className="book-top">{page.eyebrow || 'GUIDE BOOK'}</div>
      <h1 className={titleDensity(page.title)}>{withBreaks(page.title)}</h1>
      <div className="book-rule"/>
      <div className="book-author">{page.note || 'LEADERS INSIGHT'}</div>
    </div>
    {page.body && <p className={`lead book-caption ${bodyDensity(page.body)}`}>{page.body}</p>}
    {page.items.length>0 && <div className="tag-row" {...grow(page.items.length,4)}>{page.items.slice(0,6).map((v,i)=><span key={i}>{v}</span>)}</div>}
  </div>
}

function CoverPhoto({ page }: { page: CardPage }) {
  const lines = page.title.split('\n')
  return <div className="layout cover-photo-layout">
    {page.imageDataUrl
      ? <img className="photo-bg" src={page.imageDataUrl} style={{ objectFit: page.imageFit || 'cover' }}/>
      : <><div className="photo-orb o1"/><div className="photo-orb o2"/></>}
    <div className="photo-shade"/>
    <div className="photo-tag">{page.eyebrow || 'HR ISSUE'}</div>
    <div className="photo-copy">
      <h1 className={titleDensity(page.title)}>{lines.map((line,i)=><React.Fragment key={i}>{i===lines.length-1 && lines.length>1 ? <em>{line}</em> : line}{i<lines.length-1 && <br/>}</React.Fragment>)}</h1>
      {page.body && <p>{page.body}</p>}
      {page.note && <div className="photo-note">{page.note}</div>}
    </div>
  </div>
}

function CoverIssue({ page, project }: { page: CardPage; project: CardProject }) {
  const num = page.note || project.issueLabel.replace(/\D/g,'') || '01'
  return <div className="layout cover-issue-layout">
    <div className="issue-main">
      <div className="cover-kicker">{page.eyebrow || 'MONTHLY HR'}</div>
      <h1 className={titleDensity(page.title)}>{withBreaks(page.title)}</h1>
      <div className="accent-rule"/>
      <p className={`lead ${bodyDensity(page.body)}`}>{page.body}</p>
    </div>
    <div className="issue-side">
      <span>ISSUE</span><strong style={{ fontSize: num.length>2 ? 112 : 150 }}>{num}</strong>
      <div className="issue-contents" {...grow(page.items.length,5)}><small>IN THIS ISSUE</small>{page.items.slice(0,7).map((x,i)=><div key={i}><i>{i+1}</i><b>{x}</b></div>)}</div>
    </div>
  </div>
}

function SeriesProgress({ page, project, pageIndex }: { page: CardPage; project: CardProject; pageIndex: number }) {
  return <div className="layout progress-layout">
    <div className="progress-bar">{project.pages.map((_,i)=><i className={i<=pageIndex?'on':''} key={i}/>)}</div>
    <div className="progress-meta"><span className="progress-no">{String(pageIndex+1).padStart(2,'0')}</span><span className="eyebrow">{page.eyebrow}</span></div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    {page.body && <p className={`lead small ${bodyDensity(page.body)}`}>{page.body}</p>}
    <div className="progress-points" {...grow(page.items.length,4)}>{page.items.slice(0,6).map((item,i)=>{const [a,b]=splitPair(item); return <div className="progress-point" key={i}><span>{String(i+1).padStart(2,'0')}</span><div><b>{a}</b>{b && <p>{b}</p>}</div></div>})}</div>
    {page.note && <div className="progress-next">{page.note}<ArrowRight size={26}/></div>}
  </div>
}

function NewsBrief({ page }: { page: CardPage }) {
  return <div className="layout brief-layout">
    <div className="brief-head">
      <div className="eyebrow">{page.eyebrow || 'BRIEF'}</div>
      <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
      {page.body && <p>{page.body}</p>}
    </div>
    <div className="brief-grid" {...grow(page.items.length,3)}>{page.items.slice(0,6).map((item,i)=>{const [a,b]=splitPair(item); return <div className="brief-card" key={i}>
      <div className="brief-thumb">{i===0 && page.imageDataUrl ? <img src={page.imageDataUrl} style={{ objectFit: page.imageFit || 'cover' }}/> : String(i+1).padStart(2,'0')}</div>
      <div className="brief-copy"><b>{a}</b>{b && <p>{b}</p>}</div>
    </div>})}</div>
    {page.note && <div className="brief-link">{page.note}<ChevronRight size={22}/></div>}
  </div>
}

function PostMock({ page, project }: { page: CardPage; project: CardProject }) {
  const handle = project.handle.replace(/^@/,'')
  return <div className="layout post-layout">
    <div className="post-frame">
      <div className="post-top"><div className="post-avatar">{(project.brandName || 'R').charAt(0)}</div><div><b>{handle}</b><small>{page.eyebrow}</small></div><MoreHorizontal size={28}/></div>
      <div className={`post-visual ${page.imageDataUrl ? 'has-image' : ''}`}>
        {page.imageDataUrl && <img src={page.imageDataUrl} style={{ objectFit: page.imageFit || 'cover' }}/>}
        <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
      </div>
      <div className="post-actions"><Heart size={30}/><MessageCircle size={30}/><Send size={30}/><Bookmark className="right" size={30}/></div>
      {page.body && <p className="post-caption"><b>{handle}</b>{page.body}</p>}
      {page.items.length>0 && <div className="post-tags" {...grow(page.items.length,6)}>{page.items.slice(0,12).map((x,i)=><span key={i}>#{x.replace(/^#/,'')}</span>)}</div>}
    </div>
    {page.note && <div className="center-note">{page.note}</div>}
  </div>
}

function Bento({ page }: { page: CardPage }) {
  return <div className="layout bento-layout">
    <PageHead page={page}/>
    <div className="bento-grid" {...grow(page.items.length,5)}>{page.items.slice(0,7).map((item,i)=>{const [a,b]=labelText(item,`TOPIC ${i+1}`); return <div className={`bento-tile t${i+1}`} key={i}><span>{a}</span><ArrowUpRight size={30}/><b>{b}</b></div>})}</div>
    {page.note && <div className="note-band">{page.note}</div>}
  </div>
}

function SaveCard({ page }: { page: CardPage }) {
  return <div className="layout save-layout">
    <div className="save-ribbon"><Bookmark size={44}/></div>
    <PageHead page={page}/>
    <div className="save-list" {...grow(page.items.length,5)}>{page.items.slice(0,8).map((item,i)=>{const [a,b]=splitPair(item); return <div className="save-item" key={i}><span>{i+1}</span><div><b>{a}</b>{b && <p>{b}</p>}</div></div>})}</div>
    <div className="save-bar"><div><Heart size={26}/><MessageCircle size={26}/><Send size={26}/></div><b>{page.note || '저장해두고 필요할 때 다시 보세요'}</b><Bookmark size={26}/></div>
  </div>
}

/* ---------- 캡처 기반 추가 템플릿 ---------- */

/** 항목 설명을 목록으로: 줄바꿈 · '/' · ',' 로 나누고 앞의 '-' 는 뺀다 */
const bulletsOf = (text: string) => text.split(/\n|\/|,/).map(v => v.replace(/^\s*[-•]\s*/, '').trim()).filter(Boolean)

function BrowserColumns({ page, project }: { page: CardPage; project: CardProject }) {
  const icons = [SquarePen, Bookmark, Lightbulb, Target]
  return <div className="layout bcol-layout">
    <div className="bcol-frame">
      <div className="bcol-chrome"><i/><i/><i/><span className="bcol-tab"><em>{(project.brandName || 'R').charAt(0)}</em>{project.brandName}</span></div>
      <div className="bcol-url"><ChevronLeft size={26}/><ChevronRight size={26}/><RotateCw size={22}/><span>www.leadersinsight.co.kr</span><Star size={22}/></div>
    </div>
    <div className="bcol-chip">{page.eyebrow || 'Chapter 01'}<Search size={18}/></div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    {page.body && <p className={`bcol-lead ${bodyDensity(page.body)}`}>{page.body}</p>}
    <div className="bcol-grid" {...grow(page.items.length, 2, extraCols(page.items.length, 2))}>{page.items.slice(0, 4).map((item, i) => {
      const [a, b] = splitPair(item); const Icon = icons[i % icons.length]
      return <div className="bcol-card" key={i}><div className="bcol-card-head"><b>{a || item}</b><span><Icon size={34}/></span></div>{b && <p>{b}</p>}</div>
    })}</div>
    {page.note && <div className="bcol-note">{page.note}</div>}
  </div>
}

function StickerFlow({ page }: { page: CardPage }) {
  const icons = [CalendarCheck, PhoneCall, Mail, Users, Target]
  const n = Math.min(Math.max(page.items.length, 1), 5)
  return <div className="layout stk-layout">
    <div className="stk-clip"><Paperclip size={84}/></div>
    <div className="stk-strip">{page.eyebrow || '01 인포그래픽'}</div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    {page.body && <p className={`stk-lead ${bodyDensity(page.body)}`}>{page.body}</p>}
    <div className="stk-flow" {...grow(page.items.length, 3)} style={{ gridTemplateColumns: `repeat(${n},minmax(0,1fr))` }}>{page.items.slice(0, 5).map((item, i, all) => {
      const [a, b] = splitPair(item); const Icon = icons[i % icons.length]
      return <div className="stk-step" key={i}>
        <div className="stk-circle"><Icon size={70} strokeWidth={1.6}/></div>
        {i < all.length - 1 && <ChevronRight className="stk-arrow" size={30}/>}
        <div className="stk-pill is-title">{a || item}</div>
        {bulletsOf(b).map((t, j) => <div className="stk-pill" key={j}>{t}</div>)}
      </div>
    })}</div>
    {page.note && <div className="stk-note">{page.note}</div>}
  </div>
}

function ArcSteps({ page }: { page: CardPage }) {
  const n = Math.min(Math.max(page.items.length, 1), 5)
  return <div className="layout arc-layout">
    <div className="arc-clip"><Paperclip size={96}/></div>
    <div className="arc-eyebrow">{page.eyebrow || '전략 수립'}</div>
    <div className="arc-head">
      <span>{page.note || 'Strategy'}</span>
      <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
      {page.body && <p>{page.body}</p>}
    </div>
    <div className="arc-steps" {...grow(page.items.length, 3)} style={{ gridTemplateColumns: `repeat(${n},minmax(0,1fr))` }}>{page.items.slice(0, 5).map((item, i) => {
      const [a, b] = splitPair(item)
      return <div className="arc-step" key={i}>
        <div className="arc-pill">STEP {i + 1}</div>
        <b>{a || item}</b>
        {bulletsOf(b).map((t, j) => <p key={j}>- {t}</p>)}
      </div>
    })}</div>
  </div>
}

/** Keyword Map: 키워드 자리(가로·세로 %, 크기) — 첫 번째가 가장 크고 커서가 붙는다 */
const keywordSlots: [number, number, 'xl' | 'lg' | 'md' | 'sm'][] = [
  [50, 46, 'xl'], [26, 12, 'md'], [74, 14, 'lg'], [16, 70, 'sm'], [82, 50, 'sm'], [70, 82, 'lg'], [40, 92, 'md'],
  [12, 36, 'sm'], [56, 12, 'sm'], [88, 88, 'sm'],
]

function KeywordScatter({ page }: { page: CardPage }) {
  return <div className="layout kws-layout">
    <div className="kws-frame"><div className="kws-chrome"><i/><i/><i/><span><ChevronLeft size={18}/></span><span><ChevronRight size={18}/></span></div></div>
    <div className="kws-chip"><Search size={20}/>{page.eyebrow || 'Chapter 01'}</div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    <div className="kws-field" {...grow(page.items.length, 7)}>{page.items.slice(0, 10).map((item, i) => {
      const [x, y, size] = keywordSlots[i]
      return <div className={`kws-tag is-${size} tone-${i === 0 ? 0 : 1 + (i - 1) % 3}`} key={i} style={{ left: `${x}%`, top: `${y}%` }}>
        {item.trim().startsWith('#') ? item : `# ${item}`}{i === 0 && <MousePointer2 className="kws-cursor" size={40} fill="currentColor"/>}
      </div>
    })}</div>
    {(page.body || page.note) && <div className={`kws-desc ${bodyDensity(page.body || page.note)}`}>{page.body || page.note}</div>}
  </div>
}

function CoverNewsletter({ page }: { page: CardPage }) {
  return <div className="layout nlc-layout">
    <h1 className={titleDensity(page.title)}>{withBreaks(page.title)}<span className="nlc-burst"/></h1>
    {page.body && <p className={`nlc-lead ${bodyDensity(page.body)}`}>{page.body}</p>}
    <div className="nlc-visual">
      {page.imageDataUrl
        ? <img src={page.imageDataUrl} style={{ objectFit: page.imageFit || 'contain' }}/>
        : <><div className="nlc-dots"/><i className="nlc-ray r1"/><i className="nlc-ray r2"/><i className="nlc-ray r3"/></>}
    </div>
    <div className="nlc-issue"><span>{page.eyebrow || 'VOL.01'}</span><b>{page.note || '1월호'}</b></div>
  </div>
}

function StepDetail({ page }: { page: CardPage }) {
  const icons = [Lightbulb, Users, Mail, Target, Compass]
  const n = Math.min(Math.max(page.items.length, 1), 5)
  return <div className="layout sd-layout">
    <div className="sd-step">{page.eyebrow || 'STEP 01'}</div>
    {page.note && <div className="sd-bubble">{page.note}</div>}
    <div className="sd-mark"><Target size={170} strokeWidth={1}/></div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    <div className="sd-rule"/>
    {page.body && <p className={`sd-body ${bodyDensity(page.body)}`}>{page.body}</p>}
    <div className="sd-pill">확인할 포인트</div>
    <div className="sd-cards" {...grow(page.items.length, 3)} style={{ gridTemplateColumns: `repeat(${n},minmax(0,1fr))` }}>{page.items.slice(0, 5).map((item, i, all) => {
      const [a, b] = splitPair(item); const Icon = icons[i % icons.length]
      return <div className="sd-card" key={i}>
        <Icon size={64} strokeWidth={1.3}/><b>{a || item}</b>{b && <p>{b}</p>}
        {i < all.length - 1 && <span className="sd-next"><ChevronRight size={22}/></span>}
      </div>
    })}</div>
  </div>
}

function BeforeAfterList({ page }: { page: CardPage }) {
  // 'B|문장' / 'A|문장' 으로 나눈다. 표시가 없으면 앞 절반은 BEFORE, 뒤 절반은 AFTER
  const before: string[] = []
  const after: string[] = []
  const half = Math.ceil(page.items.length / 2)
  page.items.slice(0, 12).forEach((item, i) => {
    const [a, b] = splitPair(item)
    if (b && /^(b|before|전|기존)$/i.test(a)) before.push(b)
    else if (b && /^(a|after|후|개선)$/i.test(a)) after.push(b)
    else (i < half ? before : after).push(item)
  })
  return <div className="layout bal-layout">
    <div className="eyebrow">{page.eyebrow || 'COMPARE'}</div>
    <h2 className={titleDensity(page.title)}>{withBreaks(page.title)}</h2>
    <div className="bal-rule"/>
    <div className="bal-label">BEFORE</div>
    <div className="bal-box is-before">
      <span className="bal-icon"><Laptop size={62} strokeWidth={1.4}/></span>
      <ul {...grow(before.length, 3)}>{before.slice(0, 6).map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
    <div className="bal-arrow"><ChevronDown size={48} strokeWidth={3}/></div>
    <div className="bal-label is-after">AFTER</div>
    <div className="bal-box is-after">
      <span className="bal-icon"><Lightbulb size={62} strokeWidth={1.4}/></span>
      <ul {...grow(after.length, 3)}>{after.slice(0, 6).map((t, i) => <li key={i}>{t}</li>)}</ul>
    </div>
    {page.note && <div className="bal-note">{page.note}</div>}
  </div>
}

/** 직접 추가한 이미지·텍스트 박스 층 (템플릿·헤더·푸터 위) */
function FreeLayer({ items }: { items?: FreeItem[] }) {
  if (!items?.length) return null
  return <div className="free-layer">
    {items.map(item => {
      const box: React.CSSProperties = { left: item.x, top: item.y, width: item.w, opacity: item.opacity }
      if (item.kind === 'image') {
        return <img key={item.id} className="free-item free-image" data-free-id={item.id} src={item.src} alt="" style={{ ...box, height: item.h }}/>
      }
      if (item.kind === 'shape') {
        return <div key={item.id} className={`free-item free-shape is-${item.shape ?? 'rect'}`} data-free-id={item.id} style={{ ...box, height: item.h, background: item.color }}/>
      }
      if (item.kind === 'icon') {
        const Icon = iconMap[item.icon ?? ''] ?? Sparkles
        return <div key={item.id} className="free-item free-icon" data-free-id={item.id} style={{ ...box, height: item.h, color: item.color }}><Icon width="100%" height="100%" strokeWidth={1.75}/></div>
      }
      const textStyle: React.CSSProperties = { ...box, fontSize: item.fontSize, color: item.color, fontWeight: item.isBold ? 800 : 500, fontFamily: item.fontFamily || undefined, textAlign: item.align, lineHeight: item.lineHeight, background: item.bgColor }
      return item.html
        ? <div key={item.id} className={`free-item free-text ${item.bgColor ? 'has-bg' : ''}`} data-free-id={item.id} style={textStyle} dangerouslySetInnerHTML={{ __html: sanitizeRich(item.html) }}/>
        : <div key={item.id} className={`free-item free-text ${item.bgColor ? 'has-bg' : ''}`} data-free-id={item.id} style={textStyle}>{item.text}</div>
    })}
  </div>
}

export function CardCanvas({ project, page, pageIndex, exportId }: Props) {
  const theme = themes[project.theme]
  const size = project.aspect === '1:1' ? { width: 1080, height: 1080 } : { width: 1080, height: 1350 }
  const accent = page.accentOverride || theme.accent
  const rootRef = useRef<HTMLDivElement>(null)

  // 문구 수정값과 조정값(위치·배율)은 템플릿을 그린 뒤 덧씌운다. 글자가 크기를 바꾸므로 문구 먼저. 폰트 로딩으로 크기가 바뀌면 한 번 더 맞춘다
  useLayoutEffect(() => {
    const canvas = rootRef.current
    if (!canvas) return
    const apply = () => {
      applyTextEdits(canvas, page.template, page.textEdits)
      applyPageEdits(canvas, activeEdits(page, project.aspect))
      applyIconSwaps(canvas, activeEdits(page, project.aspect))
    }
    apply()
    document.fonts?.ready.then(apply)
  })

  const content = (() => {
    switch (page.template) {
      case 'cover': return <Cover page={page}/>
      case 'cover-question': return <CoverQuestion page={page}/>
      case 'cover-browser': return <CoverBrowser page={page}/>
      case 'cover-binder': return <CoverBinder page={page}/>
      case 'opening-question': return <OpeningQuestion page={page}/>
      case 'key-questions': return <KeyQuestions page={page}/>
      case 'story': return <Story page={page}/>
      case 'dialogue': return <Dialogue page={page}/>
      case 'quote-focus': return <QuoteFocus page={page}/>
      case 'list': return <ListLayout page={page}/>
      case 'cards-3': return <Cards3 page={page}/>
      case 'cards-4': return <Cards4 page={page}/>
      case 'stats': return <Stats page={page}/>
      case 'stat-focus': return <StatFocus page={page}/>
      case 'score-profile': return <ScoreProfile page={page}/>
      case 'bar-profile': return <BarProfile page={page}/>
      case 'process': return <Process page={page}/>
      case 'timeline': return <Timeline page={page}/>
      case 'step-cards': return <StepCards page={page}/>
      case 'comparison': return <Comparison page={page}/>
      case 'before-after': return <BeforeAfter page={page}/>
      case 'checklist': return <Checklist page={page}/>
      case 'insight': return <Insight page={page}/>
      case 'matrix': return <Matrix page={page}/>
      case 'wheel': return <Wheel page={page}/>
      case 'testimonial': return <Testimonial page={page}/>
      case 'program-info': return <ProgramInfo page={page}/>
      case 'cta': return <CTA page={page} project={project}/>
      case 'closing': return <Closing page={page} project={project}/>
      case 'persona': return <Persona page={page}/>
      case 'empathy-map': return <EmpathyMap page={page}/>
      case 'csd-board': return <CsdBoard page={page}/>
      case 'decision-flow': return <DecisionFlow page={page}/>
      case 'swimlane': return <Swimlane page={page}/>
      case 'card-stack': return <CardStack page={page}/>
      case 'tool-fan': return <ToolFan page={page}/>
      case 'expert-profile': return <ExpertProfile page={page}/>
      case 'bingo': return <Bingo page={page}/>
      case 'donut': return <Donut page={page}/>
      case 'cover-type': return <CoverType page={page}/>
      case 'cover-swipe': return <CoverSwipe page={page}/>
      case 'cover-book': return <CoverBook page={page}/>
      case 'cover-photo': return <CoverPhoto page={page}/>
      case 'cover-issue': return <CoverIssue page={page} project={project}/>
      case 'series-progress': return <SeriesProgress page={page} project={project} pageIndex={pageIndex}/>
      case 'news-brief': return <NewsBrief page={page}/>
      case 'post-mock': return <PostMock page={page} project={project}/>
      case 'bento': return <Bento page={page}/>
      case 'save-card': return <SaveCard page={page}/>
      case 'browser-columns': return <BrowserColumns page={page} project={project}/>
      case 'sticker-flow': return <StickerFlow page={page}/>
      case 'arc-steps': return <ArcSteps page={page}/>
      case 'keyword-scatter': return <KeywordScatter page={page}/>
      case 'cover-newsletter': return <CoverNewsletter page={page}/>
      case 'step-detail': return <StepDetail page={page}/>
      case 'before-after-list': return <BeforeAfterList page={page}/>
      default: return <Editorial page={page}/>
    }
  })()

  return <div ref={rootRef} id={exportId} className={`card-canvas theme-${project.theme} aspect-${project.aspect.replace(':','-')} template-${page.template}`} style={{
    width:size.width,height:size.height,
    ['--bg' as string]:theme.bg,['--paper' as string]:theme.paper,['--text' as string]:theme.text,
    ['--muted' as string]:theme.muted,['--accent' as string]:accent,['--accent2' as string]:theme.accent2,
    ['--line' as string]:theme.line,['--soft' as string]:theme.soft,['--soft2' as string]:theme.soft2,
    ['--radius' as string]:`${theme.radius}px`,
    ['--style-font' as string]:theme.font || 'inherit',
    ['--style-border' as string]:theme.border || 'none',
    ['--style-pattern' as string]:theme.pattern || 'none',
    ['--style-pattern-size' as string]:theme.patternSize || 'auto',
  }}>
    <BrandHeader project={project} pageIndex={pageIndex}/>
    {content}
    <BrandFooter project={project}/>
    <FreeLayer items={page.freeItems}/>
  </div>
}
