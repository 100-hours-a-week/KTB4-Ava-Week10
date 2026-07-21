import { useState } from 'react'
import { ROUTES } from '../constants/routes'
import { MESSAGES } from '../constants/messages'
import { updatePassword } from '../features/profile/profileApi'
import { useFeedback } from '../shared/feedback/FeedbackProvider'
import { validatePassword } from '../shared/lib/validation'
import { Header } from '../shared/ui/Header'
import './profile-pages.css'

export default function PasswordPage() {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', passwordConfirm: '' })
  const [saving, setSaving] = useState(false)
  const { showToast } = useFeedback()
  const errors = {
    oldPassword: form.oldPassword ? '' : '이전 비밀번호를 입력해주세요.',
    newPassword: validatePassword(form.newPassword, '새로운 비밀번호를 입력해주세요.'),
    passwordConfirm: !form.passwordConfirm ? MESSAGES.PASSWORD_CONFIRM_REQUIRED : form.newPassword !== form.passwordConfirm ? MESSAGES.PASSWORD_MISMATCH : '',
  }
  const valid = Object.values(errors).every((value) => !value)
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!valid) return
    setSaving(true)
    try {
      await updatePassword(form.oldPassword, form.newPassword)
      setForm({ oldPassword: '', newPassword: '', passwordConfirm: '' })
      showToast({ type: 'success', message: '비밀번호가 변경되었습니다.', key: `password-saved:${Date.now()}` })
    } catch (error) {
      showToast({ type: 'error', message: error.message, key: `password:${error.status || error.message}` })
    } finally { setSaving(false) }
  }

  return (
    <div className="page-shell password-page-root"><Header backTo={ROUTES.POSTS} /><main className="page-content password-page"><section><h2 className="section-title">비밀번호 수정</h2><form className="password-form" noValidate onSubmit={handleSubmit}>
      <label className="form-group"><span className="form-label">이전 비밀번호 <i className="required">*</i></span><input type="password" placeholder="이전 비밀번호를 입력해주세요" value={form.oldPassword} onChange={(event) => update('oldPassword', event.target.value)} /><span className="field-error">{errors.oldPassword}</span></label>
      <label className="form-group"><span className="form-label">새로운 비밀번호 <i className="required">*</i></span><input type="password" placeholder="새로운 비밀번호를 입력해주세요" value={form.newPassword} onChange={(event) => update('newPassword', event.target.value)} /><span className="field-error">{errors.newPassword}</span></label>
      <label className="form-group"><span className="form-label">비밀번호 확인 <i className="required">*</i></span><input type="password" placeholder="비밀번호를 한번 더 입력해주세요" value={form.passwordConfirm} onChange={(event) => update('passwordConfirm', event.target.value)} /><span className="field-error">{errors.passwordConfirm}</span></label>
      <button className="submit-btn" type="submit" disabled={!valid || saving}>{saving ? '수정 중' : '수정하기'}</button>
    </form></section></main></div>
  )
}
