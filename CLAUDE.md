# Claude Code Project Guide — Rimento Cardnews Studio V2

## Goal
리더스인싸이트의 HR 매거진형 카드뉴스를 반복 제작하는 브라우저 기반 에디터.
사용자는 디자인 툴을 직접 다루지 않고 페이지별 원고만 넣어도 리멘토 브랜드 문법에 맞는 카드뉴스를 완성할 수 있어야 한다.

## Design reference
- Rimento 28: 가장 중요한 기준. 강한 헤드라인, 퍼플/오렌지, 크림 배경, 유기적 도형, 사례/말풍선/점수 프로필/인사이트 구조.
- Rimento 26: 틸 기반 HR 리포트, 프로세스, 3-column 정보 구조.
- Rimento 27: browser/window 프레임, 인터뷰/질문형.
- Rimento 25/29: 교육과정 정보표와 바인더 헤더.
- Rimento 24: 흑백 에디토리얼과 포스트잇 포인트.

Do not pixel-copy a reference page. Preserve the visual grammar and create reusable original layouts.

## Current architecture
- React + TypeScript + Vite
- `src/types.ts`: project/page/template model
- `src/templateLibrary.ts`: 30 templates metadata
- `src/themes.ts`: 5 visual token sets
- `src/components/CardCanvas.tsx`: all 30 canvas renderers
- `src/lib/auto.ts`: content-driven automatic template selection
- `src/App.tsx`: editor, gallery, PNG/ZIP, JSON, localStorage
- `src/styles.css`: editor + card design system

## Adding templates
When the user sends a screenshot to turn into a template, follow `.claude/skills/add-template/SKILL.md`.
`npm run check:templates` (also run by `npm run build`) fails on missing registrations and regenerates `TEMPLATES.md`.

## Non-negotiables
1. `TemplateId` remains compatible with existing pages wherever possible.
2. JSON import/export must not break.
3. localStorage auto-save must remain.
4. `CardCanvas` renders at fixed 1080px dimensions before preview scaling.
5. PNG single export and ZIP all export must remain.
6. API keys must never be exposed in client code.
7. Do not replace all templates with one generic component. Each template should remain visually distinguishable.
8. Do not change visual design (layout, colors, type scale, spacing, shapes, themes) unless the user explicitly asks for that specific change. Bug fixes and new features must keep existing templates pixel-identical.

## Brand defaults
- Default canvas: 1080×1350 (Instagram portrait). 1080×1080 is secondary.
- Font: Pretendard for all card text. Korean headlines and emphasis use bold weights (700~800). Apply this to new templates; do not re-weight existing ones without asking.
- Pretendard is self-hosted via the `pretendard` npm package, not a CDN, so PNG/ZIP export can embed it.
  Import it once in `src/main.tsx`: `import 'pretendard/dist/web/static/pretendard.css'`
  and use `font-family: 'Pretendard', system-ui, sans-serif`.
- Before PNG/ZIP export, `await document.fonts.ready` so captures never fall back to a system font.

## Design quality rules
- One page = one dominant message.
- Prefer large type and generous whitespace over dense text.
- Korean headline line-height 1.05~1.18; body 1.45~1.65.
- Use only 1 primary accent + 1 secondary accent per theme.
- Cards should have a clear hierarchy: eyebrow → title → explanation → visual structure → takeaway.
- Avoid gratuitous gradients, glassmorphism, or random shadows.
- For long content, reduce type size before shrinking margins.
- Keep footer/header small and consistent.

## Recommended next upgrades
- Drag-and-drop page sorting.
- Real thumbnail rendering for all 30 templates.
- PDF export.
- Logo/image asset library.
- Per-template sample-content autofill.
- Serverless Anthropic API endpoint for copy compression and layout recommendation.
- Supabase project save/login if team collaboration is needed.
