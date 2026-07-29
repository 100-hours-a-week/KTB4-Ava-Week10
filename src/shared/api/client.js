import { API_PATHS } from '../../constants/api'
import { API_MESSAGE_MAP, MESSAGES } from '../../constants/messages'
import { AUTH_EXPIRED_EVENT } from '../../constants/storage'
import { authStorage } from '../auth/authStorage'

import { ApiError } from './ApiError'

let refreshPromise = null

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '/api'

const authErrorCodes = new Set(['unauthorized', 'invalid_or_expired_token', 'token_expired', 'not_access_token'])

// 비정형 서버 오류와 원시 예외를 사용자에게 노출하지 않는 문구로 정규화한다.
function normalizeErrorMessage(status, code) {
  const normalizedCode = String(code || '').toLowerCase()
  if (API_MESSAGE_MAP[normalizedCode]) return API_MESSAGE_MAP[normalizedCode]
  if (status === 401 || authErrorCodes.has(normalizedCode)) return MESSAGES.SESSION_EXPIRED
  if (status >= 500) return MESSAGES.GENERIC_ERROR
  if ([400, 403, 404, 409, 422].includes(status)) return API_MESSAGE_MAP[normalizedCode] || MESSAGES.GENERIC_ERROR
  return MESSAGES.GENERIC_ERROR
}

// 204와 비정형 응답을 모두 안전하게 처리한다.
async function parseResponse(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function rawRequest(path, options = {}) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), options.timeout ?? 12000)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: 'include',
      ...options,
      signal: controller.signal,
    })
    const payload = await parseResponse(response)
    return { response, payload }
  } catch (error) {
    if (error.name === 'AbortError') throw new ApiError(MESSAGES.TIMEOUT_ERROR, { cause: error })
    throw new ApiError(MESSAGES.NETWORK_ERROR, { cause: error })
  } finally {
    window.clearTimeout(timeout)
  }
}

// 여러 보호 요청이 동시에 401이어도 refresh cookie는 한 번만 회전시킨다.
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = rawRequest(API_PATHS.REFRESH, { method: 'POST' })
      .then(({ response, payload }) => {
        const token = payload?.data
        if (!response.ok || !token?.accessToken)
          throw new ApiError(MESSAGES.SESSION_EXPIRED, { status: response.status })
        authStorage.setToken(token)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// 공통 envelope에서 화면이 필요한 data만 반환한다.
export async function apiRequest(path, { auth = true, retry = true, headers, ...options } = {}) {
  const accessToken = auth ? authStorage.getAccessToken() : null
  const requestHeaders = { ...headers }
  if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`

  const { response, payload } = await rawRequest(path, { ...options, headers: requestHeaders })

  if (response.status === 401 && auth && retry) {
    try {
      await refreshAccessToken()
      return apiRequest(path, { auth, retry: false, headers, ...options })
    } catch (error) {
      authStorage.clear()
      window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
      throw error
    }
  }

  if (!response.ok) {
    const code = payload?.message || payload?.code || ''
    throw new ApiError(normalizeErrorMessage(response.status, code), {
      status: response.status,
      code: String(code).toLowerCase(),
      data: payload?.data,
    })
  }

  return payload?.data ?? null
}
