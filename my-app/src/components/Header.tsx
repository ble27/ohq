import React from 'react'

export const Header = () => {
  return (
    <>
    <nav className='flex flex-row justify-between items-center sticky top-0 z-50 w-full pl-5 pt-5 pr-10 pb-10 bg-white'>
        <a href="#" className='font-sans text-3xl font-bold'>
            Queue
        </a>
        <a href="#" className='font-sans text-xl sm:text-lg text-gray-500 focus:opacity-90'>
            docs
        </a>
        <div className="w-[105px] hidden sm:block"></div> 
    </nav>
    </>    
  )
}
