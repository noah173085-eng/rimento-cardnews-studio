export type TemplateId =
  | 'cover'
  | 'cover-question'
  | 'cover-browser'
  | 'cover-binder'
  | 'editorial'
  | 'opening-question'
  | 'key-questions'
  | 'story'
  | 'dialogue'
  | 'quote-focus'
  | 'list'
  | 'cards-3'
  | 'cards-4'
  | 'stats'
  | 'stat-focus'
  | 'score-profile'
  | 'bar-profile'
  | 'process'
  | 'timeline'
  | 'step-cards'
  | 'comparison'
  | 'before-after'
  | 'checklist'
  | 'insight'
  | 'matrix'
  | 'wheel'
  | 'testimonial'
  | 'program-info'
  | 'cta'
  | 'closing'
  // Penpot 구조 참고 (10)
  | 'persona'
  | 'empathy-map'
  | 'csd-board'
  | 'decision-flow'
  | 'swimlane'
  | 'card-stack'
  | 'tool-fan'
  | 'expert-profile'
  | 'bingo'
  | 'donut'
  // Figma Community 구조 참고 (표지 5 + 본문 5)
  | 'cover-type'
  | 'cover-swipe'
  | 'cover-book'
  | 'cover-photo'
  | 'cover-issue'
  | 'series-progress'
  | 'news-brief'
  | 'post-mock'
  | 'bento'
  | 'save-card'

export type ThemeId =
  | 'purple' | 'teal' | 'binder' | 'browser' | 'mono'
  | 'timeline-story' | 'magazine' | 'dark-minimal' | 'pastel-grid' | 'newspaper'
  | 'slide-deck' | 'scroll-story' | 'dashboard' | 'resume' | 'moodboard-collage'
  | 'interview-qa' | 'journey-map' | 'checklist-quest' | 'handwritten-diary' | 'cyberpunk-neon'
  | 'nature-green' | 'photo-gallery-bw' | 'data-viz' | 'comic-book' | 'letter-paper'
  | 'report-card' | 'trading-card' | 'brochure-tri' | 'poster-bold' | 'chatbot-ui'
  | 'time-capsule' | 'infinite-feed' | 'minimal-text' | 'infographic-card' | 'navy-resume'
export type AspectId = '4:5' | '1:1'
export type LogoId =
  | 'none'
  | 'rimento' | 'rimento-horizontal' | 'rimento-horizontal-white'
  | 'company' | 'company-full'

/** 요소 하나의 조정값: 원래 위치 기준 이동량(px, 1080 기준), 배율(0.5~2), 글자 크기 배율(0.5~2, 없으면 1) */
export interface LayoutEdit {
  x: number
  y: number
  s: number
  f?: number
}

/** 페이지별 조정값. 저장 당시 템플릿·비율과 다르면 적용하지 않는다 */
export interface PageLayoutEdits {
  template: TemplateId
  aspect: AspectId
  items: Record<string, LayoutEdit>
}

/** 페이지에 직접 올린 이미지·텍스트 박스. 좌표는 캔버스 1080 기준 px, 템플릿을 바꿔도 유지된다 */
export interface FreeItem {
  id: string
  kind: 'image' | 'text'
  x: number
  y: number
  w: number
  /** 이미지 높이 (텍스트는 내용에 따라 자동) */
  h?: number
  src?: string
  text?: string
  fontSize?: number
  color?: string
  isBold?: boolean
}

export interface CardPage {
  id: string
  template: TemplateId
  eyebrow: string
  title: string
  body: string
  items: string[]
  note: string
  imageDataUrl?: string
  imageFit?: 'cover' | 'contain'
  accentOverride?: string
  layoutEdits?: PageLayoutEdits
  /** 템플릿에 박힌 문구 수정값 (id = 템플릿/요소키/원래 글자#순번) */
  textEdits?: Record<string, string>
  /** 직접 추가한 이미지·텍스트 박스 (배열 순서 = 쌓이는 순서) */
  freeItems?: FreeItem[]
}

export interface CardProject {
  title: string
  issueLabel: string
  brandName: string
  handle: string
  footerText: string
  theme: ThemeId
  aspect: AspectId
  logo: LogoId
  footerLogo: LogoId
  pages: CardPage[]
}
