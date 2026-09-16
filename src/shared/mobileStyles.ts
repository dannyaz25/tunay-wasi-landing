/**
 * mobileStyles.ts — Utilidades de estilo para mobile-first en marketplace
 * Stub para compatibilidad con módulo marketplace (feat/marketplace-mvp)
 */
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'

export function useIsMobile(breakpoint = 600): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

/** Returns a CSS padding string for use as a style.padding value */
export function padY(isMobile: boolean, desktopPx = 32): string {
  return isMobile ? '16px 12px' : `${desktopPx}px 24px`
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #c4b297',
  background: '#fff',
  fontSize: 14,
  fontFamily: 'Montserrat, sans-serif',
  color: '#1f3028',
  outline: 'none',
  boxSizing: 'border-box',
}

/** Returns a CSSProperties grid object (responsive: 1 col on mobile, 2 on desktop) */
export function grid2(isMobile: boolean): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: 12,
  }
}
