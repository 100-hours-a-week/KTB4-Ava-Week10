import { useCallback, useEffect, useRef, useState } from 'react'
import { getPosts } from './postsApi'

function dedupePosts(posts) {
  return [...new Map((posts || []).map((post) => [String(post.id), post])).values()]
}

export function usePostList() {
  const [posts, setPosts] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialError, setInitialError] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(null)
  const [pagination, setPagination] = useState({ nextCursorId: null, hasNext: false })
  const initialStarted = useRef(false)
  const inFlightCursor = useRef(null)
  const completedCursors = useRef(new Set())

  const loadInitial = useCallback(async () => {
    setInitialLoading(true)
    setInitialError(null)
    try {
      const data = await getPosts()
      setPosts(dedupePosts(data?.posts))
      setPagination(data?.pagination || { nextCursorId: null, hasNext: false })
      completedCursors.current.clear()
    } catch (error) {
      setInitialError(error)
    } finally {
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialStarted.current) return
    initialStarted.current = true
    loadInitial()
  }, [loadInitial])

  const loadMore = useCallback(async () => {
    const cursor = pagination.nextCursorId
    // null, 동일 cursor, in-flight cursor는 observer가 반복 호출해도 요청하지 않는다.
    if (!pagination.hasNext || cursor == null || inFlightCursor.current === cursor || completedCursors.current.has(cursor)) return
    inFlightCursor.current = cursor
    setLoadingMore(true)
    setLoadMoreError(null)
    try {
      const data = await getPosts(cursor)
      setPosts((current) => dedupePosts([...current, ...(data?.posts || [])]))
      completedCursors.current.add(cursor)
      const next = data?.pagination || { nextCursorId: null, hasNext: false }
      setPagination(next.nextCursorId === cursor ? { nextCursorId: null, hasNext: false } : next)
    } catch (error) {
      setLoadMoreError(error)
    } finally {
      inFlightCursor.current = null
      setLoadingMore(false)
    }
  }, [pagination])

  return { posts, initialLoading, initialError, loadingMore, loadMoreError, loadInitial, loadMore }
}
