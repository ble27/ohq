import { useState, useEffect, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { LuMenu, LuX } from 'react-icons/lu';

interface HeaderProps {
  featuresRef: RefObject<HTMLDivElement | null>;
}

const LOGO_INSET = 'pl-6 sm:pl-8 md:pl-15 lg:pl-20';

export const Header = ({ featuresRef }: HeaderProps) => {
  const [isHamburgerMenuOpen, setHamburgerMenuOpen] = useState(false);
  const MOBILE_BREAKING_POINT = 684;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth <= MOBILE_BREAKING_POINT;

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      setWindowWidth(currentWidth);
      if (currentWidth > MOBILE_BREAKING_POINT) {
        setHamburgerMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isHamburgerMenuOpen) return;

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
    documentElement.style.setProperty('--hamburger-gutter', `${scrollbarWidth}px`);

    return () => {
      documentElement.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.paddingRight = previous.bodyPaddingRight;
      body.style.touchAction = previous.bodyTouchAction;
      documentElement.style.removeProperty('--hamburger-gutter');
    };
  }, [isHamburgerMenuOpen]);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {isHamburgerMenuOpen && <div className="h-15 shrink-0" aria-hidden />}
      <nav
        className={`z-[200] flex h-15 w-full items-center justify-between bg-yellow-50 pt-2 ${
          isHamburgerMenuOpen
            ? 'fixed inset-x-0 top-0 mx-auto max-w-[1500px] pr-[var(--hamburger-gutter,0px)]'
            : 'sticky top-0'
        }`}
      >
        <Link
          to="/"
          onClick={() => setHamburgerMenuOpen(false)}
          className={`${LOGO_INSET} flex-1 text-2xl font-medium tracking-tight`}
        >
          Queueble
        </Link>

        {isMobile ? (
          <button
            type="button"
            aria-label={isHamburgerMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isHamburgerMenuOpen}
            className="relative mr-4 flex size-11 shrink-0 items-center justify-center sm:mr-6 hover:opacity-80 cursor-pointer"
            onClick={() => setHamburgerMenuOpen((prev) => !prev)}
          >
            <span className="relative size-[25px]">
              <LuMenu
                size={25}
                color="black"
                className={`absolute inset-0 transition-all duration-300 ease-out ${
                  isHamburgerMenuOpen
                    ? 'rotate-90 scale-75 opacity-0'
                    : 'rotate-0 scale-100 opacity-100'
                }`}
              />
              <LuX
                size={25}
                color="black"
                className={`absolute inset-0 transition-all duration-300 ease-out ${
                  isHamburgerMenuOpen
                    ? 'rotate-0 scale-100 opacity-100'
                    : '-rotate-90 scale-75 opacity-0'
                }`}
              />
            </span>
          </button>
        ) : (
          <>
            <div className="flex flex-1 justify-center items-center gap-2 h-full">
              <button
                onClick={scrollToFeatures}
                className="font-sans text-sm text-gray-500 hover:text-black p-1 focus:opacity-90"
              >
                Features
              </button>
              <Link
                to="/privacy"
                className="font-sans text-sm text-gray-500 hover:text-black p-1 focus:opacity-90"
              >
                Privacy
              </Link>
            </div>

            <div className="flex flex-1 pr-8 md:pr-15 lg:pr-20 items-center justify-end h-full text-sm gap-2">
              <Link
                to="/signin"
                className="bg-black text-white transition-colors duration-300 ease-in-out rounded-full px-3 py-2 hover:opacity-80"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="px-3 py-2 rounded-full transition-colors duration-300 ease-in-out hover:opacity-80 hover:bg-gray-300/50"
              >
                Sign Up
              </Link>
            </div>
          </>
        )}
      </nav>

      {isMobile && (
        <div
          className={`fixed inset-x-0 top-15 bottom-0 z-[190] overflow-y-auto overscroll-contain bg-yellow-50 transition-opacity duration-300 ease-out ${
            isHamburgerMenuOpen
              ? 'opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
          aria-hidden={!isHamburgerMenuOpen}
          inert={!isHamburgerMenuOpen}
        >
          <div className="flex flex-col text-2xl">
            <button
              type="button"
              tabIndex={isHamburgerMenuOpen ? 0 : -1}
              onClick={() => {
                setHamburgerMenuOpen(false);
                scrollToFeatures();
              }}
              className={`flex min-h-20 items-center hover:bg-gray-100 pr-6 ${LOGO_INSET}`}
            >
              Features
            </button>
            <Link
              to="/privacy"
              tabIndex={isHamburgerMenuOpen ? 0 : -1}
              onClick={() => setHamburgerMenuOpen(false)}
              className={`flex min-h-20 items-center hover:bg-gray-100 pr-6 ${LOGO_INSET}`}
            >
              Privacy
            </Link>
            <Link
              to="/signin"
              tabIndex={isHamburgerMenuOpen ? 0 : -1}
              onClick={() => setHamburgerMenuOpen(false)}
              className={`flex min-h-20 items-center hover:bg-gray-100 pr-6 ${LOGO_INSET}`}
            >
              Log In
            </Link>
            <Link
              to="/signup"
              tabIndex={isHamburgerMenuOpen ? 0 : -1}
              onClick={() => setHamburgerMenuOpen(false)}
              className={`flex min-h-20 items-center hover:bg-gray-100 pr-6 ${LOGO_INSET}`}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
