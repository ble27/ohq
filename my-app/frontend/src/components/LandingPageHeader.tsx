import { useState, useEffect, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { LuMenu, LuX } from 'react-icons/lu'; // Added LuX for a better closing icon experience

interface HeaderProps {
  featuresRef: RefObject<HTMLDivElement | null>;
}

export const Header = ({ featuresRef }: HeaderProps) => {
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

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
          !isHamburgerMenuOpen && (
            <div className='flex flex-1 items-center justify-end pr-8'>
              <LuMenu color="black" size="25" className="hover:opacity-80 cursor-pointer" 
              onClick={() => 
                setHamburgerMenuOpen(prev => !prev)} />
            </div>
          )
        ) : (
          <>
            <div className="flex flex-1 justify-center items-center gap-2 h-full">
              <button onClick={scrollToFeatures} className="font-sans text-sm text-gray-500 hover:text-black p-1 focus:opacity-90">
                Features
              </button>
               <Link to="/privacy" className="font-sans text-sm text-gray-500 hover:text-black p-1 focus:opacity-90">
                Privacy
              </Link>
            </div>

            {/* Desktop auth — Log In / Sign Up route to Google OAuth on /signin */}
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

        {/* Mobile menu — fixed full-screen so sticky feature cards cannot paint above it */}
        {windowWidth <= MOBILE_BREAKING_POINT && isHamburgerMenuOpen && (
          <div className="fixed inset-0 z-[200] flex flex-col bg-yellow-50 pt-2">
            <div className="flex h-15 w-full items-center justify-between">
              <Link
                to="/"
                onClick={() => setHamburgerMenuOpen(false)}
                className="pl-8 text-2xl font-medium tracking-tight"
              >
                Queueble
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                className="pr-8 hover:opacity-80"
                onClick={() => setHamburgerMenuOpen(false)}
              >
                <LuX color="black" size="25" />
              </button>
            </div>
            <div className="flex flex-col text-base">
              <button 
                onClick={() => {
                  setHamburgerMenuOpen(false);
                  scrollToFeatures();
                  }
                } 
                className="flex min-h-16 items-center hover:bg-gray-200 px-9 border-b border-black/30">
                Features
              </button>
              <Link to="/privacy" onClick={() => setHamburgerMenuOpen(false)} className="flex min-h-16 items-center hover:bg-gray-200 px-9 border-b border-black/30">
                Privacy
              </Link>
              <Link to="/signin" onClick={() => setHamburgerMenuOpen(false)} className="flex min-h-16 items-center hover:bg-gray-200 px-9 border-b border-black/30">
                Log In
              </Link>
              <Link to="/signup" onClick={() => setHamburgerMenuOpen(false)} className="flex min-h-16 items-center hover:bg-gray-200 px-9 border-b border-black/30">
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
