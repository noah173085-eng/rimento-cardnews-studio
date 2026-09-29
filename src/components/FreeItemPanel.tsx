import { AlignCenter, AlignLeft, AlignRight, ArrowDownToLine, ArrowUpToLine, CopyPlus, Minus, Plus, Trash2 } from 'lucide-react'
import { FreeItem } from '../types'
import { AlignBar, AlignDir } from './AlignBar'
import { SizeFields } from './SizeFields'
import { RichTextEditor } from './RichTextEditor'
import { fontOptions } from '../lib/richText'

const kindLabel: Record<FreeItem['kind'], string> = { text: '추가 텍스트', image: '추가 이미지', shape: '추가 도형', icon: '추가 아이콘' }

/**
 * FreeItemPanel 컴포넌트 — 직접 추가한 이미지·텍스트·도형·아이콘의 내용과 모양 수정
 *
 * Props:
 * @param {FreeItem} item - 선택한 요소 [Required]
 * @param {string} themeText - 글자색 기본값 표시용 테마 글자색 [Required]
 * @param {string} themeAccent - 도형·아이콘 색 기본값 표시용 테마 포인트 색 [Required]
 * @param {function} onChange - 수정 콜백 (patch 전달) [Required]
 * @param {function} onAlign - 카드 기준 정렬 콜백 [Required]
 * @param {function} onDuplicate - 복제 콜백 [Required]
 * @param {function} onOrder - 쌓는 순서 변경 콜백 ('front' | 'back') [Required]
 * @param {function} onDelete - 삭제 콜백 [Required]
 *
 * Example usage:
 * <FreeItemPanel item={item} themeText="#1b1b1b" themeAccent="#6d3fd1" onChange={patch => updateFree(item.id, patch)}
 *   onAlign={alignSelected} onDuplicate={duplicateFree} onOrder={dir => orderFree(item.id, dir)} onDelete={() => removeFree(item.id)}/>
 */
interface Props {
  item: FreeItem
  themeText: string
  themeAccent: string
  onChange: (patch: Partial<FreeItem>) => void
  onAlign: (dir: AlignDir) => void
  onDuplicate: () => void
  onOrder: (dir: 'front' | 'back') => void
  onDelete: () => void
}

export function FreeItemPanel({ item, themeText, themeAccent, onChange, onAlign, onDuplicate, onOrder, onDelete }: Props) {
  const size = item.fontSize ?? 40
  const lineHeight = item.lineHeight ?? 1.4
  const opacity = Math.round((item.opacity ?? 1) * 100)
  const isText = item.kind === 'text'
  const isColored = item.kind === 'shape' || item.kind === 'icon'

  return <section className="element-panel">
    <div className="section-head"><h3>선택한 요소</h3><span className="badge">{kindLabel[item.kind]}</span></div>
    <p className="panel-hint">끌어서 이동 · 모서리로 크기 조절{isText ? ' (글자도 함께) · 좌우 가장자리로 폭만' : ''} · Ctrl+C/V 복사 · Delete 삭제</p>

    <SizeFields box={{ x: item.x, y: item.y, w: item.w, h: item.h ?? item.w }} isHeightAuto={isText}
      onChange={p => onChange(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Math.round(v as number)])))}/>

    {isText && <>
      <RichTextEditor item={item} onChange={onChange}/>
      <label>글꼴 (전체)<select value={item.fontFamily ?? ''} onChange={e => onChange({ fontFamily: e.target.value || undefined })}>
        {fontOptions.map(o => <option key={o.label} value={o.value}>{o.label}</option>)}
      </select></label>
      <div className="two-col">
        <div className="field-group">
          글자 크기
          <div className="font-stepper">
            <button onClick={() => onChange({ fontSize: Math.max(8, size - 2) })}><Minus size={15}/></button>
            <b>{size}px</b>
            <button onClick={() => onChange({ fontSize: size + 2 })}><Plus size={15}/></button>
          </div>
        </div>
        <div className="field-group">
          줄간격
          <div className="font-stepper">
            <button onClick={() => onChange({ lineHeight: Math.max(0.9, +(lineHeight - 0.1).toFixed(1)) })}><Minus size={15}/></button>
            <b>{lineHeight.toFixed(1)}</b>
            <button onClick={() => onChange({ lineHeight: Math.min(2.4, +(lineHeight + 0.1).toFixed(1)) })}><Plus size={15}/></button>
          </div>
        </div>
      </div>
      <div className="field-group">
        문단 정렬
        <div className="segmented">
          {([['left', AlignLeft, '왼쪽'], ['center', AlignCenter, '가운데'], ['right', AlignRight, '오른쪽']] as const).map(([value, Icon, label]) =>
            <button key={value} className={(item.align ?? 'left') === value ? 'active' : ''} onClick={() => onChange({ align: value })} title={label}><Icon size={16}/></button>)}
        </div>
      </div>
      <div className="two-col">
        <label>글자색<input type="color" value={item.color ?? themeText} onChange={e => onChange({ color: e.target.value })}/></label>
        <label>굵기<select value={item.isBold ? 'bold' : 'normal'} onChange={e => onChange({ isBold: e.target.value === 'bold' })}>
          <option value="bold">굵게</option>
          <option value="normal">보통</option>
        </select></label>
      </div>
      <div className="two-col">
        <label className="check-label"><input type="checkbox" checked={!!item.bgColor} onChange={e => onChange({ bgColor: e.target.checked ? '#fff3a3' : undefined })}/> 하이라이트</label>
        {item.bgColor && <label>배경색<input type="color" value={item.bgColor} onChange={e => onChange({ bgColor: e.target.value })}/></label>}
      </div>
      {item.color && <button className="wide secondary" onClick={() => onChange({ color: undefined })}>테마 글자색으로</button>}
    </>}

    {isColored && <>
      <label>색<input type="color" value={item.color ?? themeAccent} onChange={e => onChange({ color: e.target.value })}/></label>
      {item.color && <button className="wide secondary" onClick={() => onChange({ color: undefined })}>테마 포인트 색으로</button>}
    </>}

    <label>불투명도 <span className="hint">{opacity}%</span>
      <input type="range" min={10} max={100} step={5} value={opacity} onChange={e => onChange({ opacity: +e.target.value === 100 ? undefined : +e.target.value / 100 })}/>
    </label>

    <AlignBar onAlign={onAlign}/>

    <div className="free-actions is-four">
      <button onClick={onDuplicate} title="복제 (Ctrl+C → Ctrl+V)"><CopyPlus size={15}/> 복제</button>
      <button onClick={() => onOrder('front')} title="맨 앞으로"><ArrowUpToLine size={15}/> 앞으로</button>
      <button onClick={() => onOrder('back')} title="맨 뒤로 (추가 요소들 중)"><ArrowDownToLine size={15}/> 뒤로</button>
      <button className="danger" onClick={onDelete}><Trash2 size={15}/> 삭제</button>
    </div>
  </section>
}
