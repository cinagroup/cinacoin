'use client'

import { ReactNode } from 'react'
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
  const [ref, inView] = useInView({ threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

  const translateMap = {
    up: 'translateY(30px)',
    down: 'translateY(-30px)',
    left: 'translateX(30px)',
    right: 'translateX(-30px)',
    none: 'none',
  }

  const totalDelay = delay + stagger

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translate(0) scale(1)' : `${translateMap[direction]} scale(0.98)`,
          transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${totalDelay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${totalDelay}ms`,
          willChange: 'opacity, transform',
        }}
      >
        {children}
      </div>
    </div>
  )
}
