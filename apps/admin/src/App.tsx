import { useOnboarding } from '@weesper/hooks'
import { Navigate, Route, Routes } from 'react-router'
import './index.css'
import { About, Enhancements, General, Layout, Models, Recordings } from './dashboard'
import { Onboarding } from './onboarding'
import { Widget } from './widget'

export const App = () => {
  const { hasOnBoarded } = useOnboarding()

  // Check if we are in recording mode
  const isRecordingMode = new URLSearchParams(window.location.search).get('mode') === 'recording'
  if (isRecordingMode) {
    return <Widget />
  }

  if (hasOnBoarded) {
    return (
      <Routes>
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard/general" replace />} />
          <Route path="general" element={<General />} />
          <Route path="models" element={<Models />} />
          <Route path="enhancements" element={<Enhancements />} />
          <Route path="recordings" element={<Recordings />} />
          <Route path="about" element={<About />} />
        </Route>
        {/* Default redirect to models if no path or wrong path */}
        <Route path="*" element={<Navigate to="/dashboard/general" replace />} />
      </Routes>
    )
  }

  return <Onboarding />
}
