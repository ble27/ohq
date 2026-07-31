import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LuMenu }  from "react-icons/lu";

export const Header = () => {
  // display LuMenu after authentication and in dashboard view

  return (
    <>
      <nav className='flex flex-row items-center sticky top-0 z-100 h-20 bg-white shadow p-5'>
        <Link to='/' className='w-1/3 flex flex-row items-center gap-3 font-sans text-2xl font-semibold'> 
          <span>MyQueue</span>
          </Link> 
        <div className='flex justify-center items-center gap-10 h-full w-1/3'> 
            <Link to='/' className='font-sans text-base text-gray-500 focus:opacity-90'> docs </Link> 
            <Link to='/' className='font-sans text-base text-gray-500 focus:opacity-90'> source </Link> 
        </div> 
        <div className='flex justify-end w-1/3'>placeholder</div>
        {/* <div className="w-[105px] hidden sm:block"></div>  */}
      </nav>
   
    </>    
  )
}
