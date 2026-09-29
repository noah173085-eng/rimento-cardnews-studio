---
name: add-template
description: 사용자가 카드뉴스 캡처본(이미지)을 보내며 템플릿 추가를 요청할 때 사용. 캡처의 시각 문법을 분석해 리멘토 카드뉴스 스튜디오에 새 템플릿을 등록·렌더링·검증하는 절차. "이 캡처로 템플릿 추가해줘", "이런 디자인 템플릿 만들어줘", 이미지 + "템플릿" 이 함께 오면 사용.
---

# 캡처본 → 새 템플릿 추가 절차

프로젝트 규칙(CLAUDE.md)을 먼저 따른다. 특히:
- **기존 템플릿은 픽셀 단위로 그대로 둔다.** 새 템플릿용 CSS·컴포넌트만 추가한다. 공용 클래스(`.lead`, `.eyebrow`, `h1/h2` 등) 규칙은 수정 금지.
- 캡처를 **픽셀 복제하지 않는다.** 구조(배치·위계·도형·정보 구조)만 가져와 리멘토 문법(큰 제목, 여백, 테마 변수 색)으로 새로 만든다.
- 글꼴은 Pretendard, 제목·강조는 700~800 굵기. 색은 **반드시 테마 변수**(`--accent`, `--accent2`, `--soft`, `--paper`, `--text`, `--muted`, `--line`, `--radius`)만 사용 → 35개 스타일 테마에서 모두 동작.
- 캡처가 여러 장이면 한 장 = 템플릿 하나. 기존 템플릿과 구조가 거의 같으면 새로 만들지 말고 사용자에게 "기존 `xxx` 와 유사"라고 알린다.

## 1. 캡처 분석 (코드 작성 전, 사용자에게 짧게 보고)
캡처에서 다음을 정리한다:
1. **구조**: 영역 배치(상단/중앙/그리드/분할), 반복 단위(카드·행·단계)와 개수
2. **위계**: 라벨 → 제목 → 설명 → 시각 구조 → 결론 순서에서 무엇이 가장 큰가
3. **장식 문법**: 도형, 프레임(브라우저·폰·책), 선, 번호, 아이콘
4. **데이터 매핑**: 페이지 필드만 쓴다 (새 필드 추가 금지 — JSON 호환)
   - `eyebrow` 상단 라벨 · `title` 제목(줄바꿈 가능) · `body` 본문 · `note` 하단 메모/CTA
   - `items[]` 반복 단위. `라벨|설명` 은 `splitPair(item)` / `labelText(item, fallback)` 로 분리
   - `imageDataUrl` 이미지(있을 때만). `<OptionalImage page={page}/>` 재사용 가능
5. **이름·분류**: id(kebab-case, 기존과 중복 금지), 영문 name, category(`표지|스토리|정보|데이터|프로세스|비교|마무리`), visual(썸네일 유형: `hero|question|browser|binder|editorial|cards|stats|bars|flow|compare|matrix|wheel|quote|cta`)

## 2. 등록 (3곳 + CSS)
1. **`src/types.ts`** — `TemplateId` 유니온 끝에 `| 'new-id'` 추가 (주석으로 출처 묶음 표시 가능)
2. **`src/templateLibrary.ts`** — `templateLibrary` 배열의 해당 분류 근처에 **한 줄 형식 그대로** 추가 (점검 스크립트가 이 형식을 파싱함):
   ```ts
   { id:'new-id', name:'English Name', category:'정보', description:'한 줄 설명', hint:'항목=라벨|설명 3~5개', visual:'cards' },
   ```
   `hint` 에 입력 방법(항목 개수, `|` 규칙)을 반드시 적는다 — 사용자가 템플릿 창에서 보는 안내다.
3. **`src/components/CardCanvas.tsx`**
   - `export function CardCanvas` 바로 위에 컴포넌트 추가. 처음 추가할 때 `/* ---------- 캡처 기반 추가 템플릿 ---------- */` 구분 주석을 한 번 달고, 이후 템플릿은 그 아래에 이어 붙인다 (기존 `Penpot` / `Figma Community` 구역과 같은 방식)
   - **최상위는 반드시 `<div className="layout 새이름-layout">`** — 레이아웃 편집·문구 수정이 `.layout` 직계 자식 기준으로 동작
   - 큰 덩어리(제목 묶음, 목록, 카드 그리드, 메모)는 `.layout` 의 **직계 자식**으로 두고, 반복 단위는 그 안의 자식으로 둔다 → 사용자가 클릭(덩어리)·더블클릭(항목)으로 따로 옮길 수 있다
   - 제목은 `withBreaks(page.title)` + `className={titleDensity(page.title)}`, 본문 긴 글은 `bodyDensity(page.body)` 사용. 표준 머리는 `<PageHead page={page}/>` 재사용
   - **항목 늘리기 지원**: 반복 단위 컨테이너는 `<div className="x-list" {...grow(page.items.length, 기본개수)}>{page.items.slice(0, 최대개수)...}` 형태로 쓴다
     - 기본개수 = 캡처 디자인의 개수(이하에서는 기존 모습 그대로), 최대개수 = 기본의 1.5~2배
     - 넘치면 컨테이너에 `data-extended` 가 붙고, 카드 밖으로 넘치면 `fitExtended` 가 자동으로 줄인다
     - 가로 칸 수가 고정된 그리드는 `grow(n, base, extraCols(n, base))` 로 열을 늘리고, 확장 상태 전용 CSS 는 `.x-list[data-extended] ...` 로 작성
     - 아이콘·색 배열은 반드시 `arr[i % arr.length]` (항목이 배열보다 많으면 앱 전체가 멈춤)
   - 원고가 비었을 때의 기본 문구는 `page.note || '기본 문구'` 형태로 (사용자가 문구 수정 기능으로 바꿀 수 있음)
   - `switch (page.template)` 에 `case 'new-id': return <NewComponent page={page}/>` 추가 (project 가 필요하면 `project={project}`)
4. **`src/styles.css`** — 파일 끝의 추가 템플릿 영역에 `/* 템플릿이름 */` 주석 + 한 줄 규칙 블록 추가
   - 클래스 이름은 새 템플릿 고유 접두사로 (기존 클래스 재정의 금지)
   - 캔버스는 1080 기준 px. `.layout` 박스 = 976×1182, padding 36 (4:5) / 980×924, padding 30 (1:1) → 실제 내용 영역 ≈ 904×1110 / 920×864. 박스 위쪽은 헤더, 아래쪽은 푸터 자리
   - **1:1 대응**: 세로 공간이 좁으므로 `.aspect-1-1 .새클래스{...}` 로 높이·간격·글자를 줄인다
   - 제목 크기 오버라이드가 필요하면 `.card-canvas .새-layout h2`, `h2.title-compact`, `h2.title-dense` 세 단계를 함께 지정

선택: 내용 유형에 맞으면 `src/lib/auto.ts` 의 `pickTemplate` 에 자동 선택 규칙을 추가해도 되지만, 기존 규칙 순서는 바꾸지 않는다(기존 자동 배치 결과가 달라짐). 사용자가 원할 때만.

## 3. 검증 (전부 통과해야 완료)
1. `npm run check:templates` — 등록 누락 점검 + `TEMPLATES.md` 자동 갱신 (TEMPLATES.md 는 직접 수정 금지)
2. `npx tsc -b` — 타입 점검
3. **렌더링 확인** (개발 서버가 켜져 있을 때 Playwright 사용, 사용자의 브라우저 데이터는 건드리지 않음):
   - 새 페이지를 만들어 새 템플릿 선택 → 캡처의 원고와 비슷한 분량을 넣고 스크린샷
   - 확인: 글자가 카드 밖으로 넘치지 않는가 / 헤더(상단)·푸터(하단)와 겹치지 않는가 / 항목 최소·최대 개수에서 모두 괜찮은가
   - 규격을 `1080×1080` 으로 바꿔 같은 확인
   - 테마 2~3개(예: Rimento Purple, 어두운 테마 하나)로 바꿔 색이 테마를 따르는지 확인
   - 레이아웃 편집을 켜고 덩어리 클릭 → 더블클릭으로 항목이 선택되는지 확인
   - 테스트로 만든 페이지는 삭제하고, 생성된 `.playwright-mcp` 로그·스크린샷도 지운다
4. `npm run build` — 최종 빌드 (점검 스크립트 포함)

## 4. 사용자에게 보고
- 추가한 템플릿: id / 이름 / 분류 / 입력 방법(hint)
- 캡처에서 가져온 구조와 **의도적으로 바꾼 점**(픽셀 복제 회피, 테마 색 적용 등)
- 스크린샷 확인 결과(4:5, 1:1)와 알려진 한계(항목 최대 개수 등)
- "템플릿 창에서 `이름` 을 선택해 확인해보세요" 안내 (개발 서버는 사용자가 실행)
