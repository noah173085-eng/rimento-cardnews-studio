/**
 * 텍스트 박스 부분 서식(글꼴·글씨색·크기·굵기).
 * 서식은 <span style> 로 저장한다. JSON 불러오기로 들어온 HTML 도 그대로 화면에 넣으므로
 * 그리기 전에 항상 sanitizeRich 로 허용한 태그·스타일만 남긴다 (스크립트·링크·이벤트 속성 제거).
 */

/** 고를 수 있는 글꼴. value 는 저장값(CSS font-family)이므로 바꾸지 말 것 */
export const fontOptions: { label: string; value: string }[] = [
  { label: '프리텐다드 (기본)', value: '' },
  { label: '나눔명조', value: "'Nanum Myeongjo', serif" },
  { label: '고운돋움', value: "'Gowun Dodum', sans-serif" },
  { label: '검은고딕', value: "'Black Han Sans', sans-serif" },
  { label: '나눔손글씨 펜', value: "'Nanum Pen Script', cursive" },
]

const KEEP_TAGS = new Set(['SPAN', 'B', 'STRONG', 'BR', 'DIV', 'P'])
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'SVG', 'MATH', 'LINK', 'META', 'IMG', 'VIDEO', 'AUDIO'])
const KEEP_STYLES = ['color', 'font-size', 'font-family', 'font-weight']

function clean(node: Element) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) continue
    if (child.nodeType !== Node.ELEMENT_NODE) { child.remove(); continue }
    const el = child as HTMLElement
    if (DROP_TAGS.has(el.tagName)) { el.remove(); continue }
    clean(el)
    if (!KEEP_TAGS.has(el.tagName)) { el.replaceWith(...Array.from(el.childNodes)); continue }
    const style = KEEP_STYLES
      .map(p => [p, el.style.getPropertyValue(p)] as const)
      .filter(([, v]) => v && !/url\(|expression|javascript:/i.test(v))
      .map(([p, v]) => `${p}:${v}`).join(';')
    for (const attr of Array.from(el.attributes)) el.removeAttribute(attr.name)
    if (style) el.setAttribute('style', style)
  }
}

/** 허용한 태그(span·b·strong·br·div·p)와 스타일(color·font-size·font-family·font-weight)만 남긴다 */
export function sanitizeRich(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''
  clean(root)
  return root.innerHTML
}

/** 서식 없는 글자를 편집기용 HTML 로 (특수문자 이스케이프, 줄바꿈 → <br>) */
export function textToHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)).replace(/\n/g, '<br>')
}
