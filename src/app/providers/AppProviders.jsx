import { AuthProvider } from './AuthProvider'
import { FeedbackProvider } from '../../shared/feedback/FeedbackProvider'

export function AppProviders({ children }) {
  return <FeedbackProvider><AuthProvider>{children}</AuthProvider></FeedbackProvider>
}
