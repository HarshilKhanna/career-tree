'use client';

import { useEffect, useState } from 'react';

/** SSR-safe: false until mounted, then tracks `window.matchMedia`. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const apply = () => setMatches(mql.matches);
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [query]);

  return matches;
}
