export const API_PATHS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  REGISTER: '/users/register',
  USER: '/users/me',
  PASSWORD: '/users/me/password',
  POSTS: '/posts',
  TEMPORARY_POSTS: '/temporary-posts',
}

export const postPath = (postId) => `/posts/${postId}`
export const postCommentsPath = (postId) => `/posts/${postId}/comments`
export const commentPath = (postId, commentId) => `/posts/${postId}/comments/${commentId}`
export const postLikePath = (postId) => `/posts/${postId}/like`
export const postReportPath = (postId) => `/posts/${postId}/report`
export const temporaryPostPath = (temporaryId) => `/temporary-posts/${temporaryId}`
