import { ArrowDownToLine, ArrowUpToLine, Minus, Plus, Trash2 } from 'lucide-react'
import { FreeItem } from '../types'

/**
 * FreeItemPanel 컴포넌트 — 직접 추가한 이미지·텍스트 박스의 내용과 모양 수정
 *
 * Props:
 * @param {FreeItem} item - 선택한 박스 [Required]
 * @param {string} themeText - 글자색 기본값 표시용 테마 글자색 [Required]
 * @param {function} onChange - 수정 콜백 (patch 전달) [Required]
 * @param {function} onOrder - 쌓는 순서 변경 콜백 ('front' | 'back') [Required]
 * @param {function} onDelete - 삭제 콜백 [Required]
 *
 * Example usage:
 * <FreeItemPanel item={item} themeText="#1b1b1b" onChange={patch => updateFree(item.id, patch)} onOrder={dir => orderFree(item.id, dir)} onDelete={() => removeFree(item.id)}/>
 */
interface Props {
  item: FreeItem
  themeText: string
  onChange: (patch: Partial<FreeItem>) => void
  onOrder: (dir: 'front' | 'back') => void
  onDelete: () => void
}

export function FreeItemPanel({ item, themeText, onChange, onOrder, onDelete }: Props) {
  const size = item.fontSize ?? 40
  return <section className="element-panel">
    <div className="section-head"><h3>선택한 요소</h3><span className="badge">{item.kind === 'image' ? '추가 이미지' : '추가 텍스트'}</span></div>
    <p className="panel-hint">끌어서 이동 · 모서리로 크기 조절{item.kind === 'text' ? ' (글자도 함께) · 좌우 가장자리로 폭만 조절' : ''} · Delete 키로 삭제</p>
    {item.kind === 'text' && <>
      <label>텍스트<textarea className="short" value={item.text ?? ''} onChange={e => onChange({ text: e.target.value })}/></label>
      <div className="field-group">
        글자 크기
        <div className="font-stepper">
          <button onClick={() => onChange({ fontSize: Math.max(8, size - 2) })}><Minus size={15}/></button>
          <b>{size}px</b>
          <button onClick={() => onChange({ fontSize: size + 2 })}><Plus size={15}/></button>
        </div>
      </div>
      <div className="two-col">
        <label>글자색<input type="color" value={item.color ?? themeText} onChange={e => onChange({ color: e.target.value })}/></label>
        <label>굵게<select value={item.isBold ? 'bold' : 'normal'} onChange={e => onChange({ isBold: e.target.value === 'bold' })}>
          <option value="bold">굵게</option>
          <option value="normal">보통</option>
        </select></label>
      </div>
      {item.color && <button className="wide secondary" onClick={() => onChange({ color: undefined })}>테마 글자색으로</button>}
    </>}
    <div className="free-actions">
      <button onClick={() => onOrder('front')} title="맨 앞으로"><ArrowUpToLine size={15}/> 맨 앞으로</button>
      <button onClick={() => onOrder('back')} title="맨 뒤로 (추가 요소들 중)"><ArrowDownToLine size={15}/> 맨 뒤로</button>
      <button className="danger" onClick={onDelete}><Trash2 size={15}/> 삭제</button>
    </div>
  </section>
}
