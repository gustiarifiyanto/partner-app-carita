import { useCountUp } from '../hooks/useCountUp'

// Counts up to `value`, rendering each frame through `format` (e.g. formatCurrency).
export default function AnimatedNumber({ value, format = String }) {
  const animated = useCountUp(value)
  return <span className="tabular-nums">{format(Math.round(animated))}</span>
}
