import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LuHouse, LuLibraryBig, LuSettings, LuPanelLeft, LuLogOut, LuPackage } from "react-icons/lu";
import { signOut } from '@/services/authService';
import { useAuth } from '@/context/AuthContextProvider';

export const MOBILE_BREAKPOINT = 640;

const INACTIVITY_EVENTS = ['mousedown', 'mousemove', 'click', 'scroll', 'keypress'] as const;
const INACTIVITY_TIMEOUT_MINUTES = 30;
const INACTIVITY_TIMEOUT_MS = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000;

interface SideBarProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (value: boolean) => void
}

export const Sidebar = ({ isSidebarOpen, setIsSidebarOpen }: SideBarProps ) => {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= MOBILE_BREAKPOINT);
  const { user, refreshUser } = useAuth();
  const userToggled = useRef(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    userToggled.current = true;
    setIsSidebarOpen(!isSidebarOpen);
  }

  const handleNavigation = () => {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setIsSidebarOpen(false);
    }
  }
  
  // Sync open/closed with viewport; always collapse below breakpoint
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= MOBILE_BREAKPOINT;
      setIsDesktop(desktop);
      if (!desktop) {
        setIsSidebarOpen(false);
        userToggled.current = false;
        return;
      }
      // Desktop: reopen unless the user manually collapsed
      if (!userToggled.current) {
        setIsSidebarOpen(true);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarOpen]);

  const sidebarWidth = isSidebarOpen ? 'w-60' : 'w-[72px]';
  // Mobile: spacer stays 72px so expand overlays home without shifting it.
  // Desktop: spacer matches sidebar so content is pushed.
  const spacerWidth = isDesktop ? sidebarWidth : 'w-[72px]';

  // Build a new function whenever a user is refreshed or whenever a new page is navigated to
  const handleSignout = useCallback(async () => {
    try {
      await signOut();
      await refreshUser();
      navigate('/');
    }
    catch(err: unknown) {
      console.log(err);
    }
  }, [refreshUser, navigate]);

  // Auto sign-out after inactivity. Must live in an effect (not the render
  // body) — otherwise every re-render re-adds these listeners without
  // removing the previous set and resets the timer regardless of whether
  // the user was actually active.
  // handleSignout is called in useEffect therefore is also in in dependency list 
  useEffect(() => {
    let inactivityTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => { void handleSignout(); }, INACTIVITY_TIMEOUT_MS);
    };

    INACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      INACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimeout(inactivityTimer);
    };
  }, [handleSignout]);

  return (
    <>
      {/* Spacer keeps main content offset; on mobile it never grows with expand */}
      <div className={`shrink-0 transition-all ease-in-out duration-400 ${spacerWidth}`} aria-hidden />
      <div className={`fixed top-0 left-0 z-40 flex flex-col h-screen shadow bg-[#500000] transition-all ease-in-out duration-400 text-white font-semibold ${sidebarWidth}`}>
        <div className='flex flex-row items-center pl-4 text-xl pt-5 pb-7 pr-2'>
        <span 
          className={`font-medium text-white whitespace-nowrap transition-all duration-200 overflow-hidden cursor-pointer
            ${isSidebarOpen ? 'opacity-100 max-w-[160px] mr-auto justify-between' : 'opacity-0 max-w-0 mr-0 pointer-events-none'}`}
        >
          Queueble
        </span>
          <LuPanelLeft 
            size={45} 
            onClick={toggleSidebar} 
            className='p-3 rounded-full hover:bg-black/20 transition-colors duration-200 cursor-pointer' 
            color='white'
          />
        </div>
        
        <ul className='flex text-md flex-col gap-3 pointer-events-auto w-full'> 
          <Link to='/dashboard/home' 
            onClick={handleNavigation}
            className={`flex flex-row px-4 py-3 gap-[10px] items-center transition-colors duration-200 w-full 
            ${isSidebarOpen ? 'hover:bg-black/20 hover:opacity-90': 'hover:opacity-0 pointer-events-none'}`}> 
              {isSidebarOpen && <LuHouse size={20} color="white" />}
              {isSidebarOpen && <span>Home</span>}
          </Link> 
          <Link to='/dashboard/class' onClick={handleNavigation} className={`flex flex-row px-4 py-3 gap-[10px] items-center transition-colors duration-200 w-full
            ${isSidebarOpen ? 'hover:bg-black/20 hover:opacity-90': 'hover:opacity-0 pointer-events-none'}`}> 
              {isSidebarOpen && <LuLibraryBig size={20} color="white" />}
              {isSidebarOpen && <span>Class</span>}
          </Link> 

          <Link to='/dashboard/queuemanager' onClick={handleNavigation} className={`flex flex-row px-4 py-3 gap-[10px] items-center transition-colors duration-200 w-full
            ${isSidebarOpen ? 'hover:bg-black/20 hover:opacity-90': 'hover:opacity-0 pointer-events-none'}`}>
              {isSidebarOpen && <LuPackage size={20} color="white" />}
              {isSidebarOpen && <span>Queue Manager</span>}
          </Link>

          <Link to='/dashboard/settings' onClick={handleNavigation} className={`flex flex-row px-4 py-3 gap-[10px] items-center transition-colors duration-200 w-full 
            ${isSidebarOpen ? 'hover:bg-black/20 hover:opacity-90': 'hover:opacity-0 pointer-events-none'}`}>
              {isSidebarOpen && <LuSettings size={20} color="white" />}
              {isSidebarOpen && <span>Settings</span>}
          </Link>
        </ul> 



        <div className={`flex flex-row absolute bottom-25 px-4 py-3 gap-[10px] items-center transition-colors duration-200 w-full pointer-events-auto 
            cursor-pointer ${isSidebarOpen ? 'hover:bg-black/20 hover:opacity-90': 'hover:opacity-80 justify-center'}`}
            onClick={handleSignout}>
              <LuLogOut size={20} color="white"/>
              {isSidebarOpen && <span>Sign out</span>}
          </div>
        {/* Account and settings */}
        <div 
          className={`flex flex-row absolute bottom-0 left-0 h-20 w-full gap-2 border-t border-gray-50/20 items-center transition-all duration-200
            ${isSidebarOpen ? ' justify-start pl-4' : 'justify-center pl-2'}`}
          >
          {/* PFP placeholder */}
          <div className='w-9 h-9 rounded-full text-white font-bold bg-black/60 border-none shrink-0 flex items-center justify-center'>
            {user?.email?.charAt(0).toUpperCase() ?? ''}
          </div>

          {/* Account name and status */}
          <div className='flex flex-col overflow-hidden'>
            <div className={`font-normal text-white text-xs whitespace-nowrap transition-all duration-200 ${isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pl-0'}`}>
              {user?.email ?? ''}
            </div> 
            <div className={`font-normal text-white text-xs text-gray-50/50 whitespace-nowrap transition-all duration-200 ${isSidebarOpen ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0 pl-0'}`}>
              {user?.id ?? ''}
            </div> 
          </div>          
        </div>
    </div>
    </>
  )
}
