export function formatCount(value) {
  const count = Number(value) || 0
  if (count >= 1000) return `${Math.floor(count / 1000)}k`
  return String(count)
}

export function formatDate(value) {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 19)
}

export function getFileNameFromUrl(value) {
  if (!value) return ''
  try {
    return decodeURIComponent(new URL(value, window.location.origin).pathname.split('/').pop())
  } catch {
    return ''
  }
}
