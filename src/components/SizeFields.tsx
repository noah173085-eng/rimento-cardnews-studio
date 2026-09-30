import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'

type Field = 'x' | 'y' | 'w' | 'h'
const labels: Record<Field, string> = { x: 'X', y: 'Y', w: '너비', h: '높이' }

/**
 * SizeFields 컴포넌트 — 위치·크기를 px(카드 1080 기준)로 직접 입력
 * 입력 중간값(예: 120 을 치는 도중의 1, 12)으로 요소가 튀지 않도록 Enter 나 칸을 벗어날 때 적용한다.
 *
 * Props:
 * @param {object} box - 지금 위치·크기 { x, y, w, h } [Required]
 * @param {boolean} isHeightAuto - 높이가 지금 내용에 따라 정해지는 중이면 칸을 비우고 '자동'으로 표시 (숫자를 넣으면 고정) [Optional, 기본값: false]
 * @param {function} onChange - 바뀐 값만 담아 호출 ({ w: 300 } 등) [Required]
 * @param {function} onReset - 크기를 원래대로 (없으면 버튼 숨김) [Optional]
 *
 * Example usage:
 * <SizeFields box={{ x: 90, y: 200, w: 900, h: 120 }} onChange={patch => resize(patch)}/>
 */
export function SizeFields({ box, isHeightAuto = false, onChange, onReset }: {
  box: { x: number; y: number; w: number; h: number }
  isHeightAuto?: boolean
  onChange: (patch: Partial<Record<Field, number>>) => void
  onReset?: () => void
}) {
  const shown = { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.w), h: Math.round(box.h) }
  const [draft, setDraft] = useState<Record<Field, string>>({ x: '', y: '', w: '', h: '' })
  const key = `${shown.x}|${shown.y}|${shown.w}|${shown.h}`

  // 바깥에서 값이 바뀌면(드래그·방향키·되돌리기) 칸도 따라간다
  useEffect(() => setDraft({ x: String(shown.x), y: String(shown.y), w: String(shown.w), h: isHeightAuto ? '' : String(shown.h) }), [key, isHeightAuto])

  const apply = (field: Field) => {
    const v = Number(draft[field])
    const isSize = field === 'w' || field === 'h'
    const isEmptyAuto = field === 'h' && isHeightAuto && draft.h === ''
    if (isEmptyAuto || !Number.isFinite(v) || (isSize && v < 1) || (v === shown[field] && !(field === 'h' && isHeightAuto))) {
      setDraft(d => ({ ...d, [field]: field === 'h' && isHeightAuto ? '' : String(shown[field]) }))
      return
    }
    onChange({ [field]: v })
  }

  return <div className="field-group">
    크기·위치 <span className="hint">px · 카드 1080 기준 · Enter 로 적용</span>
    <div className="size-fields">
      {(['x', 'y', 'w', 'h'] as Field[]).map(field => <label key={field} className="size-field">
        <span>{labels[field]}</span>
        <input type="number" value={draft[field]} placeholder={field === 'h' && isHeightAuto ? '자동' : ''}
          onChange={e => setDraft(d => ({ ...d, [field]: e.target.value }))}
          onBlur={() => apply(field)}
          onKeyDown={e => { if (e.key === 'Enter') apply(field) }}/>
      </label>)}
      {onReset && <button onClick={onReset} title="크기 원래대로"><RotateCcw size={15}/></button>}
    </div>
  </div>
}
