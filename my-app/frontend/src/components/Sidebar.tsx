import React from 'react'
import { Link } from 'react-router-dom'
import { LuHouse, LuLibraryBig, LuSettings } from "react-icons/lu";

export const Sidebar = () => {
  return (
    <>
      <div className='relative flex flex-col w-80 h-screen shadow bg-[#500000] text-white font-semibold'> 
        <span className='font-medium text-white pl-4 text-xl pt-5 pb-7'> Queuedex</span> 
        
        <ul className='flex text-md flex-col gap-3 pointer-events-auto w-full'> 
          <Link to='/dashboard/home' className='flex flex-row px-4 py-2 gap-[5px] items-center transition-colors duration-200 hover:bg-gray-500/30 hover:opacity-90 w-full'> 
            <LuHouse size={14} color="white" /> <span>Home</span> 
          </Link> 
          <Link to='/dashboard/class' className='flex flex-row px-4 py-2 gap-[5px] items-center transition-colors duration-200 hover:opacity-90 hover:bg-gray-500/30 w-full'> 
            <LuLibraryBig size={14} color="white" /> <span>Class</span> 
          </Link> 
          <div className='flex flex-row px-4 py-2 gap-[5px] items-center transition-colors duration-200 hover:opacity-90 hover:bg-gray-500/30 w-full'>
            <LuSettings size={14} color='white'/>
            Settings
          </div>
        </ul> 
        
        {/* Account and settings */}
        <div className='flex flex-row absolute bottom-0 left-0 h-20 w-[calc(100%-1rem)] border-t border-gray-50/20 w-full items-center gap-2 pl-2'> 
          <div className='w-9 h-9 rounded-full bg-gray-50 border-none'></div> 
          <div className='flex-col'>
            <div className='font-normal text-sm'>Your Name</div> 
            <div className='font-normal text-xs text-gray-50/50'>Account Status</div> 
          </div>          
        </div> 
    </div>
    </>
  )
}
