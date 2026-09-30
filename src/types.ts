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
  // 캡처 기반 추가 (2026-09)
  | 'browser-columns'
  | 'sticker-flow'
  | 'arc-steps'
  | 'keyword-scatter'
  | 'cover-newsletter'
  | 'step-detail'
  | 'before-after-list'
  // 캡처 기반 인포그래픽 10종 (2026-09)
  | 'step-stack'
  | 'numbered-rail'
  | 'versus-list'
  | 'pyramid'
  | 'cycle-ring'
  | 'stat-cards'
  | 'check-tip'
  | 'quadrant-axes'
  | 'faq'
  | 'concept-map'

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

/** 요소 하나의 조정값: 원래 위치 기준 이동량(px, 1080 기준), 배율(0.5~2), 글자 크기 배율(0.5~2, 없으면 1), 삭제(숨김) 여부 */
export interface LayoutEdit {
  x: number
  y: number
  s: number
  f?: number
  hide?: boolean
  /** 글자 모양: 글씨색(hex), 글꼴(CSS font-family), 굵기(500 | 800). 요소와 그 안의 모든 글자에 적용 */
  color?: string
  font?: string
  weight?: number
  /** 아이콘 바꾸기: 요소 안 아이콘 순번 → 새 아이콘 이름 (src/lib/iconSet.ts) */
  icons?: Record<string, string>
  /** 상자 너비·높이 (px, 1080 기준, 배율 s 적용 전). 없으면 템플릿 원래 크기 */
  w?: number
  h?: number
  /** 문단 정렬·줄간격 (요소와 그 안의 글자 전체) */
  align?: 'left' | 'center' | 'right'
  /** 박스 안 세로 정렬 (박스가 글자보다 높을 때 보임) */
  valign?: 'top' | 'middle' | 'bottom'
  lh?: number
  /**
   * 부분 서식: 글자만 든 요소의 표시 내용을 서식 HTML 로 바꿔 보여준다 (그릴 때 sanitizeRich 로 정리).
   * richSrc = 서식을 만들 때의 원래 글자. 원고가 바뀌어 원래 글자가 달라지면 적용하지 않는다.
   */
  rich?: string
  richSrc?: string
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
  kind: 'image' | 'text' | 'shape' | 'icon'
  x: number
  y: number
  w: number
  /** 높이 (텍스트는 없으면 내용에 따라 자동) */
  h?: number
  src?: string
  text?: string
  /** 부분 서식이 들어간 텍스트 (있으면 text 대신 그린다. 그릴 때 sanitizeRich 로 정리) */
  html?: string
  /** 텍스트 박스 전체 글꼴 (CSS font-family, 없으면 Pretendard) */
  fontFamily?: string
  fontSize?: number
  /** 글자·도형·아이콘 색 (없으면 테마 색) */
  color?: string
  isBold?: boolean
  align?: 'left' | 'center' | 'right'
  /** 박스 안 세로 정렬 (텍스트 박스 높이 h 를 정했을 때 보임) */
  valign?: 'top' | 'middle' | 'bottom'
  lineHeight?: number
  /** 텍스트 하이라이트 배경색 */
  bgColor?: string
  shape?: 'rect' | 'round' | 'ellipse' | 'line'
  /** 아이콘 이름 (src/lib/iconSet.ts) */
  icon?: string
  /** 불투명도 0.1~1 (없으면 1) */
  opacity?: number
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
