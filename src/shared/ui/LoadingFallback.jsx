export function LoadingFallback({ label = '불러오는 중' }) {
  return <div className="loading-fallback" role="status"><span />{label}</div>
}
