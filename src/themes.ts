import { ThemeId } from './types'

export interface ThemeTokens {
  id: ThemeId
  name: string
  bg: string
  paper: string
  text: string
  muted: string
  accent: string
  accent2: string
  line: string
  soft: string
  soft2: string
  radius: number
  vibe: string
  font?: string
  border?: string
  pattern?: string
  patternSize?: string
}

const rimentoThemes: Record<'purple' | 'teal' | 'binder' | 'browser' | 'mono', ThemeTokens> = {
  purple: {
    id: 'purple', name: 'Rimento Purple',
    bg: '#FBF8F4', paper: '#FFFFFF', text: '#17141C', muted: '#6F6876',
    accent: '#6D3FD1', accent2: '#FF8A2A', line: '#D9D1E8', soft: '#EAE0FF', soft2: '#FFF0E3', radius: 36,
    vibe: '28호 계열: 크림 바탕 + 퍼플/오렌지 포인트 + 굵은 헤드라인',
  },
  teal: {
    id: 'teal', name: 'Insight Teal',
    bg: '#EEF7F5', paper: '#FFFFFF', text: '#12211F', muted: '#5A6B68',
    accent: '#08766C', accent2: '#E5B445', line: '#B9D9D4', soft: '#DDF1ED', soft2: '#F3EED6', radius: 30,
    vibe: '26호 계열: HR 리포트·워크숍에 맞는 차분한 틸 톤',
  },
  binder: {
    id: 'binder', name: 'Binder Blue',
    bg: '#EEF1FB', paper: '#FFFFFF', text: '#131722', muted: '#5D6474',
    accent: '#3C53B3', accent2: '#F2A11E', line: '#CBD2EA', soft: '#E7EBF8', soft2: '#FFF0D1', radius: 22,
    vibe: '25·29호 계열: 과정 안내·정보표에 강한 블루 바인더 톤',
  },
  browser: {
    id: 'browser', name: 'Browser Blue',
    bg: '#EAF7FB', paper: '#FFFFFF', text: '#171717', muted: '#65727B',
    accent: '#155F7B', accent2: '#5AA7D5', line: '#B9DDEA', soft: '#E5F3F7', soft2: '#F7EDF9', radius: 42,
    vibe: '27호 계열: 브라우저 프레임·인터뷰·말풍선 중심',
  },
  mono: {
    id: 'mono', name: 'Mono Sticky',
    bg: '#FAFAFA', paper: '#FFFFFF', text: '#090909', muted: '#5D5D5D',
    accent: '#111111', accent2: '#F1D36C', line: '#111111', soft: '#F2F2F2', soft2: '#FFF2C5', radius: 18,
    vibe: '24호 계열: 흑백 에디토리얼 + 포스트잇 컬러 포인트',
  },
}

const styleThemes: Record<Exclude<ThemeId, keyof typeof rimentoThemes>, ThemeTokens> = {
  'timeline-story': {
    id: 'timeline-story', name: '타임라인형',
    bg: '#F7F5F0', paper: '#FFFFFF', text: '#1B2030', muted: '#6C7180',
    accent: '#25396B', accent2: '#D97D3D', line: '#DDD8CC', soft: '#E3E7F3', soft2: '#FBE9D8', radius: 20,
    vibe: '세로 타임라인 + 카드: 연대기 흐름에 맞춘 차분한 네이비 톤',
  },
  magazine: {
    id: 'magazine', name: '매거진형',
    bg: '#F2EEE6', paper: '#FFFFFF', text: '#141414', muted: '#6E6656',
    accent: '#B2273A', accent2: '#C79A46', line: '#DED3BC', soft: '#F2E1E4', soft2: '#F4EAD3', radius: 4,
    vibe: '잡지 지면, 피처기사 톤: 세리프 타이포 + 레드 포인트',
    font: 'Georgia,"Times New Roman",serif',
  },
  'dark-minimal': {
    id: 'dark-minimal', name: '다크모드 미니멀형',
    bg: '#0C0E13', paper: '#151924', text: '#EFF3FA', muted: '#8991A6',
    accent: '#33E6C9', accent2: '#FF4FA3', line: '#232A3B', soft: '#17262F', soft2: '#231A2C', radius: 16,
    vibe: '짙은 배경 + 네온 포인트: 시안/핑크 대비의 미니멀 다크 모드',
    pattern: 'radial-gradient(circle at 85% 0%, rgba(51,230,201,.14), transparent 55%)',
  },
  'pastel-grid': {
    id: 'pastel-grid', name: '파스텔 카드 그리드형',
    bg: '#FBF7F2', paper: '#FFFFFF', text: '#2A2530', muted: '#8A8290',
    accent: '#7C6CE0', accent2: '#F2A6C0', line: '#EAE2F0', soft: '#EFE8FB', soft2: '#FDEAF1', radius: 26,
    vibe: '부드러운 3색 카드: 라벤더/핑크 파스텔 그리드',
  },
  newspaper: {
    id: 'newspaper', name: '신문 레이아웃형',
    bg: '#F6F5F1', paper: '#FFFFFF', text: '#111111', muted: '#555555',
    accent: '#111111', accent2: '#8A1F1F', line: '#111111', soft: '#EAEAEA', soft2: '#F0E4E4', radius: 0,
    vibe: '흑백, 1면 톱기사: 굵은 룰선의 신문 지면 톤',
    font: 'Georgia,"Times New Roman",serif',
    border: '2px solid #111111',
  },
  'slide-deck': {
    id: 'slide-deck', name: '한 장 슬라이드형',
    bg: '#F4F6F9', paper: '#FFFFFF', text: '#151B26', muted: '#68717F',
    accent: '#2761D8', accent2: '#F2A72C', line: '#D8DEE8', soft: '#E3EBFB', soft2: '#FDECD2', radius: 8,
    vibe: '발표자료 스타일: 단정한 그레이/블루 슬라이드 톤',
  },
  'scroll-story': {
    id: 'scroll-story', name: '세로 스크롤 스토리텔링형',
    bg: '#FAF4EE', paper: '#FFFFFF', text: '#241C16', muted: '#7A6F63',
    accent: '#A85B2E', accent2: '#4E8073', line: '#E7D9C9', soft: '#F3E4D5', soft2: '#E1EFEA', radius: 24,
    vibe: '챕터별 내러티브: 따뜻한 테라코타 톤의 스토리텔링',
  },
  dashboard: {
    id: 'dashboard', name: '대시보드형',
    bg: '#EEF1F6', paper: '#FFFFFF', text: '#131A26', muted: '#5C6675',
    accent: '#1E6FE0', accent2: '#12B886', line: '#D3DAE5', soft: '#E2ECFC', soft2: '#DFF6EC', radius: 10,
    vibe: 'KPI 위젯 스타일: 그리드 배경의 딱 떨어지는 대시보드 톤',
    pattern: 'linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)',
    patternSize: '24px 24px',
  },
  resume: {
    id: 'resume', name: '이력서형',
    bg: '#F1F2F5', paper: '#FFFFFF', text: '#161B22', muted: '#5B6270',
    accent: '#1F2D50', accent2: '#C9A227', line: '#D7DAE1', soft: '#E7E9F0', soft2: '#F6EFD9', radius: 6,
    vibe: '사이드바 + 경력표: 신뢰감 있는 네이비 이력서 톤',
  },
  'moodboard-collage': {
    id: 'moodboard-collage', name: '무드보드 콜라주형',
    bg: '#F1EAE0', paper: '#FFFFFF', text: '#2B2621', muted: '#8A7E70',
    accent: '#D9632B', accent2: '#4C7A8C', line: '#E3D6C4', soft: '#F5E4D3', soft2: '#DCEBEF', radius: 2,
    vibe: '폴라로이드 스크랩북: 콜라주 감성의 화이트 프레임',
    border: '10px solid #FFFFFF',
  },
  'interview-qa': {
    id: 'interview-qa', name: '인터뷰 Q&A형',
    bg: '#EFF6F5', paper: '#FFFFFF', text: '#152321', muted: '#5E6E6B',
    accent: '#0E8E7D', accent2: '#F2955B', line: '#CDE4E0', soft: '#DCF1ED', soft2: '#FBE7D8', radius: 28,
    vibe: '대화 말풍선 인터뷰: 담백한 그린 톤',
  },
  'journey-map': {
    id: 'journey-map', name: '여정 지도형',
    bg: '#F6F1E6', paper: '#FFFFFF', text: '#25231A', muted: '#7C765F',
    accent: '#8A6D3B', accent2: '#3E7D5C', line: '#E2D8BC', soft: '#F0E7CD', soft2: '#DEECE0', radius: 18,
    vibe: '경로 위 마일스톤: 모래빛 지도 톤',
  },
  'checklist-quest': {
    id: 'checklist-quest', name: '체크리스트 도장깨기형',
    bg: '#101623', paper: '#1B2434', text: '#F1F5FF', muted: '#8C97B3',
    accent: '#5CE1E6', accent2: '#FFD23F', line: '#2B3650', soft: '#1F2E45', soft2: '#332A17', radius: 14,
    vibe: '게임 퀘스트 클리어: 다크 배경 + 시안/옐로 포인트',
  },
  'handwritten-diary': {
    id: 'handwritten-diary', name: '손글씨 다이어리형',
    bg: '#FBF8EF', paper: '#FFFDF6', text: '#332B22', muted: '#8A7F6A',
    accent: '#C0562F', accent2: '#F1D36C', line: '#E7DEC4', soft: '#FFF2C5', soft2: '#F7E2D3', radius: 8,
    vibe: '노트 감성, 포스트잇: 손글씨 느낌의 필기체',
    font: '"Segoe Print","Comic Sans MS",cursive',
  },
  'cyberpunk-neon': {
    id: 'cyberpunk-neon', name: '네온 사이버펑크형',
    bg: '#07060D', paper: '#120F1F', text: '#F2F0FF', muted: '#8D86B3',
    accent: '#FF2FD1', accent2: '#33FFE8', line: '#2A2140', soft: '#1D1633', soft2: '#101827', radius: 6,
    vibe: '그리드 + 글로우: 마젠타/시안 네온 사이버펑크',
    pattern: 'repeating-linear-gradient(0deg, rgba(255,47,209,.08) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(51,255,232,.08) 0 1px, transparent 1px 24px)',
    border: '1px solid #33FFE8',
  },
  'nature-green': {
    id: 'nature-green', name: '자연 그린톤 힐링형',
    bg: '#F3F6EF', paper: '#FFFFFF', text: '#1E2A1C', muted: '#63735D',
    accent: '#3F7A45', accent2: '#C98A3E', line: '#DCE6D2', soft: '#E6F0DE', soft2: '#F5E8D3', radius: 40,
    vibe: '유기적 곡선, 잎사귀: 포레스트 그린 힐링 톤',
  },
  'photo-gallery-bw': {
    id: 'photo-gallery-bw', name: '흑백 사진 갤러리형',
    bg: '#F4F4F4', paper: '#FFFFFF', text: '#111111', muted: '#666666',
    accent: '#111111', accent2: '#9A9A9A', line: '#D5D5D5', soft: '#EDEDED', soft2: '#E2E2E2', radius: 0,
    vibe: '사진 중심, 캡션 최소: 흑백 갤러리 톤',
  },
  'data-viz': {
    id: 'data-viz', name: '데이터 시각화형',
    bg: '#F5F7FA', paper: '#FFFFFF', text: '#141B29', muted: '#5A6474',
    accent: '#3B5BFF', accent2: '#FF7A45', line: '#DCE2EC', soft: '#E3E9FB', soft2: '#FFE7DA', radius: 12,
    vibe: '도넛/막대 그래프: 선명한 블루/오렌지 데이터 팔레트',
    pattern: 'linear-gradient(var(--line) 1px, transparent 1px)',
    patternSize: '100% 32px',
  },
  'comic-book': {
    id: 'comic-book', name: '코믹북형',
    bg: '#FFF5DC', paper: '#FFFFFF', text: '#111111', muted: '#4A4A4A',
    accent: '#E22C4E', accent2: '#2E6FE0', line: '#111111', soft: '#FFE1EA', soft2: '#DCEBFF', radius: 4,
    vibe: '말풍선, 팝아트 컬러: 굵은 잉크선의 코믹북 톤',
    border: '4px solid #111111',
  },
  'letter-paper': {
    id: 'letter-paper', name: '편지지형',
    bg: '#F6F1E4', paper: '#FFFDF7', text: '#3A3122', muted: '#8C7F63',
    accent: '#6E4A2E', accent2: '#8FA37C', line: '#DFD2AD', soft: '#F0E7CB', soft2: '#E7EEDF', radius: 2,
    vibe: '손편지, 서명란: 세리프 + 크림지 편지지 톤',
    font: 'Georgia,"Times New Roman",serif',
    border: '2px dashed #C7B688',
  },
  'report-card': {
    id: 'report-card', name: '성적표형',
    bg: '#F3F4F7', paper: '#FFFFFF', text: '#151A22', muted: '#5A6270',
    accent: '#B3242C', accent2: '#1F3C88', line: '#D6DAE2', soft: '#F9E3E3', soft2: '#E3E8F7', radius: 2,
    vibe: '등급 표, 도장: 단정한 레드/네이비 성적표 톤',
    pattern: 'linear-gradient(var(--line) 1px, transparent 1px)',
    patternSize: '100% 26px',
  },
  'trading-card': {
    id: 'trading-card', name: '트레이딩카드형',
    bg: '#0E1220', paper: '#171D33', text: '#F1F4FF', muted: '#8C94B8',
    accent: '#7C5CFF', accent2: '#33E6C9', line: '#33406B', soft: '#232C50', soft2: '#1B3A38', radius: 20,
    vibe: '스탯 바, 홀로그램 테두리: 퍼플/민트 홀로그램 톤',
    border: '3px solid #7C5CFF',
  },
  'brochure-tri': {
    id: 'brochure-tri', name: '브로슈어 3단형',
    bg: '#F2F4F1', paper: '#FFFFFF', text: '#182018', muted: '#5D6A5E',
    accent: '#2F6B4F', accent2: '#C9A227', line: '#D7DED4', soft: '#E3EEE5', soft2: '#F5EFD4', radius: 6,
    vibe: '3단 접이식 안내책자: 단정한 그린/골드 브로슈어 톤',
  },
  'poster-bold': {
    id: 'poster-bold', name: '포스터형',
    bg: '#111111', paper: '#1B1B1B', text: '#FFFFFF', muted: '#B5B5B5',
    accent: '#FFD400', accent2: '#FF3B30', line: '#333333', soft: '#262626', soft2: '#2B2216', radius: 0,
    vibe: '임팩트 큰 타이포: 블랙 배경 옐로/레드 포스터 톤',
  },
  'chatbot-ui': {
    id: 'chatbot-ui', name: '챗봇 대화창형',
    bg: '#EFF3F8', paper: '#FFFFFF', text: '#16202E', muted: '#63707F',
    accent: '#3D7BFF', accent2: '#38C976', line: '#D9E1EC', soft: '#E3ECFF', soft2: '#E1F8EA', radius: 28,
    vibe: '메신저 말풍선 UI: 블루/그린 채팅앱 톤',
  },
  'time-capsule': {
    id: 'time-capsule', name: '타임캡슐형',
    bg: '#EDE3D0', paper: '#F7F0E1', text: '#3B2E1E', muted: '#8A7A5C',
    accent: '#8C3B2E', accent2: '#5B7A57', line: '#D9C7A3', soft: '#E9D8B8', soft2: '#DDE3CC', radius: 2,
    vibe: '봉인 편지, 소인 스탬프: 빈티지 크래프트지 톤',
    border: '3px double #8C3B2E',
  },
  'infinite-feed': {
    id: 'infinite-feed', name: '무한 스크롤 갤러리형',
    bg: '#FAFAFA', paper: '#FFFFFF', text: '#111111', muted: '#6B6B6B',
    accent: '#E1306C', accent2: '#5851DB', line: '#E5E5E5', soft: '#FCE4EC', soft2: '#EDEBFB', radius: 16,
    vibe: 'SNS 피드 스타일: 핑크/퍼플 그라디언트 포인트',
  },
  'minimal-text': {
    id: 'minimal-text', name: '미니멀 텍스트형',
    bg: '#FFFFFF', paper: '#FFFFFF', text: '#0A0A0A', muted: '#8A8A8A',
    accent: '#0A0A0A', accent2: '#0A0A0A', line: '#EDEDED', soft: '#F5F5F5', soft2: '#F0F0F0', radius: 0,
    vibe: '타이포 대비만으로 위계: 색 없는 순수 타이포그래피',
  },
  'infographic-card': {
    id: 'infographic-card', name: '인포그래픽 카드형',
    bg: '#F5F7F4', paper: '#FFFFFF', text: '#152018', muted: '#5E6B62',
    accent: '#1E9E7A', accent2: '#F2B705', line: '#D7E4DC', soft: '#DFF3E8', soft2: '#FDF0CF', radius: 18,
    vibe: '아이콘 + 컬러 카드: 그린/옐로 인포그래픽 톤',
  },
  'navy-resume': {
    id: 'navy-resume', name: '네이비 카드형',
    bg: '#EEF1F6', paper: '#FFFFFF', text: '#141B29', muted: '#5B6472',
    accent: '#1B2E5C', accent2: '#B08A2E', line: '#D6DBE5', soft: '#E5E9F3', soft2: '#F3ECD9', radius: 4,
    vibe: 'A4 이력서 스타일(원본): 정통 네이비/골드 톤',
  },
}

export const themes: Record<ThemeId, ThemeTokens> = { ...rimentoThemes, ...styleThemes }

export const styleCategories = ['기본', '스토리·매거진', '다크·네온', '데이터·오피스', '감성·아날로그', '팝·SNS'] as const
export type StyleCategory = typeof styleCategories[number]

export const styleCategoryMap: Record<ThemeId, StyleCategory> = {
  purple: '기본', teal: '기본', binder: '기본', browser: '기본', mono: '기본',
  'timeline-story': '스토리·매거진', magazine: '스토리·매거진', 'scroll-story': '스토리·매거진',
  'journey-map': '스토리·매거진', 'interview-qa': '스토리·매거진', 'brochure-tri': '스토리·매거진',
  'dark-minimal': '다크·네온', 'cyberpunk-neon': '다크·네온', 'checklist-quest': '다크·네온',
  'trading-card': '다크·네온', 'poster-bold': '다크·네온',
  dashboard: '데이터·오피스', resume: '데이터·오피스', 'slide-deck': '데이터·오피스',
  'data-viz': '데이터·오피스', 'report-card': '데이터·오피스', 'navy-resume': '데이터·오피스',
  'minimal-text': '데이터·오피스',
  'pastel-grid': '감성·아날로그', 'moodboard-collage': '감성·아날로그', 'handwritten-diary': '감성·아날로그',
  'nature-green': '감성·아날로그', 'letter-paper': '감성·아날로그', 'time-capsule': '감성·아날로그',
  'photo-gallery-bw': '감성·아날로그',
  'comic-book': '팝·SNS', 'chatbot-ui': '팝·SNS', 'infinite-feed': '팝·SNS', 'infographic-card': '팝·SNS',
  newspaper: '스토리·매거진',
}
