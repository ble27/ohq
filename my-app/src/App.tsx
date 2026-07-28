import { useState } from 'react'
import { Header } from './components/Header'
import { Body } from './components/Body'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'

import './index.css'


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' 
          element={
            <>
              <Header />
              <Body />
            </>
            }></Route>
          <Route path='/dashboard' 
          element={<Dashboard />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
