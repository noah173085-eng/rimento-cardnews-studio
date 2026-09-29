import { memo } from 'react'
import { CardPage, CardProject } from '../types'
import { CardCanvas } from './CardCanvas'

const THUMB_W = 56

/**
 * PageThumb 컴포넌트 — 페이지 목록의 작은 실제 미리보기 (1080 캔버스를 축소)
 * 페이지 내용이나 공통 설정이 바뀐 썸네일만 다시 그린다 (모든 페이지를 매번 다시 그리면 입력이 느려짐)
 *
 * Props:
 * @param {CardProject} project - 프로젝트 (테마·규격·로고 등 공통 설정) [Required]
 * @param {CardPage} page - 그릴 페이지 [Required]
 * @param {number} pageIndex - 페이지 순번 (쪽수 표시용) [Required]
 *
 * Example usage:
 * <PageThumb project={project} page={page} pageIndex={0}/>
 */
function Thumb({ project, page, pageIndex }: { project: CardProject; page: CardPage; pageIndex: number }) {
  const h = project.aspect === '1:1' ? 1080 : 1350
  const k = THUMB_W / 1080
  return <div className="page-thumb" style={{ width: THUMB_W, height: h * k }}>
    <div style={{ transform: `scale(${k})`, transformOrigin: 'top left', width: 1080, height: h }}>
      <CardCanvas project={project} page={page} pageIndex={pageIndex}/>
    </div>
  </div>
}

/** 페이지 외 공통 설정이 같은지: pages 배열은 비교하지 않고 페이지 수만 본다 */
const sameShared = (a: CardProject, b: CardProject) => {
  const { pages: pa, ...ra } = a
  const { pages: pb, ...rb } = b
  return pa.length === pb.length && Object.keys(ra).every(k => ra[k as keyof typeof ra] === rb[k as keyof typeof rb])
}

export const PageThumb = memo(Thumb, (prev, next) =>
  prev.page === next.page && prev.pageIndex === next.pageIndex && sameShared(prev.project, next.project))
