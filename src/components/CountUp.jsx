import { useEffect, useRef, useState } from 'react'
import './CountUp.css'

const easeOutExpo = (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t))

export default function CountUp({
  to = 0,
  from = 0,
  duration = 1.6,
  delay = 0,
  className = '',
  separator = '',
  decimals = 0,
}) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(from)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return undefined

    let frameId
    const timeoutId = setTimeout(() => {
      const start = performance.now()
      const tick = (now) => {
        const progress = Math.min((now - start) / (duration * 1000), 1)
        const value = from + (to - from) * easeOutExpo(progress)
        setDisplay(value)
        if (progress < 1) frameId = requestAnimationFrame(tick)
      }
      frameId = requestAnimationFrame(tick)
    }, delay * 1000)

    return () => {
      clearTimeout(timeoutId)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [started, from, to, duration, delay])

  const format = (value) => {
    const fixed = value.toFixed(decimals)
    if (!separator) return fixed
    const [intPart, decPart] = fixed.split('.')
    const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return decPart != null ? `${withSep}.${decPart}` : withSep
  }

  return (
    <span ref={ref} className={`count-up${className ? ` ${className}` : ''}`}>
      {format(display)}
    </span>
  )
}
