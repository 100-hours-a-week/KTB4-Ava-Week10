import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../app/providers/AuthProvider'
import { ROUTES } from '../constants/routes'
import { useFeedback } from '../shared/feedback/FeedbackProvider'
import { validateEmail, validatePassword } from '../shared/lib/validation'
import { Header } from '../shared/ui/Header'
import './auth-pages.css'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const { signIn, clearSessionExpired } = useAuth()
  const { showToast } = useFeedback()
  const location = useLocation()
  const navigate = useNavigate()
  const consumedState = useRef(false)
  const errors = { email: validateEmail(form.email), password: validatePassword(form.password) }
  const valid = !errors.email && !errors.password

  useEffect(() => {
    if (consumedState.current || !location.state) return
    consumedState.current = true
    if (location.state.registered) showToast({ type: 'success', message: '회원가입이 완료되었습니다.', key: 'registered' })
    if (location.state.withdrawn) showToast({ type: 'success', message: '회원 탈퇴가 완료되었습니다.', key: 'withdrawn' })
    if (location.state.sessionExpired) {
      showToast({ type: 'error', message: '로그인이 만료되었습니다. 다시 로그인해주세요.', key: 'session-expired' })
      clearSessionExpired()
    }
    navigate(location.pathname, { replace: true, state: null })
  }, [clearSessionExpired, location.pathname, location.state, navigate, showToast])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!valid) return
    setSubmitting(true)
    try {
      await signIn(form)
      navigate(location.state?.from || ROUTES.POSTS, { replace: true })
    } catch (error) {
      showToast({ type: 'error', message: error.message, key: `login:${error.status || error.message}` })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell auth-page login-page">
      <Header />
      <main className="center-screen">
        <section className="auth-card" aria-label="로그인 페이지">
          <h2 className="form-title">로그인</h2>
          <form className="auth-form" noValidate onSubmit={handleSubmit}>
            <label className="field-group">
              <span>이메일</span>
              <input type="email" placeholder="이메일을 입력하세요" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} aria-describedby="email-error" />
              <span id="email-error" className="field-error">{errors.email}</span>
            </label>
            <label className="field-group">
              <span>비밀번호</span>
              <input type="password" placeholder="비밀번호를 입력하세요" value={form.password} onChange={(event) => setForm((value) => ({ ...value, password: event.target.value }))} aria-describedby="password-error" />
              <span id="password-error" className="field-error">{errors.password}</span>
            </label>
            <button className="submit-btn" type="submit" disabled={!valid || submitting}>{submitting ? '로그인 중' : '로그인'}</button>
            <p className="auth-link"><Link to={ROUTES.REGISTER}>회원가입</Link></p>
          </form>
        </section>
      </main>
    </div>
  )
}
