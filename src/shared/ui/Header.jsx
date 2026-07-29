import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../app/providers/AuthContext'
import { DEFAULT_PROFILE_IMAGE } from '../../constants/assets'
import { ROUTES } from '../../constants/routes'
import { useFeedback } from '../feedback/FeedbackContext'

export function Header({ backTo }) {
  const { user, signOut } = useAuth()
  const { showToast } = useFeedback()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)

  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') closeAndRestoreFocus()
    }
    const handlePointer = (event) => {
      if (!event.target.closest('.profile-menu-container')) setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('pointerdown', handlePointer)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('pointerdown', handlePointer)
    }
  }, [closeAndRestoreFocus, open])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      showToast({ type: 'error', message: error.message, key: 'logout' })
    } finally {
      navigate(ROUTES.LOGIN, { replace: true })
    }
  }

  return (
    <header className="page-header">
      {backTo && <Link to={backTo} className="back-button" aria-label="뒤로가기" />}
      <Link to={user ? ROUTES.POSTS : ROUTES.LOGIN}>
        <h1 className="brand">우리 동네 모임</h1>
      </Link>
      {user && (
        <div
          className="profile-menu-container"
          onPointerEnter={() => setOpen(true)}
          onPointerLeave={() => setOpen(false)}
        >
          <button
            ref={triggerRef}
            className="profile-btn"
            type="button"
            aria-label="프로필 메뉴"
            aria-expanded={open}
            aria-controls="profile-disclosure"
            onClick={() => setOpen((value) => !value)}
          >
            <img src={user.profileImageUrl || DEFAULT_PROFILE_IMAGE} alt="" />
          </button>
          {open && (
            <nav className="profile-menu" id="profile-disclosure" aria-label="프로필 메뉴">
              <Link to={ROUTES.PROFILE} className="menu-item">
                회원정보수정
              </Link>
              <Link to={ROUTES.PASSWORD} className="menu-item">
                비밀번호수정
              </Link>
              <button type="button" className="menu-item" onClick={handleLogout}>
                로그아웃
              </button>
            </nav>
          )}
        </div>
      )}
    </header>
  )
}
