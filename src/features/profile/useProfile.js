import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './profileApi'

export function useProfile(updateAuthUser) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const started = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try { setProfile(await api.getProfile()) }
    catch (loadError) { setError(loadError) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    // auth user 갱신과 무관하게 route 진입 때 한 번만 hydrate한다.
    if (started.current) return
    started.current = true
    load()
  }, [load])

  const save = useCallback(async (fields) => {
    const nextProfile = await api.updateProfile(fields)
    setProfile(nextProfile)
    updateAuthUser(nextProfile)
    return nextProfile
  }, [updateAuthUser])

  return { profile, loading, error, load, save }
}
