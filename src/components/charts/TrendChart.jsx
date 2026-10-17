import { useMemo, useRef, useState } from 'react'
import { CHART_AXIS, CHART_GRIDLINE, CHART_MUTED, SERIES_1, SERIES_2 } from '../../lib/chartColors'
import { formatCompactCurrency, formatCurrency } from '../../lib/format'

const WIDTH = 640
const HEIGHT = 260
const MARGIN = { top: 16, right: 16, bottom: 28, left: 56 }
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom

function niceMax(rawMax) {
  if (rawMax <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(rawMax))
  const normalized = rawMax / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function formatPeriodLabel(period, groupBy) {
  if (!period) return ''
  if (groupBy === 'month') {
    const [year, month] = period.split('-')
    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(
      new Date(Number(year), Number(month) - 1, 1),
    )
  }
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(period))
}

export default function TrendChart({ data, groupBy }) {
  const svgRef = useRef(null)
  const [hoverIndex, setHoverIndex] = useState(null)

  const points = useMemo(
    () =>
      data.map((row) => ({
        period: row.period,
        revenue: Number(row.revenue) || 0,
        commission: Number(row.commission) || 0,
      })),
    [data],
  )

  const n = points.length
  const yMax = niceMax(Math.max(1, ...points.map((p) => Math.max(p.revenue, p.commission))))
  const xStep = n > 1 ? INNER_WIDTH / (n - 1) : 0

  const xAt = (i) => MARGIN.left + (n > 1 ? i * xStep : INNER_WIDTH / 2)
  const yAt = (v) => MARGIN.top + INNER_HEIGHT - (v / yMax) * INNER_HEIGHT

  const linePath = (key) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p[key])}`).join(' ')

  const areaPath = (key) => {
    if (n === 0) return ''
    const top = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p[key])}`).join(' ')
    return `${top} L ${xAt(n - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`
  }

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)

  const xLabelStep = Math.max(1, Math.ceil(n / 6))

  const handlePointerMove = (e) => {
    if (n === 0 || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * WIDTH
    const rawIndex = n > 1 ? Math.round((svgX - MARGIN.left) / xStep) : 0
    setHoverIndex(Math.min(n - 1, Math.max(0, rawIndex)))
  }

  if (n === 0) {
    return <p className="text-sm text-slate-400">Belum ada data untuk rentang ini.</p>
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null
  const tooltipLeftPct = hoverIndex !== null ? (xAt(hoverIndex) / WIDTH) * 100 : 0
  const tooltipAlignEnd = tooltipLeftPct > 65

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: SERIES_1 }} />
          Revenue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: SERIES_2 }} />
          Komisi
        </span>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none"
          role="img"
          aria-label="Grafik tren revenue dan komisi"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(null)}
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke={CHART_GRIDLINE}
                strokeWidth={1}
              />
              <text x={MARGIN.left - 8} y={yAt(tick)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill={CHART_MUTED}>
                {formatCompactCurrency(tick)}
              </text>
            </g>
          ))}

          <line
            x1={MARGIN.left}
            x2={WIDTH - MARGIN.right}
            y1={MARGIN.top + INNER_HEIGHT}
            y2={MARGIN.top + INNER_HEIGHT}
            stroke={CHART_AXIS}
            strokeWidth={1}
          />

          {points.map((p, i) =>
            i % xLabelStep === 0 || i === n - 1 ? (
              <text
                key={p.period}
                x={xAt(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={10}
                fill={CHART_MUTED}
              >
                {formatPeriodLabel(p.period, groupBy)}
              </text>
            ) : null,
          )}

          {/* Keyed on the data so the draw-in replays when the range or grouping changes. */}
          <g key={`${groupBy}-${n}-${points[0].period}-${points[n - 1].revenue}`}>
            <path
              d={areaPath('revenue')}
              fill={SERIES_1}
              fillOpacity={0.1}
              stroke="none"
              className="animate-chart-fade"
              style={{ animationDelay: '500ms' }}
            />
            <path
              d={linePath('revenue')}
              pathLength={1}
              fill="none"
              stroke={SERIES_1}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="animate-draw-line"
            />
            <path
              d={linePath('commission')}
              pathLength={1}
              fill="none"
              stroke={SERIES_2}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="animate-draw-line"
              style={{ animationDelay: '150ms' }}
            />

            <circle
              cx={xAt(n - 1)}
              cy={yAt(points[n - 1].revenue)}
              r={4}
              fill={SERIES_1}
              stroke="#fff"
              strokeWidth={2}
              className="animate-dot-pop"
              style={{ animationDelay: '1000ms' }}
            />
            <circle
              cx={xAt(n - 1)}
              cy={yAt(points[n - 1].commission)}
              r={4}
              fill={SERIES_2}
              stroke="#fff"
              strokeWidth={2}
              className="animate-dot-pop"
              style={{ animationDelay: '1150ms' }}
            />
          </g>

          {hoverIndex !== null && (
            <>
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={MARGIN.top}
                y2={MARGIN.top + INNER_HEIGHT}
                stroke={CHART_AXIS}
                strokeWidth={1}
              />
              <circle cx={xAt(hoverIndex)} cy={yAt(hovered.revenue)} r={4} fill={SERIES_1} stroke="#fff" strokeWidth={2} />
              <circle cx={xAt(hoverIndex)} cy={yAt(hovered.commission)} r={4} fill={SERIES_2} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </svg>

        {hovered && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-40 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
            style={
              tooltipAlignEnd
                ? { right: `${100 - tooltipLeftPct}%`, marginRight: 8 }
                : { left: `${tooltipLeftPct}%`, marginLeft: 8 }
            }
          >
            <p className="mb-1 font-medium text-slate-200">{formatPeriodLabel(hovered.period, groupBy)}</p>
            <p className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: SERIES_1 }} />
                Revenue
              </span>
              <span className="font-semibold">{formatCurrency(hovered.revenue)}</span>
            </p>
            <p className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: SERIES_2 }} />
                Komisi
              </span>
              <span className="font-semibold">{formatCurrency(hovered.commission)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
