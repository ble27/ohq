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
import { ProtectedRoute } from './components/ProtectedRoute'
import { Toaster } from '@/components/ui/sonner'

import './index.css'

function App() {
  return (
    <AuthContextProvider>
      <SocketProvider>
        <BrowserRouter>
          <Toaster 
              position='top-right'  
              toastOptions={{
              style: {
                background: 'white',
                color: 'black',
                borderColor: 'black',
              },
              classNames: {
                description: 'text-gray-700'
              }
            }} />
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
            {/* Dashboard routes — require auth; QueueManager is further gated by VerifyTA inside Dashboard */}
            <Route path='/dashboard' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path='/dashboard/home' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path='/dashboard/class' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path='/dashboard/queuemanager' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path='/dashboard/settings' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthContextProvider>
  )
}

export default App
