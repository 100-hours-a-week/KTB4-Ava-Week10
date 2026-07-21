import { useCallback, useEffect, useReducer, useRef } from 'react'
import { MESSAGES } from '../../constants/messages'
import { validateImage } from '../../shared/lib/validation'
import * as api from './postEditorApi'

const initialState = {
  title: '', content: '', file: null, currentImageUrl: null, loading: true,
  loadError: null, draftStatus: 'clean', submitting: false,
}

const hydrationRequests = new Map()
const AUTOSAVE_IDLE_DELAY_MS = 2000
const AUTOSAVE_MAX_INTERVAL_MS = 30000

async function getOrCreateTemporaryPost() {
  const temporaryPost = await api.getTemporaryPost()
  if (temporaryPost) return temporaryPost
  const createdPost = await api.createTemporaryPost({ title: '', content: '' })
  if (!(createdPost?.id ?? createdPost?.temporaryPostId)) {
    throw new Error('임시저장 식별자를 받지 못했습니다.')
  }
  return createdPost
}

// StrictMode의 effect 재실행은 같은 요청을 공유하되, 두 번째 setup도 결과를 구독한다.
function getHydrationRequest(mode, postId) {
  const routeKey = `${mode}:${postId || ''}`
  if (!hydrationRequests.has(routeKey)) {
    // 작성 route는 조회 결과가 없으면 즉시 빈 임시 글을 생성해 ID부터 확보한다.
    const request = (mode === 'edit' ? api.getPostForEdit(postId) : getOrCreateTemporaryPost())
      .finally(() => hydrationRequests.delete(routeKey))
    hydrationRequests.set(routeKey, request)
  }
  return hydrationRequests.get(routeKey)
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET': return { ...initialState }
    case 'HYDRATE': return { ...state, ...action.payload, loading: false, loadError: null, draftStatus: 'clean' }
    case 'LOAD_ERROR': return { ...state, loading: false, loadError: action.error }
    case 'CHANGE': return { ...state, [action.name]: action.value, draftStatus: 'dirty' }
    case 'DRAFT_STATUS': return { ...state, draftStatus: action.status }
    case 'SUBMITTING': return { ...state, submitting: action.value }
    default: return state
  }
}

export function usePostEditor({ mode, postId, showToast }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const temporaryIdRef = useRef(null)
  const inFlightSaveRef = useRef(null)
  const lastSavedFileRef = useRef(null)
  const initialSnapshotRef = useRef(null)
  const routeKeyRef = useRef(null)
  const latestStateRef = useRef(initialState)
  const editVersionRef = useRef(0)
  const saveQueuedRef = useRef(false)

  useEffect(() => {
    const routeKey = `${mode}:${postId || ''}`
    if (routeKeyRef.current !== routeKey) {
      routeKeyRef.current = routeKey
      dispatch({ type: 'RESET' })
      temporaryIdRef.current = null
      lastSavedFileRef.current = null
      initialSnapshotRef.current = null
      latestStateRef.current = initialState
      editVersionRef.current = 0
      saveQueuedRef.current = false
    }
    let active = true
    const hydrate = async () => {
      try {
        const data = await getHydrationRequest(mode, postId)
        if (!active || routeKeyRef.current !== routeKey) return
        const values = data ? {
          title: data.title || '',
          content: data.content || '',
          currentImageUrl: data.postImageUrl || data.imageUrl || null,
        } : { title: '', content: '', currentImageUrl: null }
        if (mode === 'create') temporaryIdRef.current = data?.id ?? data?.temporaryPostId ?? null
        initialSnapshotRef.current = values
        dispatch({ type: 'HYDRATE', payload: values })
      } catch (error) {
        if (active && routeKeyRef.current === routeKey) dispatch({ type: 'LOAD_ERROR', error })
      }
    }
    hydrate()
    return () => { active = false }
  }, [mode, postId])

  useEffect(() => {
    latestStateRef.current = state
  }, [state])

  const update = useCallback((name, value) => {
    editVersionRef.current += 1
    if (inFlightSaveRef.current) saveQueuedRef.current = true
    latestStateRef.current = { ...latestStateRef.current, [name]: value, draftStatus: 'dirty' }
    dispatch({ type: 'CHANGE', name, value })
  }, [])

  const saveDraft = useCallback(async function performDraftSave() {
    const currentState = latestStateRef.current
    if (mode !== 'create' || currentState.draftStatus !== 'dirty' || currentState.submitting) return temporaryIdRef.current
    if (inFlightSaveRef.current) {
      saveQueuedRef.current = true
      return inFlightSaveRef.current
    }
    const savedVersion = editVersionRef.current
    const snapshot = { title: currentState.title, content: currentState.content, file: currentState.file === lastSavedFileRef.current ? null : currentState.file }
    latestStateRef.current = { ...currentState, draftStatus: 'saving' }
    dispatch({ type: 'DRAFT_STATUS', status: 'saving' })
    const request = (temporaryIdRef.current
      ? api.updateTemporaryPost(temporaryIdRef.current, snapshot)
      : api.createTemporaryPost(snapshot))
      .then((data) => {
        const id = data?.id ?? data?.temporaryPostId
        if (!id) throw new Error('임시저장 식별자를 받지 못했습니다.')
        temporaryIdRef.current = id
        if (snapshot.file) lastSavedFileRef.current = snapshot.file
        const hasNewerChanges = editVersionRef.current !== savedVersion
        const nextStatus = hasNewerChanges ? 'dirty' : 'saved'
        latestStateRef.current = { ...latestStateRef.current, draftStatus: nextStatus }
        if (hasNewerChanges) saveQueuedRef.current = true
        dispatch({ type: 'DRAFT_STATUS', status: nextStatus })
        return id
      })
      .catch((error) => {
        const nextStatus = editVersionRef.current !== savedVersion ? 'dirty' : 'error'
        latestStateRef.current = { ...latestStateRef.current, draftStatus: nextStatus }
        dispatch({ type: 'DRAFT_STATUS', status: nextStatus })
        showToast({ type: 'error', message: error.message, duration: 8000, key: `autosave:${error.message}`, action: { label: '재시도', onClick: () => {
          latestStateRef.current = { ...latestStateRef.current, draftStatus: 'dirty' }
          dispatch({ type: 'DRAFT_STATUS', status: 'dirty' })
        } } })
        throw error
      })
      .finally(() => {
        inFlightSaveRef.current = null
        if (saveQueuedRef.current) {
          saveQueuedRef.current = false
          window.setTimeout(() => { performDraftSave().catch(() => {}) }, 0)
        }
      })
    inFlightSaveRef.current = request
    return request
  }, [mode, showToast])

  useEffect(() => {
    if (mode !== 'create' || state.draftStatus !== 'dirty' || state.submitting) return undefined
    const timer = window.setTimeout(() => { saveDraft().catch(() => {}) }, AUTOSAVE_IDLE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [mode, saveDraft, state.content, state.draftStatus, state.file, state.submitting, state.title])

  useEffect(() => {
    if (mode !== 'create' || state.loading) return undefined
    const interval = window.setInterval(() => { saveDraft().catch(() => {}) }, AUTOSAVE_MAX_INTERVAL_MS)
    return () => window.clearInterval(interval)
  }, [mode, saveDraft, state.loading])

  const validation = {
    title: !state.title.trim() || !state.content.trim() ? MESSAGES.POST_REQUIRED : state.title.length > 26 ? '제목은 최대 26자까지 작성 가능합니다.' : '',
    file: validateImage(state.file),
  }

  const submit = useCallback(async () => {
    if (validation.title || validation.file) return null
    // 최종 snapshot을 먼저 확정하고 입력을 잠근 뒤 진행 중 autosave의 ID만 이어받는다.
    const snapshot = { title: state.title.trim(), content: state.content.trim(), file: state.file }
    dispatch({ type: 'SUBMITTING', value: true })
    try {
      if (inFlightSaveRef.current) await inFlightSaveRef.current
      if (mode === 'create') {
        return await api.createPost({ ...snapshot, temporaryPostId: temporaryIdRef.current })
      }
      const initial = initialSnapshotRef.current || {}
      const changes = {
        title: snapshot.title !== initial.title ? snapshot.title : null,
        content: snapshot.content !== initial.content ? snapshot.content : null,
        file: snapshot.file || null,
      }
      if (!changes.title && !changes.content && !changes.file) throw new Error('변경된 내용이 없습니다.')
      return await api.updatePost(postId, changes)
    } finally {
      dispatch({ type: 'SUBMITTING', value: false })
    }
  }, [mode, postId, state.content, state.file, state.title, validation.file, validation.title])

  return { state, update, validation, saveDraft, submit }
}
