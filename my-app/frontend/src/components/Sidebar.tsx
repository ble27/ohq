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
  const { user, prismaUser, refreshUser } = useAuth();
  const userToggled = useRef(false);
  const navigate = useNavigate();
  const isMobileDrawer = !isDesktop;

  const toggleSidebar = () => {
    userToggled.current = true;
    setIsSidebarOpen(!isSidebarOpen);
  }

  const handleNavigation = () => {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setIsSidebarOpen(false);
    }
  }
  
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= MOBILE_BREAKPOINT;
      setIsDesktop(desktop);
      if (!desktop) {
        setIsSidebarOpen(false);
        userToggled.current = false;
        return;
      }
      if (!userToggled.current) {
        setIsSidebarOpen(true);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarOpen]);

  useEffect(() => {
    if (!isMobileDrawer || !isSidebarOpen) return;

    const { documentElement, body } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const previous = {
      htmlOverflow: documentElement.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      bodyTouchAction: body.style.touchAction,
    };

    documentElement.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.paddingRight = `${scrollbarWidth}px`;
    body.style.touchAction = 'none';

    return () => {
      documentElement.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.paddingRight = previous.bodyPaddingRight;
      body.style.touchAction = previous.bodyTouchAction;
    };
  }, [isMobileDrawer, isSidebarOpen]);

  const handleSignout = useCallback(async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
      await refreshUser();
    }
    catch(err: unknown) {
      console.log(err);
    }
  }, [refreshUser, navigate]);

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

  const linkClass = `flex w-full flex-row items-center gap-2.5 px-4 py-3 transition-colors duration-200 ${
    isSidebarOpen ? 'hover:bg-black/20' : 'pointer-events-none opacity-0'
  }`;

  return (
    <>
      {isDesktop && (
        <div
          className={`shrink-0 transition-[width] duration-300 ease-out ${isSidebarOpen ? 'w-60' : 'w-[72px]'}`}
          aria-hidden
        />
      )}

      {isMobileDrawer && isSidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        aria-hidden={isMobileDrawer && !isSidebarOpen}
        className={`fixed top-0 left-0 z-50 flex h-dvh flex-col bg-[#500000] text-white shadow ${
          isMobileDrawer
            ? `w-[min(20rem,85vw)] transition-transform duration-300 ease-out ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
              }`
            : `transition-[width] duration-300 ease-out ${isSidebarOpen ? 'w-60' : 'w-[72px]'}`
        }`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 px-3 pt-[env(safe-area-inset-top)]">
          <span
            className={`truncate text-lg font-medium transition-opacity ${
              isSidebarOpen ? 'opacity-100' : 'pointer-events-none w-0 overflow-hidden opacity-0'
            }`}
          >
            Queueble
          </span>
          <button
            type="button"
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            onClick={toggleSidebar}
            className={`rounded-full p-2 transition-colors hover:bg-black/20 ${
              isSidebarOpen ? 'ml-auto' : 'mx-auto'
            }`}
          >
            <LuPanelLeft size={22} color="white" />
          </button>
        </div>
        
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <ul className="flex w-full flex-col gap-1 text-sm font-semibold">
            <li>
              <Link to="/dashboard/home" onClick={handleNavigation} className={linkClass}>
                {isSidebarOpen && <LuHouse size={20} color="white" />}
                {isSidebarOpen && <span>Home</span>}
              </Link>
            </li>
            <li>
              <Link to="/dashboard/class" onClick={handleNavigation} className={linkClass}>
                {isSidebarOpen && <LuLibraryBig size={20} color="white" />}
                {isSidebarOpen && <span>Class</span>}
              </Link>
            </li>
            <li>
              <Link to="/dashboard/queuemanager" onClick={handleNavigation} className={linkClass}>
                {isSidebarOpen && <LuPackage size={20} color="white" />}
                {isSidebarOpen && <span>Queue Manager</span>}
              </Link>
            </li>
            <li>
              <Link to="/dashboard/settings" onClick={handleNavigation} className={linkClass}>
                {isSidebarOpen && <LuSettings size={20} color="white" />}
                {isSidebarOpen && <span>Settings</span>}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-auto shrink-0 border-t border-white/20">
          <button
            type="button"
            onClick={handleSignout}
            className={`flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors hover:bg-black/20 ${
              isSidebarOpen ? '' : 'justify-center'
            }`}
          >
            <LuLogOut size={20} color="white" className="shrink-0" />
            {isSidebarOpen && <span>Sign out</span>}
          </button>

          <div
            className={`flex min-w-0 items-center gap-2.5 px-4 py-3 ${
              isSidebarOpen ? '' : 'justify-center'
            }`}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white">
              {user?.email?.charAt(0).toUpperCase() ?? ''}
            </div>
            {isSidebarOpen && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-normal text-white">
                  {prismaUser?.name ?? 'No display name'}
                </div>
                <div className="truncate text-xs font-normal text-white/50">
                  {user?.email ?? ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
