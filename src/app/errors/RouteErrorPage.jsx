import { Link, useRouteError } from 'react-router-dom'

import { ROUTES } from '../../constants/routes'

export default function RouteErrorPage() {
  const error = useRouteError()
  return (
    <main className="route-error-page">
      <p className="eyebrow">오류가 발생했어요</p>
      <h1>이 화면을 열지 못했습니다.</h1>
      <p>{error?.status === 404 ? '요청한 페이지를 찾을 수 없습니다.' : '잠시 후 다시 시도해주세요.'}</p>
      <Link className="submit-btn" to={ROUTES.POSTS}>
        게시글 목록으로
      </Link>
    </main>
  )
}
