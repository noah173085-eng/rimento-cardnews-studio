import { TemplateId } from './types'

export type TemplateCategory = '표지' | '스토리' | '정보' | '데이터' | '프로세스' | '비교' | '마무리'

export interface TemplateMeta {
  id: TemplateId
  name: string
  category: TemplateCategory
  description: string
  hint: string
  visual: 'hero' | 'question' | 'browser' | 'binder' | 'editorial' | 'cards' | 'stats' | 'bars' | 'flow' | 'compare' | 'matrix' | 'wheel' | 'quote' | 'cta'
}

export const templateLibrary: TemplateMeta[] = [
  { id:'cover', name:'Hero Cover', category:'표지', description:'큰 헤드라인과 유기적 도형을 활용한 리멘토형 표지', hint:'제목 1~3줄 + 짧은 서브카피', visual:'hero' },
  { id:'cover-question', name:'Why? Cover', category:'표지', description:'Why/Question 훅을 전면에 내세운 강한 표지', hint:'질문형 제목에 적합', visual:'question' },
  { id:'cover-browser', name:'Browser Cover', category:'표지', description:'브라우저 창 프레임을 활용한 매거진형 표지', hint:'브랜드/특집/인터뷰형', visual:'browser' },
  { id:'cover-binder', name:'Binder Cover', category:'표지', description:'과정 안내·리스트업에 강한 바인더형 표지', hint:'과정명·라인업·오픈 안내', visual:'binder' },

  { id:'editorial', name:'Editorial Lead', category:'스토리', description:'제목+본문+핵심 요약을 안정적으로 배치', hint:'오프닝·문제 제기', visual:'editorial' },
  { id:'opening-question', name:'Opening Question', category:'스토리', description:'질문 한 문장을 크게 던지고 맥락을 설명', hint:'독자의 문제의식 환기', visual:'question' },
  { id:'key-questions', name:'3 Key Questions', category:'스토리', description:'핵심 질문 3~5개를 번호로 구조화', hint:'목차·읽을거리 예고', visual:'cards' },
  { id:'story', name:'Case Story', category:'스토리', description:'사례 서사를 문단과 강조문으로 전개', hint:'상황-문제-전환점', visual:'editorial' },
  { id:'dialogue', name:'Dialogue', category:'스토리', description:'말풍선으로 이해관계자의 대화를 표현', hint:'갈등·피드백 사례', visual:'quote' },
  { id:'quote-focus', name:'Quote Focus', category:'스토리', description:'한 문장을 중심으로 메시지를 각인', hint:'고객 발언·핵심 문장', visual:'quote' },

  { id:'list', name:'Numbered List', category:'정보', description:'번호와 짧은 설명을 카드형으로 정리', hint:'3~6개 포인트', visual:'cards' },
  { id:'cards-3', name:'3 Pillars', category:'정보', description:'세 가지 핵심 축을 동일 위계로 제시', hint:'3대 효과·3대 원칙', visual:'cards' },
  { id:'cards-4', name:'4 Blocks', category:'정보', description:'네 개 정보를 2×2 카드로 시각화', hint:'4가지 방법·역량', visual:'cards' },
  { id:'checklist', name:'Checklist', category:'정보', description:'실행 항목을 체크박스로 제시', hint:'실무 팁·행동 점검', visual:'cards' },
  { id:'insight', name:'Insight Box', category:'정보', description:'결론과 이유를 위계감 있게 강조', hint:'핵심 인사이트·해석', visual:'editorial' },
  { id:'program-info', name:'Program Info', category:'정보', description:'일시·대상·비용·안내를 정보표로 구성', hint:'교육/행사 안내', visual:'binder' },

  { id:'stats', name:'Metric Grid', category:'데이터', description:'2~6개 핵심 수치를 카드 그리드로 표시', hint:'성과·조사 결과', visual:'stats' },
  { id:'stat-focus', name:'Big Number', category:'데이터', description:'핵심 숫자 하나를 압도적으로 강조', hint:'대표 KPI·핵심 수치', visual:'stats' },
  { id:'score-profile', name:'Score Profile', category:'데이터', description:'특성 점수를 점 배열로 보여주는 프로필형', hint:'진단 결과 3개', visual:'bars' },
  { id:'bar-profile', name:'Bar Profile', category:'데이터', description:'여러 지표를 가로 막대로 비교', hint:'역량·설문·비율', visual:'bars' },

  { id:'process', name:'Vertical Process', category:'프로세스', description:'단계별 흐름을 세로로 안정적으로 표현', hint:'3~5단계 과정', visual:'flow' },
  { id:'timeline', name:'Timeline', category:'프로세스', description:'시간 또는 순서를 가로 타임라인으로 표현', hint:'로드맵·일정', visual:'flow' },
  { id:'step-cards', name:'Step Cards', category:'프로세스', description:'단계를 독립 카드로 나눠 읽기 쉽게 구성', hint:'4단계 방법론', visual:'flow' },

  { id:'comparison', name:'Split Compare', category:'비교', description:'좌우 두 관점을 명확히 대비', hint:'A/B·장점/리스크', visual:'compare' },
  { id:'before-after', name:'Before → After', category:'비교', description:'행동의 전환을 화살표 흐름으로 표현', hint:'변화 전/후', visual:'compare' },
  { id:'matrix', name:'2×2 Matrix', category:'비교', description:'네 개 영역을 한 화면에 배치하는 프레임워크형', hint:'4유형·우선순위', visual:'matrix' },
  { id:'wheel', name:'Framework Wheel', category:'비교', description:'중심 개념과 주변 요소를 방사형으로 표현', hint:'역할·역량 체계', visual:'wheel' },

  { id:'testimonial', name:'Testimonial', category:'마무리', description:'후기·인터뷰·고객 코멘트를 신뢰감 있게 제시', hint:'후기 2~3개', visual:'quote' },
  { id:'cta', name:'CTA / Contact', category:'마무리', description:'연락처와 행동 유도 문구를 명확히 구성', hint:'문의·신청·구독', visual:'cta' },
  { id:'closing', name:'Closing Manifesto', category:'마무리', description:'브랜드 문장과 메시지로 여운 있게 종료', hint:'브랜드 미션·마지막 한마디', visual:'hero' },

  { id:'cover-type', name:'Bold Type Cover', category:'표지', description:'초대형 타이포가 화면을 채우는 강한 표지', hint:'짧은 제목 2~3줄 · 항목=목차 3개', visual:'hero' },
  { id:'cover-swipe', name:'Swipe Cover', category:'표지', description:'다음 장으로 이어지는 도형으로 스와이프를 유도', hint:'메모=스와이프 문구 · 항목=태그', visual:'hero' },
  { id:'cover-book', name:'Book Cover', category:'표지', description:'책 표지처럼 제목을 오브젝트 안에 담은 표지', hint:'시리즈·가이드북 · 메모=저자/브랜드', visual:'binder' },
  { id:'cover-photo', name:'Photo Cover', category:'표지', description:'어두운 사진 위 헤드라인, 마지막 줄 강조', hint:'이미지 업로드 권장 · 마지막 줄이 강조됨', visual:'hero' },
  { id:'cover-issue', name:'Issue Split Cover', category:'표지', description:'호수 숫자와 이번 호 목차를 분할 배치', hint:'메모=호수 숫자 · 항목=목차 3~5개', visual:'browser' },

  { id:'persona', name:'Persona Profile', category:'정보', description:'인물 슬롯·속성·태그로 구성한 페르소나 카드', hint:'항목=라벨|값 4개 · 메모=태그(쉼표 구분)', visual:'cards' },
  { id:'card-stack', name:'Card Stack Index', category:'정보', description:'겹쳐 쌓인 컬러 카드로 목차·토픽을 소개', hint:'항목=제목|설명 3~5개', visual:'cards' },
  { id:'tool-fan', name:'Tool Card Fan', category:'정보', description:'부채꼴로 펼친 도구 카드 3장과 설명', hint:'항목=도구명|설명 3개', visual:'cards' },
  { id:'bingo', name:'Practice Bingo', category:'정보', description:'실천 과제를 3×3 빙고판으로 제시', hint:'완료 칸은 "v|텍스트" · 최대 9개', visual:'matrix' },
  { id:'news-brief', name:'News Brief', category:'정보', description:'헤드 블록 아래 3개 뉴스 카드를 배치', hint:'항목=제목|설명 3개 · 첫 카드에 이미지', visual:'cards' },
  { id:'bento', name:'Bento Topics', category:'정보', description:'크기가 다른 타일로 토픽을 모아 보여주는 대시보드형', hint:'항목=카테고리|헤드라인 5개', visual:'matrix' },

  { id:'expert-profile', name:'Expert Profile', category:'스토리', description:'사선 흑백 패널의 전문가·강사 소개', hint:'제목=이름 · 소분류=직함 · 항목=전문분야|설명', visual:'editorial' },
  { id:'series-progress', name:'Series Progress', category:'스토리', description:'상단 진행 바로 시리즈 흐름을 보여주는 본문', hint:'항목=포인트|설명 · 메모=다음 장 예고', visual:'flow' },
  { id:'post-mock', name:'Social Post', category:'스토리', description:'SNS 게시물 프레임으로 한 문장을 전달', hint:'항목=해시태그 · 이미지 선택', visual:'quote' },

  { id:'donut', name:'Donut Ratio', category:'데이터', description:'도넛 차트와 범례로 응답 비율을 표시', hint:'항목=라벨|값 2~4개', visual:'wheel' },

  { id:'decision-flow', name:'Decision Flow', category:'프로세스', description:'질문에서 예/아니오로 갈라지는 분기 흐름', hint:'본문=질문 · 항목1·2=분기 · 항목3·4=후속', visual:'flow' },
  { id:'swimlane', name:'Role Swimlane', category:'프로세스', description:'역할별 레인에 단계를 배치한 협업 프로세스', hint:'항목=역할|단계1>단계2>단계3', visual:'flow' },

  { id:'empathy-map', name:'Empathy Map', category:'비교', description:'중심 인물의 말·생각·행동·감정을 4방향으로 정리', hint:'항목=SAYS|내용 4개 · 메모=인물', visual:'matrix' },
  { id:'csd-board', name:'CSD Board', category:'비교', description:'확실한 것·가정·의문을 3열 포스트잇으로 정리', hint:'항목=C|내용, S|내용, D|내용', visual:'cards' },

  { id:'cover-newsletter', name:'Newsletter Cover', category:'표지', description:'강한 배경색 위 초대형 제목과 호수 표기의 뉴스레터형 표지', hint:'제목 2~3줄 · 상단 라벨=VOL · 메모=발행월 · 이미지(일러스트) 선택', visual:'hero' },
  { id:'browser-columns', name:'Browser Columns', category:'정보', description:'브라우저 창 안에 챕터 칩·제목·아이콘 카드 2열을 배치', hint:'항목=카드 제목|설명 2개(최대 4) · 상단 라벨=챕터', visual:'browser' },
  { id:'keyword-scatter', name:'Keyword Map', category:'정보', description:'크기가 다른 키워드 태그를 흩어 배치하고 핵심 키워드를 강조', hint:'항목=키워드 5~7개(첫 번째가 가장 크게) · 본문=하단 설명', visual:'browser' },
  { id:'sticker-flow', name:'Sticker Flow', category:'프로세스', description:'스티커형 원 아이콘 단계와 아래 태그 목록으로 흐름을 표현', hint:'항목=단계명|태그1, 태그2 3개 · 상단 라벨=섹션명', visual:'flow' },
  { id:'arc-steps', name:'Arc Steps', category:'프로세스', description:'반원 아크 안의 핵심 문장과 STEP 열별 불릿 정리', hint:'항목=단계 제목|내용1 / 내용2 3개 · 메모=아크 위 소제목', visual:'flow' },
  { id:'step-detail', name:'Step Detail', category:'프로세스', description:'STEP 번호·큰 제목·설명 아래 확인 포인트 카드 3개', hint:'상단 라벨=STEP 01 · 메모=말풍선 · 항목=포인트|설명 3개', visual:'flow' },
  { id:'before-after-list', name:'Before After List', category:'비교', description:'BEFORE·AFTER 박스를 위아래로 놓고 불릿으로 비교', hint:'항목=B|개선 전 내용, A|개선 후 내용 (표시 없으면 앞 절반=BEFORE)', visual:'compare' },

  { id:'save-card', name:'Save Summary', category:'마무리', description:'저장 유도형 핵심 요약과 하단 액션 바', hint:'항목=요약|설명 3~5개 · 메모=저장 문구', visual:'cta' },
]

export const templateMap = Object.fromEntries(templateLibrary.map(t => [t.id, t])) as Record<TemplateId, TemplateMeta>
export const templateCategories: TemplateCategory[] = ['표지','스토리','정보','데이터','프로세스','비교','마무리']
