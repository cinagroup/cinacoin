'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from '@/hooks/useInView'

interface AnimatedNumberProps {
  value: string
  duration?: number
}

function parseNumber(value: string): { prefix: string; num: number; suffix: string } {
  // Extract leading non-digit chars, the number, and trailing chars
  const match = value.match(/^([^\d.-]*)([\d.]+)(.*)$/)
  if (!match) return { prefix: '', num: 0, suffix: value }
  return {
    prefix: match[1],
    num: parseFloat(match[2]),
    suffix: match[3],
  }
}

export default function AnimatedNumber({ value, duration = 2000 }: AnimatedNumberProps) {
  const [ref, inView] = useInView({ threshold: 0.3 })
  const [displayed, setDisplayed] = useState(value)
  const { prefix, num, suffix } = parseNumber(value)
  const hasDecimal = value.includes('.')
  const decimals = hasDecimal ? value.split('.')[1]?.replace(/[^\d]/g, '').length || 0 : 0

  useEffect(() => {
    if (!inView) return

    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = num * eased

      if (hasDecimal) {
        setDisplayed(`${prefix}${current.toFixed(decimals)}${suffix}`)
      } else {
        setDisplayed(`${prefix}${Math.floor(current)}${suffix}`)
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setDisplayed(value)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [inView, value, num, duration, prefix, suffix, hasDecimal, decimals])

  return <span ref={ref}>{displayed}</span>
}
