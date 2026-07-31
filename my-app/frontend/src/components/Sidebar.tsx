import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LuHouse, LuLibraryBig, LuSettings, LuPanelLeft } from "react-icons/lu";

export const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  }

  return (
    <>
      <div className={`relative flex flex-col h-screen shadow bg-[#500000] transition-all ease-in-out duration-400 text-white font-semibold 
      ${isSidebarOpen ? 'w-80' : 'w-18'}`}>
        <div className='flex flex-row items-center pl-4 text-xl pt-5 pb-7 pr-2'>
        <span 
          className={`font-medium text-white whitespace-nowrap transition-all duration-200 overflow-hidden cursor-pointer
            ${isSidebarOpen ? 'opacity-100 max-w-[160px] mr-auto justify-between' : 'opacity-0 max-w-0 mr-0 pointer-events-none'}`}
        >
          Queuedex
        </span>
          <LuPanelLeft 
            size={45} 
            onClick={toggleSidebar} 
            className='p-3 rounded-full hover:bg-black/20 transition-colors duration-200 cursor-pointer' 
            color='white'
          />
        </div>
        
        <ul className='flex text-md flex-col gap-3 pointer-events-auto w-full'> 
          <Link to='/dashboard/home' className='flex flex-row px-4 py-3 gap-[10px] items-center transition-colors duration-200 hover:bg-black/20 hover:opacity-90 w-full'> 
              {isSidebarOpen && <LuHouse size={20} color="white" />}
              {isSidebarOpen && <span>Home</span>}
          </Link> 
          <Link to='/dashboard/class' className='flex flex-row px-4 py-3 gap-[10px] items-center transition-colors duration-200 hover:opacity-90 hover:bg-black/20 w-full'> 
              {isSidebarOpen && <LuLibraryBig size={20} color="white" />}
              {isSidebarOpen && <span>Class</span>}
          </Link> 
          <div className='flex flex-row px-4 py-3 gap-[10px] items-center transition-colors duration-200 hover:opacity-90 hover:bg-black/20 w-full'>
              {isSidebarOpen && <LuSettings size={20} color="white" />}
              {isSidebarOpen && <span>Settings</span>}
          </div>
        </ul> 
        
        {/* Account and settings */}
        <div 
          className={`flex flex-row absolute bottom-0 left-0 h-20 w-full gap-2 border-t border-gray-50/20 items-center transition-all duration-200
            ${isSidebarOpen ? ' justify-start pl-4' : 'justify-center pl-2'}`}
          >
          {/* PFP placeholder */}
          <div className='w-9 h-9 rounded-full bg-gray-50 border-none shrink-0'></div>

          {/* Account name and status */}
          <div className='flex flex-col overflow-hidden'>
            <div className={`font-normal text-sm whitespace-nowrap transition-all duration-200 ${isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pl-0'}`}>
              Your Name
            </div> 
            <div className={`font-normal text-xs text-gray-50/50 whitespace-nowrap transition-all duration-200 ${isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pl-0'}`}>
              Account Status
            </div> 
          </div>          
        </div>
    </div>
    </>
  )
}
