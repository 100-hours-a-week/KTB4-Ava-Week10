import { API_PATHS } from '../../constants/api'
import { apiRequest } from '../../shared/api/client'

export function getPosts(cursorId) {
  const query = cursorId == null ? '' : `?${new URLSearchParams({ cursorId })}`
  return apiRequest(`${API_PATHS.POSTS}${query}`)
}
