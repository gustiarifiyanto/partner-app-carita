import { useEffect, useRef, useState } from 'react'

// Animates a number from its previous value to `target` with an ease-out curve.
// Jumps straight to the target when the user prefers reduced motion.
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const to = Number(target) || 0
    const from = fromRef.current
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion || from === to) {
      fromRef.current = to
      setValue(to)
      return
    }

    let frame
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (to - from) * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      fromRef.current = to
    }
  }, [target, duration])

  return value
}
