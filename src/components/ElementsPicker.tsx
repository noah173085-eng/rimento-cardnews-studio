import { useState } from 'react'
import { Search } from 'lucide-react'
import { FreeItem } from '../types'
import { iconSet } from '../lib/iconSet'

type Shape = NonNullable<FreeItem['shape']>

const shapes: { shape: Shape; label: string }[] = [
  { shape: 'rect', label: '사각형' },
  { shape: 'round', label: '둥근 사각형' },
  { shape: 'ellipse', label: '원' },
  { shape: 'line', label: '선' },
]

/**
 * ElementsPicker 컴포넌트 — 「요소」 버튼을 누르면 뜨는 도형·아이콘 선택 창
 *
 * Props:
 * @param {function} onAddShape - 도형 모양을 받아 추가하는 콜백 [Required]
 * @param {function} onAddIcon - 아이콘 이름을 받아 추가하는 콜백 [Required]
 * @param {function} onClose - 창 닫기 콜백 [Required]
 *
 * Example usage:
 * <ElementsPicker onAddShape={addShape} onAddIcon={addIcon} onClose={() => setOpen(false)}/>
 */
export function ElementsPicker({ onAddShape, onAddIcon, onClose }: {
  onAddShape: (shape: Shape) => void
  onAddIcon: (name: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const icons = q ? iconSet.filter(i => `${i.name} ${i.tags}`.toLowerCase().includes(q)) : iconSet

  return <>
    <div className="picker-backdrop" onMouseDown={onClose}/>
    <div className="elements-picker">
      <div className="picker-head">도형</div>
      <div className="picker-shapes">{shapes.map(({ shape, label }) =>
        <button key={shape} onClick={() => onAddShape(shape)} title={label}><i className={`shape-sample is-${shape}`}/><span>{label}</span></button>)}
      </div>
      <div className="picker-head">아이콘 <span className="hint">{icons.length}개</span></div>
      <label className="picker-search"><Search size={15}/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="검색: 목표, 성장, 사람, 교육…"/></label>
      <div className="picker-icons">
        {icons.map(({ name, Icon }) => <button key={name} onClick={() => onAddIcon(name)} title={name}><Icon size={24}/></button>)}
        {!icons.length && <p className="panel-hint">검색 결과가 없어요</p>}
      </div>
    </div>
  </>
}
