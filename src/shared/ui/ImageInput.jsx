import { useEffect, useId, useRef } from 'react'
import { DEFAULT_PROFILE_IMAGE } from '../../constants/assets'

export function ImageInput({ file, onChange, currentUrl, variant = 'empty', label = '프로필 사진' }) {
  const inputId = useId()
  const imageRef = useRef(null)

  // Object URL은 effect에서만 만들고 file 교체와 unmount 때 즉시 해제한다.
  useEffect(() => {
    const image = imageRef.current
    if (!image) return undefined
    if (!file) {
      image.src = currentUrl || (variant === 'change' ? DEFAULT_PROFILE_IMAGE : '')
      return undefined
    }
    const objectUrl = URL.createObjectURL(file)
    image.src = objectUrl
    return () => URL.revokeObjectURL(objectUrl)
  }, [currentUrl, file, variant])

  const imageUrl = currentUrl || (variant === 'change' ? DEFAULT_PROFILE_IMAGE : '')

  return (
    <div className={`image-input image-input--${variant}`}>
      <span className="profile-label">{label}</span>
      <label htmlFor={inputId} className="image-input__picker">
        {(file || imageUrl) && <img ref={imageRef} src={imageUrl || undefined} alt="프로필 사진 미리보기" />}
        {variant === 'empty' ? <span className="profile-plus" aria-hidden="true" /> : <span className="image-change-label">변경</span>}
        <input id={inputId} type="file" accept="image/*" hidden onChange={(event) => onChange(event.target.files?.[0] || null)} />
      </label>
    </div>
  )
}
