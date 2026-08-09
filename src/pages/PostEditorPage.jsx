import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { postDetailPath, ROUTES } from '../constants/routes'
import { PostImageField } from '../features/post-editor/PostImageField'
import { usePostEditor } from '../features/post-editor/usePostEditor'
import { useFeedback } from '../shared/feedback/FeedbackContext'
import { Header } from '../shared/ui/Header'
import { LoadingFallback } from '../shared/ui/LoadingFallback'

import './post-editor-page.css'

export default function PostEditorPage() {
  const { postId } = useParams()
  const mode = postId ? 'edit' : 'create'
  const navigate = useNavigate()
  const { showToast, showErrorDialog } = useFeedback()
  const { state, update, validation, submit } = usePostEditor({ mode, postId, showToast })
  const shownLoadError = useRef(null)
  const backTo = mode === 'edit' ? postDetailPath(postId) : ROUTES.POSTS

  useEffect(() => {
    if (!state.loadError || shownLoadError.current === state.loadError) return
    shownLoadError.current = state.loadError
    showErrorDialog({
      title: mode === 'edit' ? '게시글을 불러오지 못했습니다' : '임시 글을 불러오지 못했습니다',
      message: state.loadError.message,
      confirmLabel: '목록으로',
      onRetry: () => navigate(ROUTES.POSTS),
      onCancel: () => navigate(ROUTES.POSTS),
    })
  }, [mode, navigate, showErrorDialog, state.loadError])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (validation.title || validation.file || validation.capacity || validation.deadline) return
    try {
      const post = await submit()
      if (post) navigate(postDetailPath(post.id || postId), { replace: true })
    } catch (error) {
      showToast({ type: 'error', message: error.message, key: `editor-submit:${error.status || error.message}` })
    }
  }

  if (state.loading)
    return (
      <div className="page-shell">
        <Header backTo={backTo} />
        <LoadingFallback label="편집기를 준비하는 중" />
      </div>
    )

  return (
    <div className="page-shell post-editor-page-root">
      <Header backTo={backTo} />
      <main className={`page-content editor-page editor-page--${mode}`}>
        <form className={`post-editor post-editor--${mode}`} noValidate onSubmit={handleSubmit}>
          <span className={`post-mode-badge post-mode-badge--${mode}`}>
            {mode === 'edit' ? '게시글 수정' : '새 글 작성'}
          </span>
          <div className="editor-title-row">
            <label className="visually-hidden" htmlFor="editor-title">
              제목
            </label>
            <input
              id="editor-title"
              className={`${mode}-title-input`}
              maxLength="26"
              placeholder="제목을 입력해주세요. (최대 26글자)"
              value={state.title}
              disabled={state.submitting}
              onChange={(event) => update('title', event.target.value)}
            />
            <button
              className="post-save-btn"
              type="submit"
              disabled={
                state.submitting ||
                !state.title.trim() ||
                !state.content.trim() ||
                Boolean(validation.capacity) ||
                Boolean(validation.deadline)
              }
            >
              {state.submitting ? '저장 중' : mode === 'edit' ? '저장' : '등록'}
            </button>
          </div>
          <hr className="editor-divider" />
          {mode === 'create' ? (
            <fieldset className="post-type-field">
              <legend>게시글 유형</legend>
              <div className="post-type-options">
                <label className="post-type-option">
                  <input
                    type="radio"
                    name="post-type"
                    value="GENERAL"
                    checked={state.type === 'GENERAL'}
                    disabled={state.submitting}
                    onChange={() => update('type', 'GENERAL')}
                  />
                  <span>
                    <strong>일반 게시글</strong>
                    <small>자유롭게 이야기를 나누는 글</small>
                  </span>
                </label>
                <label className="post-type-option">
                  <input
                    type="radio"
                    name="post-type"
                    value="MEETING"
                    checked={state.type === 'MEETING'}
                    disabled={state.submitting}
                    onChange={() => update('type', 'MEETING')}
                  />
                  <span>
                    <strong>모임 게시글</strong>
                    <small>댓글 선착순으로 참여하는 글</small>
                  </span>
                </label>
              </div>
            </fieldset>
          ) : (
            <div className="post-type-readonly">
              <span>게시글 유형</span>
              <strong>{state.type === 'MEETING' ? '모임 게시글' : '일반 게시글'}</strong>
              <small>게시글 유형은 등록 후 변경할 수 없습니다.</small>
            </div>
          )}
          {mode === 'create' && state.type === 'MEETING' && (
            <fieldset className="meeting-settings-field">
              <legend>
                모임 설정 <span className="meeting-settings-required">필수</span>
              </legend>
              <div className="meeting-settings-grid">
                <label>
                  <span>
                    모집 인원 <span className="required">*</span>
                  </span>
                  <div className="capacity-input-wrap">
                    <input
                      type="number"
                      min="2"
                      step="1"
                      inputMode="numeric"
                      value={state.capacity ?? ''}
                      required
                      disabled={state.submitting}
                      onChange={(event) => update('capacity', event.target.value)}
                    />
                    <span>명</span>
                  </div>
                  <span className="field-error">{validation.capacity}</span>
                </label>
                <label>
                  <span>
                    모집 마감일 <span className="required">*</span>
                  </span>
                  <input
                    type="datetime-local"
                    value={state.deadline ?? ''}
                    required
                    disabled={state.submitting}
                    onChange={(event) => update('deadline', event.target.value)}
                  />
                  <span className="field-error">{validation.deadline}</span>
                </label>
              </div>
            </fieldset>
          )}
          <div className="editor-body-field">
            <label className="visually-hidden" htmlFor="editor-content">
              내용
            </label>
            <textarea
              id="editor-content"
              className={`${mode}-content-input`}
              placeholder="내용을 입력해주세요."
              value={state.content}
              disabled={state.submitting}
              onChange={(event) => update('content', event.target.value)}
            />
            <span className="field-error">{validation.title}</span>
          </div>
          <PostImageField
            mode={mode}
            file={state.file}
            currentImageUrl={state.currentImageUrl}
            disabled={state.submitting}
            onChange={(file) => update('file', file)}
          />
          <span className="field-error editor-file-error">{validation.file}</span>
          {mode === 'create' && (
            <p className={`draft-status draft-status--${state.draftStatus}`} aria-live="polite">
              {
                {
                  clean: '입력 후 잠시 뒤 자동 저장됩니다.',
                  dirty: '저장되지 않은 변경사항',
                  saving: '임시 저장 중…',
                  saved: '임시 저장 완료',
                  error: '임시 저장 실패',
                }[state.draftStatus]
              }
            </p>
          )}
        </form>
      </main>
    </div>
  )
}
