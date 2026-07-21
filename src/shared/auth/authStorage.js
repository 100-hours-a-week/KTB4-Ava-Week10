import { STORAGE_KEYS } from '../../constants/storage'

// 서버의 token 객체 형태를 보존해 저장하고, header 생성 시에만 JWT를 꺼낸다.
export const authStorage = {
  getToken() {
    const value = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    if (!value) return null
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed.accessToken === 'string' ? parsed : null
    } catch {
      return null
    }
  },
  setToken(token) {
    if (!token || typeof token.accessToken !== 'string') throw new Error('유효하지 않은 토큰 응답입니다.')
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, JSON.stringify(token))
  },
  getAccessToken() {
    return this.getToken()?.accessToken ?? null
  },
  clear() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  },
}
