import { useState } from 'react'
import { Header } from './components/Header'
import { Body } from './components/Body'
import './index.css'


function App() {
  return (
    <>
      <div className='min-height-screen'>
      <Header/>
      <Body />
      </div>
    </>
  )
}

export default App
