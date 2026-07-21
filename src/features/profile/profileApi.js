import { API_PATHS } from '../../constants/api'
import { apiRequest } from '../../shared/api/client'
import { createFormData } from '../../shared/lib/formData'

export const getProfile = () => apiRequest(API_PATHS.USER)
export const updateProfile = (fields) => apiRequest(API_PATHS.USER, { method: 'PATCH', body: createFormData(fields) })
export const updatePassword = (oldPassword, newPassword) => apiRequest(API_PATHS.PASSWORD, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword, newPassword }) })
export const withdraw = () => apiRequest(API_PATHS.USER, { method: 'DELETE' })
