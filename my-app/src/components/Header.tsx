import React from 'react'

export const Header = () => {
  return (
    <>
   <nav className='flex flex-row items-center sticky top-0 z-50 h-20 pl-5 pr-10 bg-white mb-20'>
    <a href="#" className='w-1/3 font-sans text-2xl font-bold bg-blue-500'> Queue </a> 
    <div className='flex justify-center items-center gap-10 h-full w-1/3 bg-red-500'> 
        <a href="https://github.com/ble27" className='font-sans text-xl sm:text-xs text-gray-500 focus:opacity-90'> docs </a> 
        <a href="https://github.com/ble27" className='font-sans text-xl sm:text-xs text-gray-500 focus:opacity-90'> source </a> 
    </div> 
    <div className='flex justify-end w-1/3 bg-yellow-500'>Ye</div>
    {/* <div className="w-[105px] hidden sm:block"></div>  */}
    </nav>
    </>    
  )
}
