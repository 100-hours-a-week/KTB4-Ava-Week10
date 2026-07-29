import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { ROUTES } from '../../constants/routes'
import { LoadingFallback } from '../../shared/ui/LoadingFallback'
import RouteErrorPage from '../errors/RouteErrorPage'
import { ProtectedLayout, PublicOnlyLayout, RootRedirect } from '../layouts/RouteLayouts'

const LoginPage = lazy(() => import('../../pages/LoginPage'))
const RegisterPage = lazy(() => import('../../pages/RegisterPage'))
const PostsPage = lazy(() => import('../../pages/PostsPage'))
const PostDetailPage = lazy(() => import('../../pages/PostDetailPage'))
const PostEditorPage = lazy(() => import('../../pages/PostEditorPage'))
const ProfilePage = lazy(() => import('../../pages/ProfilePage'))
const PasswordPage = lazy(() => import('../../pages/PasswordPage'))

const lazyElement = (Component) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  { path: ROUTES.ROOT, element: <RootRedirect />, errorElement: <RouteErrorPage /> },
  {
    element: <PublicOnlyLayout />,
    children: [
      { path: ROUTES.LOGIN, element: lazyElement(LoginPage) },
      { path: ROUTES.REGISTER, element: lazyElement(RegisterPage) },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: ROUTES.POSTS, element: lazyElement(PostsPage) },
      { path: ROUTES.POST_NEW, element: lazyElement(PostEditorPage) },
      { path: ROUTES.POST_DETAIL, element: lazyElement(PostDetailPage) },
      { path: ROUTES.POST_EDIT, element: lazyElement(PostEditorPage) },
      { path: ROUTES.PROFILE, element: lazyElement(ProfilePage) },
      { path: ROUTES.PASSWORD, element: lazyElement(PasswordPage) },
    ],
  },
  { path: '*', element: <RouteErrorPage /> },
])
