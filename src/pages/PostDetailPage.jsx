import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '../app/providers/AuthContext'
import { DEFAULT_PROFILE_IMAGE } from '../constants/assets'
import { REPORT_REASONS } from '../constants/reportReasons'
import { postEditPath, ROUTES } from '../constants/routes'
import { CommentTree } from '../features/comments/CommentTree'
import * as api from '../features/post-detail/postDetailApi'
import { useComments, usePostDetail } from '../features/post-detail/usePostDetail'
import { useFeedback } from '../shared/feedback/FeedbackContext'
import { formatCount, formatDate } from '../shared/lib/format'
import { ConfirmDialog } from '../shared/ui/ConfirmDialog'
import { Header } from '../shared/ui/Header'
import { LoadingFallback } from '../shared/ui/LoadingFallback'

import './post-detail-page.css'

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast, showErrorDialog } = useFeedback()
  const { post, loading, error, load, changeCommentCount, setLikeStatus } = usePostDetail(postId)
  const commentsState = useComments(postId)
  const { load: reloadComments } = commentsState
  const [mainComment, setMainComment] = useState('')
  const [composer, setComposer] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].value)
  const [busy, setBusy] = useState(false)
  const shownPostError = useRef(null)
  const shownCommentsError = useRef(null)
  const ownPost = post?.userId === user?.id
  const liked = Boolean(post?.isLiked)

  useEffect(() => {
    if (!error || shownPostError.current === error) return
    shownPostError.current = error
    showErrorDialog({
      title: '게시글을 불러오지 못했습니다',
      message: error.message,
      onRetry: load,
      onCancel: () => navigate(ROUTES.POSTS),
    })
  }, [error, load, navigate, showErrorDialog])

  useEffect(() => {
    if (!commentsState.error || shownCommentsError.current === commentsState.error) return
    shownCommentsError.current = commentsState.error
    showToast({
      type: 'error',
      message: commentsState.error.message,
      key: `comments:${postId}:${commentsState.error.message}`,
    })
  }, [commentsState.error, postId, showToast])

  // CommentTree에 전달되는 콜백이라 useCallback으로 감싸 composer가 null인 동안
  // 무관한 state 변경(입력창, 좋아요, dialog 등)에서 CommentTree memo가 깨지지 않게 한다.
  const runMutation = useCallback(
    async (action, successMessage) => {
      setBusy(true)
      try {
        const result = await action()
        if (successMessage)
          showToast({
            type: 'success',
            message: successMessage,
            key: `${successMessage}:${Date.now()}`,
          })
        return result
      } catch (mutationError) {
        showToast({
          type: 'error',
          message: mutationError.message,
          key: `post-action:${mutationError.status}:${mutationError.message}`,
        })
        return undefined
      } finally {
        setBusy(false)
      }
    },
    [showToast],
  )

  const handleLike = async () => {
    const previous = {
      isLiked: liked,
      likeCount: Number(post?.likeCount || 0),
    }
    const nextLiked = !previous.isLiked
    setLikeStatus({
      isLiked: nextLiked,
      likeCount: Math.max(0, previous.likeCount + (nextLiked ? 1 : -1)),
    })

    const result = await runMutation(() => api.togglePostLike(postId))

    if (!result) {
      setLikeStatus(previous)
      return
    }

    setLikeStatus({
      likeCount: result.likeCount,
      isLiked: typeof result.isLiked === 'boolean' ? result.isLiked : nextLiked,
    })
  }

  const handleDeletePost = async () => {
    const result = await runMutation(() => api.deletePost(postId))
    if (result !== undefined) navigate(ROUTES.POSTS, { replace: true })
  }

  const submitMainComment = async () => {
    if (!mainComment.trim()) return
    const result = await runMutation(() => api.createComment(postId, mainComment.trim()))
    if (result) {
      setMainComment('')
      changeCommentCount(1)
      await commentsState.load()
    }
  }

  // UI anchor와 API parent를 별도 필드로 보관해 재귀 답글 위치가 섞이지 않게 한다.
  const openReply = useCallback((comment, depth = 0) => {
    if (depth > 0) return
    setComposer({
      type: 'reply',
      anchorId: comment.id,
      parentId: comment.id,
      commentId: null,
      content: '',
    })
  }, [])
  const openEdit = useCallback(
    (comment) =>
      setComposer({
        type: 'edit',
        anchorId: comment.id,
        parentId: null,
        commentId: comment.id,
        content: comment.content,
      }),
    [],
  )
  const openDeleteCommentDialog = useCallback((comment) => setDialog({ type: 'comment-delete', comment }), [])
  const updateComposerContent = useCallback((content) => setComposer((value) => ({ ...value, content })), [])
  const cancelComposer = useCallback(() => setComposer(null), [])

  const submitComposer = useCallback(async () => {
    const result =
      composer.type === 'edit'
        ? await runMutation(() => api.updateComment(postId, composer.commentId, composer.content.trim()))
        : await runMutation(() => api.createComment(postId, composer.content.trim(), composer.parentId))
    if (result) {
      if (composer.type === 'reply') changeCommentCount(1)
      setComposer(null)
      await reloadComments()
    }
  }, [changeCommentCount, composer, postId, reloadComments, runMutation])

  const confirmDeleteComment = async () => {
    const comment = dialog.comment
    setDialog(null)
    const result = await runMutation(() => api.deleteComment(postId, comment.id))
    if (result !== undefined) {
      await commentsState.load()
    }
  }

  const confirmReport = async () => {
    setDialog(null)
    const result = await runMutation(() => api.reportPost(postId, reportReason), '게시글 신고가 접수되었습니다.')
    if (result) setReportReason(REPORT_REASONS[0].value)
  }

  if (loading)
    return (
      <div className="page-shell">
        <Header backTo={ROUTES.POSTS} />
        <LoadingFallback label="게시글을 불러오는 중" />
      </div>
    )

  return (
    <div className="page-shell post-detail-page-root">
      <Header backTo={ROUTES.POSTS} />
      {post && (
        <main className="page-content detail-page">
          <article className="post-detail">
            <header className="detail-header">
              <div className="detail-title-row">
                <h2 className="post-detail-title">{post.title}</h2>
              </div>
              <div className="post-meta-row">
                <div className="author-row">
                  <span className="avatar-dot">
                    <img src={post.userImageUrl || DEFAULT_PROFILE_IMAGE} alt="" />
                  </span>
                  <div>
                    <strong className="author-nickname">{post.nickname}</strong>
                    <div className="post-sub-meta">
                      <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                      <span>
                        조회 <strong>{formatCount(post.viewCount)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="post-actions">
                  <span>
                    댓글 <strong>{formatCount(post.commentCount)}</strong>
                  </span>
                  {ownPost && (
                    <Link className="link-action-btn" to={postEditPath(postId)}>
                      수정
                    </Link>
                  )}
                  {ownPost && (
                    <button
                      className="link-action-btn"
                      type="button"
                      onClick={() => setDialog({ type: 'post-delete' })}
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
              <hr className="detail-divider" />
              {post.postImageUrl && (
                <div className="post-image">
                  <img src={post.postImageUrl} alt="게시글 첨부" />
                </div>
              )}
              <div className="post-body">
                <p>{post.content}</p>
                {post.isEdited && <small>수정됨</small>}
              </div>
              <div className="post-reaction-bar">
                <div className="reaction-left">
                  <button
                    className={`reaction-button like-button ${liked ? 'is-liked' : ''}`}
                    type="button"
                    aria-pressed={liked}
                    disabled={busy}
                    onClick={handleLike}
                  >
                    <span className="heart-icon" aria-hidden="true" />
                    <span>좋아요</span>
                    <strong>{formatCount(post.likeCount)}</strong>
                  </button>
                  <a className="reaction-button" href="#comments-list">
                    <span className="comment-icon" aria-hidden="true" />
                    <span>댓글</span>
                    <strong>{formatCount(post.commentCount)}</strong>
                  </a>
                </div>
                <button className="text-action-btn" type="button" onClick={() => setDialog({ type: 'report' })}>
                  신고
                </button>
              </div>
            </header>
          </article>
          <section className="comments-section" aria-label="댓글">
            <div id="comments-list">
              {commentsState.loading ? (
                <LoadingFallback label="댓글을 불러오는 중" />
              ) : commentsState.error ? (
                <div className="retry-row">
                  <button className="small-outline-btn" type="button" onClick={commentsState.load}>
                    댓글 다시 불러오기
                  </button>
                </div>
              ) : (
                <CommentTree
                  comments={commentsState.comments}
                  currentUserId={user.id}
                  composer={composer}
                  onOpenReply={openReply}
                  onOpenEdit={openEdit}
                  onDelete={openDeleteCommentDialog}
                  onComposerChange={updateComposerContent}
                  onComposerSubmit={submitComposer}
                  onComposerCancel={cancelComposer}
                  busy={busy}
                />
              )}
            </div>
            <div className="comment-input-group">
              <textarea
                className="comment-input"
                maxLength="500"
                value={mainComment}
                onChange={(event) => {
                  setMainComment(event.target.value)
                  if (composer) setComposer(null)
                }}
                placeholder="댓글을 남겨주세요!"
              />
              <button
                className="comment-submit-btn"
                type="button"
                disabled={!mainComment.trim() || busy}
                onClick={submitMainComment}
              >
                댓글 등록
              </button>
            </div>
          </section>
        </main>
      )}
      {dialog?.type === 'post-delete' && (
        <ConfirmDialog
          title="게시글을 삭제하시겠습니까?"
          description="삭제한 내용은 복구할 수 없습니다."
          danger
          confirmLabel="삭제"
          onConfirm={handleDeletePost}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'comment-delete' && (
        <ConfirmDialog
          title="댓글을 삭제하시겠습니까?"
          description="삭제한 내용은 복구할 수 없습니다."
          danger
          confirmLabel="삭제"
          onConfirm={confirmDeleteComment}
          onCancel={() => setDialog(null)}
        />
      )}
      {dialog?.type === 'report' && (
        <ConfirmDialog
          title="게시글을 신고하시겠습니까?"
          description="신고 사유를 선택해주세요."
          confirmLabel="신고"
          onConfirm={confirmReport}
          onCancel={() => setDialog(null)}
        >
          <fieldset className="report-reason-field">
            <legend className="visually-hidden">신고 사유</legend>
            {REPORT_REASONS.map((reason) => (
              <label className="report-reason-option" key={reason.value}>
                <input
                  type="radio"
                  name="report-reason"
                  value={reason.value}
                  checked={reportReason === reason.value}
                  onChange={() => setReportReason(reason.value)}
                />
                <span>{reason.label}</span>
              </label>
            ))}
          </fieldset>
        </ConfirmDialog>
      )}
    </div>
  )
}
