import { useRef } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/LandingPageHeader'
import { Body } from './components/LandingPageBody'
import { Dashboard } from './pages/Dashboard'
import { AuthContextProvider } from './context/AuthContextProvider'
import { SocketProvider } from './context/SocketProvider'
import { Signin } from './components/Signin'
import { Signup } from './components/Signup'
import { AuthCallback } from './components/AuthCallback'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PrivacyPage } from './pages/PrivacyPage'
import { Toaster } from '@/components/ui/sonner'

import './index.css'

function App() {
  const featuresRef = useRef<HTMLDivElement>(null);

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
                <div className="w-full">
                  <div className="mx-auto w-full max-w-[1500px]">
                    <Header featuresRef={featuresRef} />
                  </div>
                  <Body featuresRef={featuresRef} />
                </div>
              }
            />
            <Route path='/privacy' element={<PrivacyPage />} />
            <Route path='/signin' element={<Signin />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/auth/callback' element={<AuthCallback />} />
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
