export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  POSTS: '/posts',
  POST_NEW: '/posts/new',
  POST_DETAIL: '/posts/:postId',
  POST_EDIT: '/posts/:postId/edit',
  PROFILE: '/profile',
  PASSWORD: '/profile/password',
}

export const postDetailPath = (postId) => `/posts/${postId}`
export const postEditPath = (postId) => `/posts/${postId}/edit`
