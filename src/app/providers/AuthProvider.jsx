import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AUTH_EXPIRED_EVENT } from '../../constants/storage'
import { authStorage } from '../../shared/auth/authStorage'
import * as authApi from '../../features/auth/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [hydrated, setHydrated] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let active = true
    const hydrate = async () => {
      if (!authStorage.getToken()) { setHydrated(true); return }
      try {
        const currentUser = await authApi.getCurrentUser()
        if (active) { setUser(currentUser) }
      } catch {
        if (active) { authStorage.clear(); setUser(null) }
      } finally {
        if (active) setHydrated(true)
      }
    }
    hydrate()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const handleExpired = () => { setSessionExpired(true); setUser(null); setHydrated(true) }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
  }, [])

  const signIn = useCallback(async (credentials) => {
    const data = await authApi.login(credentials)
    authStorage.setToken(data.accessToken)
    const nextUser = { id: data.id, email: data.email, nickname: data.nickname, profileImageUrl: data.profileImageUrl }
    setSessionExpired(false)
    setUser(nextUser)
    return nextUser
  }, [])

  const signOut = useCallback(async () => {
    let requestError
    try { await authApi.logout() } catch (error) { requestError = error }
    finally { authStorage.clear(); setUser(null) }
    if (requestError) throw requestError
  }, [])

  // stable callback으로 profile 수정이 조회 effect를 다시 실행시키지 않게 한다.
  const updateUser = useCallback((nextUser) => {
    setUser(nextUser)
  }, [])

  const clearAuth = useCallback(() => {
    authStorage.clear()
    setUser(null)
  }, [])

  const clearSessionExpired = useCallback(() => setSessionExpired(false), [])

  const value = useMemo(() => ({ user, hydrated, sessionExpired, signIn, signOut, updateUser, clearAuth, clearSessionExpired }), [clearAuth, clearSessionExpired, hydrated, sessionExpired, signIn, signOut, updateUser, user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
