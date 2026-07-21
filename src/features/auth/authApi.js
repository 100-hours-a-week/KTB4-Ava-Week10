import { API_PATHS } from '../../constants/api'
import { apiRequest } from '../../shared/api/client'
import { createFormData } from '../../shared/lib/formData'

export function login(credentials) {
  return apiRequest(API_PATHS.LOGIN, {
    auth: false,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
}

export function register({ email, password, nickname, file }) {
  return apiRequest(API_PATHS.REGISTER, {
    auth: false,
    method: 'POST',
    body: createFormData({ email, password, nickname, file }),
  })
}

export function getCurrentUser() {
  return apiRequest(API_PATHS.USER)
}

export function logout() {
  return apiRequest(API_PATHS.LOGOUT, { method: 'POST' })
}
