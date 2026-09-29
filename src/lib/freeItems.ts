import { FreeItem } from '../types'

/** 선택 키 접두사: 레이아웃 편집에서 템플릿 요소 키와 구분 */
export const FREE_PREFIX = 'free:'

export const freeIdOf = (key: string | null) => key?.startsWith(FREE_PREFIX) ? key.slice(FREE_PREFIX.length) : null

/**
 * 이미지 파일을 data URL 로 읽는다. 긴 변이 max 를 넘으면 줄여서 저장 용량을 아낀다 (localStorage 한도 대비).
 * PNG 는 투명도를 지키려고 PNG 로, 나머지는 JPEG 로 다시 저장한다. 크기를 못 읽는 이미지(SVG 등)는 원본 그대로 w/h = 0.
 */
export function readImage(file: File, max = 1080): Promise<{ src: string; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const original = String(reader.result)
      const img = new Image()
      img.onerror = () => reject(new Error('이미지를 읽을 수 없습니다'))
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height, 1))
        const w = Math.round(img.width * k)
        const h = Math.round(img.height * k)
        if (k === 1 || !w || !h) return resolve({ src: original, w, h })
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        c.getContext('2d')?.drawImage(img, 0, 0, w, h)
        resolve({ src: c.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88), w, h })
      }
      img.src = original
    }
    reader.readAsDataURL(file)
  })
}

/** JSON 불러오기용: 형식이 맞는 항목만 남긴다 */
export function sanitizeFreeItems(value: unknown): FreeItem[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value.filter((v): v is FreeItem =>
    v && typeof v.id === 'string' && (v.kind === 'image' || v.kind === 'text') &&
    [v.x, v.y, v.w].every(Number.isFinite))
  return items.length ? items : undefined
}
