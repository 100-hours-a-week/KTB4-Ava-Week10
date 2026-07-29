import { FeedbackProvider } from '../../shared/feedback/FeedbackProvider'

import { AuthProvider } from './AuthProvider'

export function AppProviders({ children }) {
  return (
    <FeedbackProvider>
      <AuthProvider>{children}</AuthProvider>
    </FeedbackProvider>
  )
}
