import { ORDER_SOURCES } from '../../lib/orderSources'

export default function SourceBadge({ source }) {
  const config = ORDER_SOURCES[source] || ORDER_SOURCES.admin

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  )
}
