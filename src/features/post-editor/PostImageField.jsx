import { useEffect, useId, useRef } from 'react'
import { getFileNameFromUrl } from '../../shared/lib/format'

export function PostImageField({ file, currentImageUrl, onChange, mode, disabled }) {
  const inputId = useId()
  const imageRef = useRef(null)

  useEffect(() => {
    const image = imageRef.current
    if (!image) return undefined
    if (!file) {
      image.src = currentImageUrl || ''
      return undefined
    }
    const objectUrl = URL.createObjectURL(file)
    image.src = objectUrl
    return () => URL.revokeObjectURL(objectUrl)
  }, [currentImageUrl, file])

  const fileName = file?.name || getFileNameFromUrl(currentImageUrl) || '선택된 이미지 없음'
  return (
    <div className={`editor-image-field editor-image-field--${mode}`}>
      {(file || currentImageUrl) && <img ref={imageRef} src={currentImageUrl || undefined} alt="게시글 이미지 미리보기" />}
      <span className="selected-file-name">{fileName}</span>
      <label className="editor-image-picker" htmlFor={inputId}>{mode === 'edit' ? '이미지 변경' : '이미지 추가'}</label>
      <input id={inputId} type="file" accept="image/*" disabled={disabled} onChange={(event) => onChange(event.target.files?.[0] || null)} />
    </div>
  )
}
