import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES, postDetailPath } from '../constants/routes'
import { DEFAULT_PROFILE_IMAGE } from '../constants/assets'
import { usePostList } from '../features/posts/usePostList'
import { useFeedback } from '../shared/feedback/FeedbackProvider'
import { formatCount, formatDate } from '../shared/lib/format'
import { Header } from '../shared/ui/Header'
import { LoadingFallback } from '../shared/ui/LoadingFallback'
import './posts-page.css'

export default function PostsPage() {
  const { posts, initialLoading, initialError, loadingMore, loadMoreError, loadInitial, loadMore } = usePostList()
  const { showToast, showErrorDialog } = useFeedback()
  const sentinelRef = useRef(null)
  const lastInitialError = useRef(null)
  const lastMoreError = useRef(null)

  useEffect(() => {
    if (!initialError || lastInitialError.current === initialError) return
    lastInitialError.current = initialError
    showErrorDialog({ title: '게시글을 불러오지 못했습니다', message: initialError.message, onRetry: loadInitial })
  }, [initialError, loadInitial, showErrorDialog])

  useEffect(() => {
    if (!loadMoreError || lastMoreError.current === loadMoreError) return
    lastMoreError.current = loadMoreError
    showToast({ type: 'error', message: loadMoreError.message, key: `posts-more:${loadMoreError.message}`, action: { label: '재시도', onClick: loadMore } })
  }, [loadMore, loadMoreError, showToast])

  // loadMore는 pagination이 바뀔 때마다 새로 생성되므로, ref로 최신 값만 참조해
  // 매 페이지 로드마다 observer를 disconnect·재생성하지 않게 한다.
  const loadMoreRef = useRef(loadMore)
  useEffect(() => { loadMoreRef.current = loadMore }, [loadMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return undefined
    const observer = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) loadMoreRef.current() }, { rootMargin: '240px' })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="page-shell posts-page-root">
      <Header />
      <main className="page-content posts-page">
        <section className="posts-action-row" aria-label="게시글 작성"><Link className="content-write-btn" to={ROUTES.POST_NEW}>게시글 작성</Link></section>
        {initialLoading ? <LoadingFallback label="게시글을 불러오는 중" /> : (
          <section className="posts-list" aria-label="게시글 목록">
            {posts.length === 0 && !initialError && <p className="empty-state">아직 작성된 게시글이 없습니다.</p>}
            {posts.map((post) => (
              <Link className="post-card" to={postDetailPath(post.id)} key={post.id}>
                <div className="post-title-row"><h2 className="post-list-title">{post.title}</h2>{Number(post.commentCount) > 0 && <span className="comment-count-badge">[{formatCount(post.commentCount)}]</span>}</div>
                <div className="post-list-meta">
                  <span className="post-author-inline"><span className="avatar-dot"><img src={post.userImageUrl || DEFAULT_PROFILE_IMAGE} alt="" /></span><strong>{post.nickname}</strong></span>
                  <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                  <span>조회 {formatCount(post.viewCount)}</span><span>좋아요 {formatCount(post.likeCount)}</span>
                </div>
              </Link>
            ))}
          </section>
        )}
        {loadMoreError && <div className="retry-row"><button className="small-outline-btn" type="button" onClick={loadMore}>더 불러오기 재시도</button></div>}
        <div ref={sentinelRef} className="load-more-sentinel" aria-hidden="true" />
        {loadingMore && <LoadingFallback label="더 불러오는 중" />}
      </main>
    </div>
  )
}
