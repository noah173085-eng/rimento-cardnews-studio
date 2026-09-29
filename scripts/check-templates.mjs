/**
 * 템플릿 등록 점검 + TEMPLATES.md 자동 생성
 *
 * 템플릿 하나는 3곳에 등록돼야 한다. 하나라도 빠지면 오류로 빌드를 멈춘다.
 *   1) src/types.ts            TemplateId 유니온
 *   2) src/templateLibrary.ts  templateLibrary 메타데이터 (한 줄 형식)
 *   3) src/components/CardCanvas.tsx  컴포넌트(최상위 className="layout ...") + switch 의 case (editorial 은 default)
 * CSS 는 템플릿마다 클래스 이름 규칙이 달라 점검하지 않는다 (렌더링 확인은 SKILL.md 절차로).
 * 점검이 통과하면 templateLibrary 순서대로 TEMPLATES.md 를 다시 쓴다.
 *
 * 실행: npm run check:templates   (npm run build 에도 포함)
 */
import { readFileSync, writeFileSync } from 'node:fs'

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const types = read('src/types.ts')
const library = read('src/templateLibrary.ts')
const canvas = read('src/components/CardCanvas.tsx')

const union = types.match(/export type TemplateId =([\s\S]*?)\n\nexport/)?.[1] ?? ''
const typeIds = [...union.matchAll(/'([a-z0-9-]+)'/g)].map(m => m[1])

const metas = [...library.matchAll(/\{ id:'([^']+)', name:'([^']*)', category:'([^']*)', description:'([^']*)', hint:'([^']*)'/g)]
  .map(([, id, name, category, description, hint]) => ({ id, name, category, description, hint }))
const metaIds = metas.map(m => m.id)

// case 'id': return <Component .../>  → id 와 컴포넌트 이름
const cases = new Map([...canvas.matchAll(/case '([^']+)': return <(\w+)/g)].map(m => [m[1], m[2]]))
cases.set('editorial', canvas.match(/default: return <(\w+)/)?.[1])

const errors = []
const dupes = list => list.filter((v, i) => list.indexOf(v) !== i)
for (const id of dupes(typeIds)) errors.push(`types.ts: '${id}' 중복`)
for (const id of dupes(metaIds)) errors.push(`templateLibrary.ts: '${id}' 중복`)

for (const id of typeIds) {
  if (!metaIds.includes(id)) errors.push(`'${id}': templateLibrary.ts 메타데이터 없음`)
  const comp = cases.get(id)
  if (!comp) { errors.push(`'${id}': CardCanvas.tsx switch 에 case 없음`); continue }
  // 컴포넌트가 있고, 최상위가 className="layout xxx" 인지 (레이아웃 편집·문구 수정이 .layout 기준으로 동작)
  const layoutClass = canvas.match(new RegExp(`function ${comp}\\([\\s\\S]*?className="layout ([\\w-]+)`))?.[1]
  if (!layoutClass) errors.push(`'${id}': ${comp} 컴포넌트 또는 최상위 className="layout ..." 없음`)
}
for (const id of metaIds) if (!typeIds.includes(id)) errors.push(`'${id}': templateLibrary 에는 있으나 TemplateId 에 없음`)
for (const id of cases.keys()) if (!typeIds.includes(id)) errors.push(`'${id}': CardCanvas case 는 있으나 TemplateId 에 없음`)

if (errors.length) {
  console.error(`템플릿 점검 실패 (${errors.length}건)\n- ${errors.join('\n- ')}`)
  process.exit(1)
}

const esc = s => s.replace(/\|/g, '\\|')
const rows = metas.map((m, i) => `| ${String(i + 1).padStart(2, '0')} | ${m.id} | ${esc(m.name)} | ${m.category} | ${esc(m.description)} | ${esc(m.hint)} |`)
writeFileSync(new URL('../TEMPLATES.md', import.meta.url), `# Rimento Template Guide (${metas.length})

> 이 파일은 \`npm run check:templates\` 가 src/templateLibrary.ts 에서 자동 생성합니다. 직접 수정하지 마세요.
> 새 템플릿 추가 절차: .claude/skills/add-template/SKILL.md

템플릿 선택 시 기존 페이지 내용은 유지되고 시각 구조만 바뀝니다.

| No | Template ID | 이름 | 분류 | 설명 | 입력 가이드 |
|---:|---|---|---|---|---|
${rows.join('\n')}
`)
console.log(`템플릿 점검 통과: ${metas.length}개 · TEMPLATES.md 갱신`)
