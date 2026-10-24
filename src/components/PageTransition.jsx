import { useLocation } from 'react-router-dom'
import PageErrorBoundary from './PageErrorBoundary'

// `refreshKey` lets the layout remount the current page (re-running its data
// fetches) without a full browser reload.
export default function PageTransition({ children, refreshKey = 0 }) {
  const location = useLocation()

  return (
    <div key={`${location.pathname}#${refreshKey}`} className="animate-page-in">
      <PageErrorBoundary>{children}</PageErrorBoundary>
    </div>
  )
}
