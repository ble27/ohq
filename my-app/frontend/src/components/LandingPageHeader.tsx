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

  return (
    <>
      <nav className="flex flex-row items-center sticky top-0 z-[100] pr-5 h-15 w-full shadow justify-between bg-white">
        {/* Logo Section */}
        <Link to="/" className="p-5 flex flex-row items-center gap-3 font-sans text-xl font-semibold">
          <span>Queuedex</span>
        </Link>

        {/* Mobile Hamburger Menu - Only renders on mobile */}
        {windowWidth <= MOBILE_BREAKING_POINT ? (
          isHamburgerMenuOpen ? (
            <LuX color="black" size="25" className="hover:opacity-80 cursor-pointer" 
            onClick={() => 
              setHamburgerMenuOpen(prev => !prev)} />
          ) : (
            <LuMenu color="black" size="25" className="hover:opacity-80 cursor-pointer" 
            onClick={() => 
              setHamburgerMenuOpen(prev => !prev)} />
          )
        ) : (
          <>
            {/* Desktop Middle Links - Hidden on mobile */}
            <div className="flex justify-center items-center gap-2 h-full">
              <Link to="/" className="font-sans text-sm md:text-base text-gray-500 hover:bg-gray-200 p-1 focus:opacity-90">
                Docs
              </Link>
              <Link to="/" className="font-sans text-sm md:text-base text-gray-500 hover:bg-gray-200 p-1 focus:opacity-90">
                Source
              </Link>
            </div>

            {/* Desktop Right Buttons - Hidden on mobile */}
            <div className="flex text-sm gap-2 pr-3">
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
          <div className="transition-all duration-300 ease-in-out absolute top-15 w-full h-60 text-black/70 bg-white border border-black/30 z-[110]">
            <div className="flex flex-col h-full text-base">
              <Link to="/" onClick={() => setHamburgerMenuOpen(false)} className="flex items-center flex-1 hover:bg-gray-200 px-5 border-b border-black/30">
                Docs
              </Link>
              <Link to="/" onClick={() => setHamburgerMenuOpen(false)} className="flex items-center flex-1 hover:bg-gray-200 px-5 border-b border-black/30">
                Source
              </Link>
              <Link to="/signin" onClick={() => setHamburgerMenuOpen(false)} className="flex items-center flex-1 hover:bg-gray-200 px-5 border-b border-black/30">
                Log In
              </Link>
              <Link to="/signup" onClick={() => setHamburgerMenuOpen(false)} className="flex items-center flex-1 hover:bg-gray-200 px-5">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
