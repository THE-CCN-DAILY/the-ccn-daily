import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll to the top on every route change.
 *
 * The app shell scrolls inside a `<main overflow-y-auto>` container (not the
 * window), and that container persists across route changes — so without this,
 * navigating from a long page leaves the next page scrolled partway down (the
 * "page starts at the bottom" bug, especially noticeable on mobile after auth).
 * We reset both the window and the main scroller.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
