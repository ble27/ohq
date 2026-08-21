import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Header } from './components/LandingPageHeader'
import { Body } from './components/LandingPageBody'
import { Dashboard } from './pages/Dashboard'
import { AuthContextProvider } from './context/AuthContextProvider'
import { SocketProvider } from './context/SocketProvider'
import { Signin } from './components/Signin'
import { Signup } from './components/Signup'
// [email/password — disabled for Google-only auth]
// import { EmailConfirmation } from './components/EmailConfirmation'
import { AuthCallback } from './components/AuthCallback'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PrivacyPage } from './pages/PrivacyPage'
import { Toaster } from '@/components/ui/sonner'

import './index.css'

function VerificationDiagnostics() {
  const location = useLocation();

  useEffect(() => {
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? null;
    const heading = document.querySelector<HTMLHeadingElement>('h1')?.textContent?.trim() ?? null;

    // #region agent log
    fetch('http://127.0.0.1:7631/ingest/8c9affa0-91b7-414a-ade2-92f13ab89cb1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cba606'},body:JSON.stringify({sessionId:'cba606',runId:'pre-fix',hypothesisId:'H1,H2,H3,H4,H5',location:'src/App.tsx:VerificationDiagnostics',message:'Rendered verification surface',data:{hostname:window.location.hostname,pathname:location.pathname,title:document.title,description,heading,routeRendered:Boolean(document.getElementById('root')?.textContent?.trim())},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== '/') return;

    const reportHeading = () => {
      const heading = document.querySelector<HTMLHeadingElement>('h1')?.textContent?.trim();
      if (!heading) return false;

      // #region agent log
      fetch('http://127.0.0.1:7631/ingest/8c9affa0-91b7-414a-ade2-92f13ab89cb1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cba606'},body:JSON.stringify({sessionId:'cba606',runId:'post-fix',hypothesisId:'H4,H5',location:'src/App.tsx:VerificationDiagnostics:heading',message:'Homepage heading observed',data:{heading},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return true;
    };

    if (reportHeading()) return;

    const observer = new MutationObserver(() => {
      if (reportHeading()) observer.disconnect();
    });
    observer.observe(document.getElementById('root')!, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [location.pathname]);

  return null;
}

function App() {
  // Lifted to the common parent — Header and Body are siblings, so the ref
  // Header scrolls to has to be created here and handed down to both.
  const featuresRef = useRef<HTMLDivElement>(null);

  return (
    <AuthContextProvider>
      <SocketProvider>
        <BrowserRouter>
          <VerificationDiagnostics />
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
                  <Header featuresRef={featuresRef} />
                  <Body featuresRef={featuresRef} />
                </>
              }
            />
            <Route path='/privacy' element={<PrivacyPage />} />
            <Route path='/signin' element={<Signin />} />
            <Route path='/signup' element={<Signup />} />
            {/* [email/password — disabled for Google-only auth] */}
            {/* <Route path='/check-email' element={<EmailConfirmation />} /> */}
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
