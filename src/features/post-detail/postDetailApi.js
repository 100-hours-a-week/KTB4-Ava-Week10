import { commentPath, postCommentsPath, postLikePath, postPath, postReportPath } from '../../constants/api'
import { apiRequest } from '../../shared/api/client'

export const getPost = (postId) => apiRequest(postPath(postId))
export const deletePost = (postId) => apiRequest(postPath(postId), { method: 'DELETE' })
export const togglePostLike = (postId) => apiRequest(postLikePath(postId), { method: 'POST' })
export const reportPost = (postId, reason) => apiRequest(postReportPath(postId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) })
export const getComments = (postId) => apiRequest(postCommentsPath(postId))
export const createComment = (postId, content, parentId = null) => apiRequest(postCommentsPath(postId), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content, parentId }) })
export const updateComment = (postId, commentId, content) => apiRequest(commentPath(postId, commentId), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) })
export const deleteComment = (postId, commentId) => apiRequest(commentPath(postId, commentId), { method: 'DELETE' })
