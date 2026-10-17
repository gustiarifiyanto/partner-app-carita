import lottie from 'lottie-web'
import { useEffect, useRef } from 'react'

export default function LottiePlayer({ animationData, path, className, style, loop = true, autoplay = true }) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const instance = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      ...(animationData ? { animationData } : { path }),
    })

    return () => instance.destroy()
  }, [animationData, path, loop, autoplay])

  return <div ref={containerRef} className={className} style={{ aspectRatio: '3 / 2', ...style }} />
}
