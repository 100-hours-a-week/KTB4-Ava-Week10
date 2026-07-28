import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './postDetailApi'

export function usePostDetail(postId) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestedId = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setPost(await api.getPost(postId)) }
    catch (loadError) { setError(loadError) }
    finally { setLoading(false) }
  }, [postId])

  useEffect(() => {
    // 상세 GET은 조회 수를 변경하므로 같은 postId를 StrictMode에서 중복 조회하지 않는다.
    if (requestedId.current === postId) return
    requestedId.current = postId
    load()
  }, [load, postId])

  const changeCommentCount = useCallback((amount) => setPost((current) => current ? { ...current, commentCount: Math.max(0, Number(current.commentCount || 0) + amount) } : current), [])
  const setLikeStatus = useCallback(({ likeCount, isLiked }) => setPost((current) => current ? {
    ...current,
    likeCount: likeCount ?? current.likeCount,
    isLiked: typeof isLiked === 'boolean' ? isLiked : current.isLiked,
  } : current), [])

  return { post, loading, error, load, changeCommentCount, setLikeStatus }
}

export function useComments(postId) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const requestedId = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setComments((await api.getComments(postId)) || []) }
    catch (loadError) { setError(loadError) }
    finally { setLoading(false) }
  }, [postId])

  useEffect(() => {
    if (requestedId.current === postId) return
    requestedId.current = postId
    load()
  }, [load, postId])

  return { comments, loading, error, load }
}
