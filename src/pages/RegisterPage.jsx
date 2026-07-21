import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../features/auth/authApi'
import { MESSAGES } from '../constants/messages'
import { ROUTES } from '../constants/routes'
import { useFeedback } from '../shared/feedback/FeedbackProvider'
import { validateEmail, validateImage, validateNickname, validatePassword } from '../shared/lib/validation'
import { Header } from '../shared/ui/Header'
import { ImageInput } from '../shared/ui/ImageInput'
import './auth-pages.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirm: '', nickname: '', file: null })
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { showToast } = useFeedback()
  const errors = {
    email: validateEmail(form.email),
    password: validatePassword(form.password),
    passwordConfirm: !form.passwordConfirm ? MESSAGES.PASSWORD_CONFIRM_REQUIRED : form.password !== form.passwordConfirm ? MESSAGES.PASSWORD_MISMATCH : '',
    nickname: validateNickname(form.nickname),
    file: validateImage(form.file),
  }
  const valid = Object.values(errors).every((value) => !value)

  const updateField = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!valid) return
    setSubmitting(true)
    try {
      await register(form)
      navigate(ROUTES.LOGIN, { replace: true, state: { registered: true } })
    } catch (error) {
      showToast({ type: 'error', message: error.message, key: `register:${error.status || error.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell auth-page register-page">
      <Header backTo={ROUTES.LOGIN} />
      <main className="center-screen">
        <section className="auth-card signup-card" aria-label="회원가입 페이지">
          <h2 className="form-title">회원가입</h2>
          <form className="auth-form" noValidate onSubmit={handleSubmit}>
            <ImageInput file={form.file} onChange={(file) => updateField('file', file)} />
            <span className="field-error image-error">{errors.file}</span>
            <label className="field-group"><span>이메일 <i className="required">*</i></span><input type="email" placeholder="이메일을 입력하세요" value={form.email} onChange={(event) => updateField('email', event.target.value)} /><span className="field-error">{errors.email}</span></label>
            <label className="field-group"><span>비밀번호 <i className="required">*</i></span><input type="password" placeholder="비밀번호를 입력하세요" value={form.password} onChange={(event) => updateField('password', event.target.value)} /><span className="field-error">{errors.password}</span></label>
            <label className="field-group"><span>비밀번호 확인 <i className="required">*</i></span><input type="password" placeholder="비밀번호를 한번 더 입력하세요" value={form.passwordConfirm} onChange={(event) => updateField('passwordConfirm', event.target.value)} /><span className="field-error">{errors.passwordConfirm}</span></label>
            <label className="field-group"><span>닉네임 <i className="required">*</i></span><input type="text" maxLength="10" placeholder="닉네임을 입력하세요" value={form.nickname} onChange={(event) => updateField('nickname', event.target.value)} /><span className="field-error">{errors.nickname}</span></label>
            <button className="submit-btn" type="submit" disabled={!valid || submitting}>{submitting ? '가입 중' : '회원가입'}</button>
            <p className="auth-link"><Link to={ROUTES.LOGIN}>로그인하러 가기</Link></p>
          </form>
        </section>
      </main>
    </div>
  )
}
