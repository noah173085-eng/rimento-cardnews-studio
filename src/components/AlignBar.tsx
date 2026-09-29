import {
  AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignStartHorizontal, AlignStartVertical,
} from 'lucide-react'

export type AlignDir = 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom'

const buttons: { dir: AlignDir; label: string; Icon: typeof AlignStartVertical }[] = [
  { dir: 'left', label: '왼쪽 맞춤', Icon: AlignStartVertical },
  { dir: 'hcenter', label: '가로 가운데', Icon: AlignCenterVertical },
  { dir: 'right', label: '오른쪽 맞춤', Icon: AlignEndVertical },
  { dir: 'top', label: '위쪽 맞춤', Icon: AlignStartHorizontal },
  { dir: 'vcenter', label: '세로 가운데', Icon: AlignCenterHorizontal },
  { dir: 'bottom', label: '아래쪽 맞춤', Icon: AlignEndHorizontal },
]

/**
 * AlignBar 컴포넌트 — 선택한 요소를 카드 기준으로 정렬하는 버튼 6개
 *
 * Props:
 * @param {function} onAlign - 정렬 방향을 받아 처리하는 콜백 [Required]
 *
 * Example usage:
 * <AlignBar onAlign={dir => alignSelected(dir)}/>
 */
export function AlignBar({ onAlign }: { onAlign: (dir: AlignDir) => void }) {
  return <div className="field-group">
    카드 기준 정렬 <span className="hint">방향키 1px · Shift+방향키 10px 이동</span>
    <div className="align-bar">{buttons.map(({ dir, label, Icon }) =>
      <button key={dir} onClick={() => onAlign(dir)} title={label}><Icon size={17}/></button>)}
    </div>
  </div>
}
