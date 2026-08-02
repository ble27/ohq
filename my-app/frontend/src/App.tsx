import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Body } from './components/Body'
import { Dashboard } from './pages/Dashboard'
import { AuthContextProvider } from './context/AuthContextProvider'
import { SocketProvider } from './context/SocketProvider'
import { Signin } from './components/Signin'
import { Signup } from './components/Signup'
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
            <Route path='signup' element={<Signup />} />

            {/* Dashboard routes */}
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/dashboard/home' element={<Dashboard />} />
            <Route path='/dashboard/class' element={<Dashboard />} />
            <Route path='/dashboard/queuemanager' element={<Dashboard />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthContextProvider>
  )
}

export default App
