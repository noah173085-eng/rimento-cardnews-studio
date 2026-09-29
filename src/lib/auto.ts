import { CardPage, LogoId, TemplateId } from '../types'

const rimentoLogoCommand = /(리멘토|rimento)\s*로고/i
const companyLogoCommand = /(회사|리더스\s*인싸이트|leaders)\s*로고/i

export function detectLogoCommand(script: string): LogoId | null {
  if (rimentoLogoCommand.test(script)) return 'rimento'
  if (companyLogoCommand.test(script)) return 'company'
  return null
}

export function stripLogoCommands(script: string): string {
  return script.split('\n').filter(line => !rimentoLogoCommand.test(line) && !companyLogoCommand.test(line)).join('\n')
}

const statLike = /\b\d+[.%년개사명건회점배]?\b|%|NPS|KPI|점수|만족도/gi
const processLike = /step|단계|프로세스|과정|흐름|로드맵|절차|→|->/i
const dialogueLike = /[“”"']/g
const checklistLike = /체크|확인|실행|점검|실천|□|✅|☑/i
const comparisonLike = /before|after|비교|반면|전환|변화 전|변화 후|강점|리스크/i
const questionLike = /\?|왜 |무엇|어떻게|어떤 /i
const programLike = /교육일시|교육대상|교육비|안내사항|신청|과정|워크숍|preview/i
const quoteLike = /후기|참여자|고객|말했습니다|느꼈|배웠/i

const pick = (items: TemplateId[], index: number) => items[index % items.length]

export function pickTemplate(page: CardPage, index: number, total: number): TemplateId {
  const merged = [page.title, page.body, ...page.items].join(' ')
  const statCount = (merged.match(statLike) || []).length
  const quoteCount = (merged.match(dialogueLike) || []).length
  const pairCount = page.items.filter(v => v.includes('|')).length

  if (index === 0) {
    if (/과정|오픈|안내|line-?up/i.test(merged)) return 'cover-binder'
    if (questionLike.test(page.title)) return 'cover-question'
    return pick(['cover','cover-browser'], index)
  }
  if (index === total - 1) return /미션|약속|문장|달란트/i.test(merged) ? 'closing' : 'cta'

  if (programLike.test(merged) && page.items.length >= 3) return 'program-info'
  if (statCount >= 4 && pairCount >= 3) return pick(['stats','bar-profile','score-profile'], index)
  if (statCount >= 1 && page.items.length <= 2) return 'stat-focus'
  if (processLike.test(merged) || (page.items.length >= 4 && pairCount >= 3)) return pick(['process','timeline','step-cards'], index)
  if (quoteCount >= 4 || page.items.filter(v => /[“”"]/.test(v)).length >= 2) return 'dialogue'
  if (quoteLike.test(merged) && page.items.length >= 2) return 'testimonial'
  if (checklistLike.test(merged) && page.items.length >= 3) return 'checklist'
  if ((comparisonLike.test(merged) && page.items.length >= 2) || (page.items.length === 2 && pairCount === 2)) return pick(['comparison','before-after'], index)
  if (page.items.length === 4 && pairCount >= 2) return 'matrix'
  if (page.items.length === 3 && pairCount >= 2) return 'cards-3'
  if (page.items.length === 4) return 'cards-4'
  if (page.items.length >= 5) return pick(['list','key-questions'], index)
  if (questionLike.test(page.title)) return 'opening-question'
  if (page.body.length > 150) return 'story'
  if (page.items.length >= 2) return pick(['editorial','insight','quote-focus'], index)
  return 'editorial'
}

export function autoDesignPages(pages: CardPage[]): CardPage[] {
  return pages.map((page, index) => {
    const template = pickTemplate(page, index, pages.length)
    return { ...page, template, layoutEdits: template === page.template ? page.layoutEdits : undefined }
  })
}

export function splitScriptToPages(script: string): CardPage[] {
  const blocks = script
    .split(/\n\s*---+\s*\n|\n\s*\n(?=[^\n]{1,46}\n)/g)
    .map(v => v.trim())
    .filter(Boolean)

  return blocks.map((block, i) => {
    const lines = block.split('\n').map(v => v.trim()).filter(Boolean)
    const title = (lines.shift() || `페이지 ${i + 1}`).replace(/^#+\s*/, '')
    const bullets: string[] = []
    const body: string[] = []
    for (const line of lines) {
      if (/^[-*•]\s+/.test(line)) bullets.push(line.replace(/^[-*•]\s+/, ''))
      else body.push(line)
    }
    return {
      id: crypto.randomUUID(),
      template: 'editorial',
      eyebrow: i === 0 ? 'COVER' : `PAGE ${String(i + 1).padStart(2, '0')}`,
      title,
      body: body.join(' '),
      items: bullets,
      note: '',
    }
  })
}
