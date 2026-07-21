import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ROUTES, postDetailPath } from '../constants/routes'
import { PostImageField } from '../features/post-editor/PostImageField'
import { usePostEditor } from '../features/post-editor/usePostEditor'
import { useFeedback } from '../shared/feedback/FeedbackProvider'
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

  useEffect(() => {
    if (!state.loadError || shownLoadError.current === state.loadError) return
    shownLoadError.current = state.loadError
    showErrorDialog({ title: mode === 'edit' ? '게시글을 불러오지 못했습니다' : '임시 글을 불러오지 못했습니다', message: state.loadError.message, confirmLabel: '목록으로', onRetry: () => navigate(ROUTES.POSTS), onCancel: () => navigate(ROUTES.POSTS) })
  }, [mode, navigate, showErrorDialog, state.loadError])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (validation.title || validation.file) return
    try {
      const post = await submit()
      if (post) navigate(postDetailPath(post.id || postId), { replace: true })
    } catch (error) {
      showToast({ type: 'error', message: error.message, key: `editor-submit:${error.status || error.message}` })
    }
  }

  if (state.loading) return <div className="page-shell"><Header backTo={mode === 'edit' ? postDetailPath(postId) : ROUTES.POSTS} /><LoadingFallback label="편집기를 준비하는 중" /></div>

  return (
    <div className="page-shell post-editor-page-root">
      <Header backTo={mode === 'edit' ? postDetailPath(postId) : ROUTES.POSTS} />
      <main className={`page-content editor-page editor-page--${mode}`}>
        <form className={`post-editor post-editor--${mode}`} noValidate onSubmit={handleSubmit}>
          <span className={`post-mode-badge post-mode-badge--${mode}`}>{mode === 'edit' ? '게시글 수정' : '새 글 작성'}</span>
          <div className="editor-title-row"><label className="visually-hidden" htmlFor="editor-title">제목</label><input id="editor-title" className={`${mode}-title-input`} maxLength="26" placeholder="제목을 입력해주세요. (최대 26글자)" value={state.title} disabled={state.submitting} onChange={(event) => update('title', event.target.value)} /><button className="post-save-btn" type="submit" disabled={state.submitting || !state.title.trim() || !state.content.trim()}>{state.submitting ? '저장 중' : mode === 'edit' ? '저장' : '등록'}</button></div>
          <hr className="editor-divider" />
          <div className="editor-body-field"><label className="visually-hidden" htmlFor="editor-content">내용</label><textarea id="editor-content" className={`${mode}-content-input`} placeholder="내용을 입력해주세요." value={state.content} disabled={state.submitting} onChange={(event) => update('content', event.target.value)} /><span className="field-error">{validation.title}</span></div>
          <PostImageField mode={mode} file={state.file} currentImageUrl={state.currentImageUrl} disabled={state.submitting} onChange={(file) => update('file', file)} />
          <span className="field-error editor-file-error">{validation.file}</span>
          {mode === 'create' && <p className={`draft-status draft-status--${state.draftStatus}`} aria-live="polite">{{ clean: '입력 후 잠시 뒤 자동 저장됩니다.', dirty: '저장되지 않은 변경사항', saving: '임시 저장 중…', saved: '임시 저장 완료', error: '임시 저장 실패' }[state.draftStatus]}</p>}
        </form>
      </main>
    </div>
  )
}
