'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useInView } from '@/hooks/useInView'

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  duration?: number
  stagger?: number
}

export default function FadeIn({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 600,
  stagger = 0,
}: FadeInProps) {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const translateMap = {
    up: 'translateY(20px)',
    down: 'translateY(-20px)',
    left: 'translateX(20px)',
    right: 'translateX(-20px)',
    none: 'none',
  }

  const totalDelay = delay + stagger
  const effectiveDuration = reducedMotion ? 1 : duration
  const effectiveTransform = reducedMotion
    ? 'translate(0) scale(1)'
    : inView
      ? 'translate(0)'
      : `${translateMap[direction]}`

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          opacity: reducedMotion || inView ? 1 : 0,
          transform: effectiveTransform,
          transition: reducedMotion
            ? 'none'
            : `opacity ${effectiveDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${totalDelay}ms, transform ${effectiveDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${totalDelay}ms`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
