import { API_PATHS, postPath, temporaryPostPath } from '../../constants/api'
import { apiRequest } from '../../shared/api/client'
import { createFormData } from '../../shared/lib/formData'

export const getTemporaryPost = () => apiRequest(API_PATHS.TEMPORARY_POSTS)
export const createTemporaryPost = (fields) => apiRequest(API_PATHS.TEMPORARY_POSTS, { method: 'POST', body: createFormData(fields) })
export const updateTemporaryPost = (temporaryId, fields) => apiRequest(temporaryPostPath(temporaryId), { method: 'PATCH', body: createFormData(fields) })
export const createPost = (fields) => apiRequest(API_PATHS.POSTS, { method: 'POST', body: createFormData(fields) })
export const updatePost = (postId, fields) => apiRequest(postPath(postId), { method: 'PATCH', body: createFormData(fields) })
export const getPostForEdit = (postId) => apiRequest(postPath(postId))
