import { useEffect, useState } from 'react'
import AnimatedNumber from '../AnimatedNumber'
import { formatCurrency, formatDate } from '../../lib/format'

// Bagian-bagian halaman Detail Order yang dipakai admin dan partner.

// Path ikon untuk InfoCard (dirender di dalam <svg> milik InfoCard).
export const CustomerIconPath = () => (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
  />
)

// Langkah proses order. Status backend tetap 4 (pending_approval, confirmed,
// completed, cancelled); "Sedang Dikerjakan" = status confirmed, otomatis
// setelah admin approve.
// state: done | active (sedang dikerjakan) | waiting (menunggu aksi) | upcoming | cancelled
function getOrderSteps(order) {
  const created = { label: 'Dibuat', date: order.created_at, state: 'done' }

  if (order.status === 'cancelled') {
    return order.approved_at
      ? [
          created,
          { label: 'Di-approve', date: order.approved_at, state: 'done' },
          { label: 'Sedang Dikerjakan', caption: 'Terhenti', state: 'done' },
          { label: 'Dibatalkan', caption: 'Dibatalkan', state: 'cancelled' },
        ]
      : [
          created,
          { label: 'Di-approve', caption: '-', state: 'upcoming' },
          { label: 'Dibatalkan', caption: 'Dibatalkan', state: 'cancelled' },
        ]
  }

  if (order.status === 'completed') {
    return [
      created,
      { label: 'Di-approve', date: order.approved_at, state: 'done' },
      { label: 'Sedang Dikerjakan', caption: 'Tuntas', state: 'done' },
      { label: 'Selesai', date: order.completed_at, state: 'done' },
    ]
  }

  // Order dari client: belum bayar. Langkah kedua jadi "Pembayaran".
  if (order.status === 'awaiting_payment') {
    return [
      created,
      { label: 'Pembayaran', caption: 'Menunggu', state: 'waiting' },
      { label: 'Sedang Dikerjakan', caption: '-', state: 'upcoming' },
      { label: 'Selesai', caption: '-', state: 'upcoming' },
    ]
  }

  if (order.status === 'confirmed') {
    return [
      created,
      { label: 'Di-approve', date: order.approved_at, state: 'done' },
      { label: 'Sedang Dikerjakan', caption: 'Sedang berjalan', state: 'active' },
      { label: 'Selesai', caption: 'Menunggu', state: 'upcoming' },
    ]
  }

  return [
    created,
    { label: 'Di-approve', caption: 'Menunggu', state: 'waiting' },
    { label: 'Sedang Dikerjakan', caption: '-', state: 'upcoming' },
    { label: 'Selesai', caption: '-', state: 'upcoming' },
  ]
}

const GEAR_PATH =
  'M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'

const CIRCLE_STYLES = {
  done: 'bg-emerald-500 text-white ring-emerald-100',
  active: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white ring-indigo-100',
  waiting: 'bg-white text-indigo-600 ring-indigo-200 border-2 border-indigo-500',
  upcoming: 'bg-white text-slate-400 ring-slate-100 border-2 border-slate-200',
  cancelled: 'bg-red-500 text-white ring-red-100',
}

const LABEL_STYLES = {
  done: 'text-slate-900',
  active: 'text-indigo-700',
  waiting: 'text-slate-900',
  upcoming: 'text-slate-400',
  cancelled: 'text-red-600',
}

// Horizontal progress: Dibuat -> Di-approve -> Sedang Dikerjakan -> Selesai,
// or a red end state when cancelled. `embedded` drops the card wrapper so it can
// sit inside another card (e.g. each order in the client's Pesanan Saya list).
export function OrderTimeline({ order, embedded = false }) {
  const steps = getOrderSteps(order)
  const reached = steps.reduce((last, step, i) => (['done', 'active', 'cancelled'].includes(step.state) ? i : last), 0)
  const cancelled = order.status === 'cancelled'
  const progress = (reached / (steps.length - 1)) * 100

  // Grow the bar from 0 on mount/status change so the transition is visible.
  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setBarWidth(progress))
    return () => cancelAnimationFrame(frame)
  }, [progress])

  return (
    <section
      className={
        embedded
          ? 'rounded-xl bg-slate-50/70 px-4 py-5 ring-1 ring-slate-100 sm:px-6'
          : 'animate-fade-up rounded-2xl bg-white px-4 py-6 shadow-sm ring-1 ring-slate-200 sm:px-8'
      }
      style={embedded ? undefined : { animationDelay: '180ms' }}
    >
      <div className="relative">
        <div className="absolute left-4 right-4 top-4 h-1 rounded-full bg-slate-100" />
        <div className="absolute left-4 right-4 top-4 h-1">
          <div
            className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
              cancelled
                ? 'bg-gradient-to-r from-indigo-500 to-red-500'
                : 'bg-gradient-to-r from-indigo-500 to-emerald-500'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>

        <ol className="relative flex justify-between">
          {steps.map((step, index) => (
            <li
              key={step.label}
              className="flex w-16 flex-col items-center text-center first:items-start first:text-left last:items-end last:text-right sm:w-28"
            >
              <span
                className={`relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-4 transition-colors duration-500 ${CIRCLE_STYLES[step.state]}`}
                style={{ transitionDelay: `${index * 250}ms` }}
              >
                {(step.state === 'waiting' || step.state === 'active') && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/40" />
                )}
                {step.state === 'active' ? (
                  <svg
                    className="relative h-5 w-5 animate-[spin_4s_linear_infinite]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={GEAR_PATH} />
                  </svg>
                ) : step.state === 'cancelled' ? (
                  '✕'
                ) : step.state === 'done' ? (
                  '✓'
                ) : (
                  index + 1
                )}
              </span>
              <span className={`mt-2 text-[11px] font-semibold leading-tight sm:text-xs ${LABEL_STYLES[step.state]}`}>
                {step.label}
              </span>
              <span
                className={`mt-0.5 text-[11px] ${step.state === 'active' ? 'font-medium text-indigo-500' : 'text-slate-400'}`}
              >
                {step.date ? formatDate(step.date) : step.caption}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function InfoCard({ title, icon, accent, delay, children }) {
  return (
    <section
      className="animate-fade-up rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition duration-200 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            {icon}
          </svg>
        </span>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <dl className="space-y-3 text-sm">{children}</dl>
    </section>
  )
}

export function CommissionCard({ order, delay, title = 'Komisi Partner' }) {
  const commission = order.commission
  const paid = commission?.status === 'paid'

  return (
    <section
      className="animate-fade-up group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-5 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-2xl transition-transform duration-500 group-hover:scale-125" />

      <p className="relative text-sm font-semibold">{title}</p>
      <p className="relative mt-4 text-3xl font-semibold tracking-tight">
        <AnimatedNumber value={order.commission_amount} format={formatCurrency} />
      </p>

      <div className="relative mt-5 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-white/70">Status Pembayaran</span>
          <span className="font-medium">
            {commission ? (paid ? 'Sudah dibayar' : 'Belum dibayar') : 'Belum ada komisi'}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-white/70">Tanggal Selesai</span>
          <span className="font-medium">{order.completed_at ? formatDate(order.completed_at) : '-'}</span>
        </div>
      </div>

      {!commission && (
        <p className="relative mt-4 rounded-lg bg-white/10 px-3 py-2 text-xs text-white/80">
          {order.status === 'cancelled'
            ? 'Order dibatalkan, tidak ada komisi.'
            : order.partner
              ? 'Komisi dihitung otomatis saat order diselesaikan.'
              : 'Direct Sale tidak menghasilkan komisi partner.'}
        </p>
      )}
    </section>
  )
}

export function Detail({ label, value, multiline }) {
  return (
    <div
      className={`flex gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0 ${
        multiline ? 'flex-col gap-1' : 'items-start justify-between'
      }`}
    >
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`font-medium break-words text-slate-900 ${multiline ? 'whitespace-pre-line' : 'text-right'}`}>
        {value || '-'}
      </dd>
    </div>
  )
}
