import React from 'react'
import { Link } from 'react-router-dom'
export const Header = () => {
  return (
    <>
      <nav className='flex flex-row items-center sticky top-0 h-20 border-b-1 bg-white border-gray-200 shadow p-5'>
        <Link to='/' className='w-1/3 font-sans text-2xl font-bold'> Queue </Link> 
        <div className='flex justify-center items-center gap-10 h-full w-1/3'> 
            <Link to='/' className='font-sans text-base text-gray-500 focus:opacity-90'> docs </Link> 
            <Link to='/' className='font-sans text-base text-gray-500 focus:opacity-90'> source </Link> 
        </div> 
        <div className='flex justify-end w-1/3'>Ye</div>
        {/* <div className="w-[105px] hidden sm:block"></div>  */}
      </nav>
   
    </>    
  )
}
