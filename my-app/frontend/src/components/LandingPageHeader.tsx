import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LuMenu, LuX } from 'react-icons/lu'; // Added LuX for a better closing icon experience

export const Header = () => {
  const [isHamburgerMenuOpen, setHamburgerMenuOpen] = useState(false); // Changed default to false so menu starts closed
  const MOBILE_BREAKING_POINT = 684;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      setWindowWidth(currentWidth);
      if (currentWidth > MOBILE_BREAKING_POINT) {
        // Close if the user toggled open
        setHamburgerMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
  if (isHamburgerMenuOpen) {
    document.body.classList.add('overflow-hidden');
  } else {
    document.body.classList.remove('overflow-hidden');
  }

  // Cleanup to prevent broken scrolling if the component unmounts
  return () => document.body.classList.remove('overflow-hidden');
  }, [isHamburgerMenuOpen]);

  return (
    <>
      <nav className="flex sticky top-0 z-[100] pt-2 h-15 bg-yellow-50 w-full justify-between">
        {/* Logo Section */}
        <div className='flex flex-1 items-center'>
          <Link to="/" className="pl-8 md:pl-15 lg:pl-20 items-center gap-3 
          text-2xl font-medium tracking-tight">
            <span>Queueble</span>
          </Link>
        </div>
        {/* Mobile Hamburger Menu - Only renders on mobile */}
        {windowWidth <= MOBILE_BREAKING_POINT ? (
          isHamburgerMenuOpen ? (
            <div className='flex flex-1 items-center justify-end pr-8'>
              <LuX color="black" size="25" className="hover:opacity-80 cursor-pointer" 
              onClick={() => 
                setHamburgerMenuOpen(prev => !prev)} />
            </div>
          ) : (
            <div className='flex flex-1 items-center justify-end pr-8'>
              <LuMenu color="black" size="25" className="hover:opacity-80 cursor-pointer" 
              onClick={() => 
                setHamburgerMenuOpen(prev => !prev)} />
            </div>
          )
        ) : (
          <>
            {/* Desktop Middle Links - Hidden on mobile */}
            <div className="flex flex-1 justify-center items-center gap-2 h-full">
              <Link to="/" className="font-sans text-sm text-gray-500 hover:text-black p-1 focus:opacity-90">
                Docs
              </Link>
              <Link to="/" className="font-sans text-sm text-gray-500 hover:text-black p-1 focus:opacity-90">
                Source
              </Link>
            </div>

            {/* Desktop Right Buttons - Hidden on mobile */}
            <div className="flex flex-1 pr-8 md:pr-15 lg:pr-20 items-center justify-end h-full text-sm gap-2 pr-3">
              <Link to="/signin" className="bg-black text-white transition-colors duration-300 ease-in-out rounded-full px-3 py-2 hover:opacity-80">
                Log In
              </Link>
              <Link to="/signup" className="px-3 py-2 rounded-full transition-colors duration-300 ease-in-out hover:opacity-80 hover:bg-gray-300/50">
                Sign Up
              </Link>
            </div>
          </>
        )}

        {/* Mobile Dropdown Menu Overlay */}
        {windowWidth <= MOBILE_BREAKING_POINT && isHamburgerMenuOpen && (
          <div className="transition-all duration-300 ease-in-out absolute top-15 w-full h-screen text-black bg-yellow-50 z-[110]">
            <div className="sticky flex flex-col h-70 text-base">
              <Link to="/" onClick={() => setHamburgerMenuOpen(false)} className="flex items-center flex-1 hover:bg-gray-200 px-9 border-b border-black/30">
                Docs
              </Link>
              <Link to="/" onClick={() => setHamburgerMenuOpen(false)} className="flex items-center flex-1 hover:bg-gray-200 px-9 border-b border-black/30">
                Source
              </Link>
              <Link to="/signin" onClick={() => setHamburgerMenuOpen(false)} className="flex items-center flex-1 hover:bg-gray-200 px-9 border-b border-black/30">
                Log In
              </Link>
              <Link to="/signup" onClick={() => setHamburgerMenuOpen(false)} className="flex items-center flex-1 hover:bg-gray-200 px-9 border-b border-black/30">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
