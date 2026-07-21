import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../app/providers/AuthProvider'
import { ROUTES } from '../constants/routes'
import * as profileApi from '../features/profile/profileApi'
import { useProfile } from '../features/profile/useProfile'
import { useFeedback } from '../shared/feedback/FeedbackProvider'
import { validateImage, validateNickname } from '../shared/lib/validation'
import { ConfirmDialog } from '../shared/ui/ConfirmDialog'
import { Header } from '../shared/ui/Header'
import { ImageInput } from '../shared/ui/ImageInput'
import { LoadingFallback } from '../shared/ui/LoadingFallback'
import './profile-pages.css'

export default function ProfilePage() {
  const { updateUser, clearAuth } = useAuth()
  const { profile, loading, error, load, save } = useProfile(updateUser)
  const [nickname, setNickname] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const { showToast, showErrorDialog } = useFeedback()
  const navigate = useNavigate()
  const shownError = useRef(null)
  const nicknameError = validateNickname(nickname, { optional: true })
  const fileError = validateImage(file)
  const nicknameChanged = nickname.trim() && nickname.trim() !== profile?.nickname
  const canSubmit = !nicknameError && !fileError && Boolean(nicknameChanged || file)

  useEffect(() => {
    if (!error || shownError.current === error) return
    shownError.current = error
    showErrorDialog({ title: '회원정보를 불러오지 못했습니다', message: error.message, onRetry: load, onCancel: () => navigate(ROUTES.POSTS) })
  }, [error, load, navigate, showErrorDialog])

  const handleSave = async (event) => {
    event.preventDefault()
    if (!canSubmit) return
    setSaving(true)
    try {
      await save({ nickname: nicknameChanged ? nickname.trim() : null, file })
      setNickname('')
      setFile(null)
      showToast({ type: 'success', message: '회원정보가 수정되었습니다.', key: `profile-saved:${Date.now()}` })
    } catch (saveError) {
      showToast({ type: 'error', message: saveError.message, key: `profile:${saveError.status || saveError.message}` })
    } finally { setSaving(false) }
  }

  const handleWithdraw = async () => {
    setSaving(true)
    try {
      await profileApi.withdraw()
      // 서버의 cookie 정리 여부와 무관하게 204 직후 local auth를 폐기한다.
      clearAuth()
      navigate(ROUTES.LOGIN, { replace: true, state: { withdrawn: true } })
    } catch (withdrawError) {
      showToast({ type: 'error', message: withdrawError.message, key: `withdraw:${withdrawError.status || withdrawError.message}` })
      setWithdrawOpen(false)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="page-shell"><Header backTo={ROUTES.POSTS} /><LoadingFallback label="회원정보를 불러오는 중" /></div>

  return (
    <div className="page-shell profile-page-root">
      <Header backTo={ROUTES.POSTS} />
      {profile && <main className="page-content profile-page"><section><h2 className="section-title">회원정보수정</h2><form className="profile-form" noValidate onSubmit={handleSave}>
        <ImageInput variant="change" file={file} currentUrl={profile.profileImageUrl} onChange={setFile} />
        <span className="field-error image-error">{fileError}</span>
        <div className="form-group"><span className="form-label">이메일</span><div className="email-display">{profile.email}</div></div>
        <label className="form-group"><span className="form-label">닉네임</span><small className="old-nickname">현재 닉네임: {profile.nickname}</small><input type="text" maxLength="10" placeholder="변경할 닉네임을 입력해주세요" value={nickname} onChange={(event) => setNickname(event.target.value)} /><span className="field-error">{nicknameError}</span></label>
        <button className="submit-btn" type="submit" disabled={!canSubmit || saving}>{saving ? '수정 중' : '수정하기'}</button>
        <button className="delete-account-btn" type="button" onClick={() => setWithdrawOpen(true)}>회원 탈퇴</button>
      </form></section></main>}
      {withdrawOpen && <ConfirmDialog title="회원탈퇴 하시겠습니까?" description="탈퇴 후에는 현재 계정의 정보를 복구할 수 없습니다." danger confirmLabel="탈퇴" confirmDisabled={saving} onConfirm={handleWithdraw} onCancel={() => setWithdrawOpen(false)} />}
    </div>
  )
}
