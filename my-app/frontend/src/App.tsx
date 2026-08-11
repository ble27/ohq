import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/LandingPageHeader'
import { Body } from './components/LandingPageBody'
import { Dashboard } from './pages/Dashboard'
import { AuthContextProvider } from './context/AuthContextProvider'
import { SocketProvider } from './context/SocketProvider'
import { Signin } from './components/Signin'
import { Signup } from './components/Signup'
import { EmailConfirmation } from './components/EmailConfirmation'
import { AuthCallback } from './components/AuthCallback'

import './index.css'

function App() {
  return (
    <AuthContextProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/'
              element={
                <>
                  <Header />
                  <Body />
                </>
              }
            />
            <Route path='/signin' element={<Signin />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/check-email' element={<EmailConfirmation />} />
            <Route path='/auth/callback' element={<AuthCallback />} />
            {/* Dashboard routes — QueueManager is gated by VerifyTA inside Dashboard */}
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/dashboard/home' element={<Dashboard />} />
            <Route path='/dashboard/class' element={<Dashboard />} />
            <Route path='/dashboard/queuemanager' element={<Dashboard />} />
            <Route path='/dashboard/settings' element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthContextProvider>
  )
}

export default App
