const STYLES = {
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  pending_approval: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  awaiting_payment: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  suspended: 'bg-red-50 text-red-700 ring-red-600/20',
  unpaid: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  promo: 'bg-purple-50 text-purple-700 ring-purple-600/20',
  announcement: 'bg-blue-50 text-blue-700 ring-blue-600/20',
}

const LABELS = {
  pending_approval: 'Pending Approval',
  awaiting_payment: 'Menunggu Pembayaran',
  // confirmed = sudah di-approve admin, order sedang dikerjakan
  confirmed: 'Sedang Dikerjakan',
}

export default function StatusBadge({ status }) {
  const style = STYLES[status] || 'bg-slate-100 text-slate-600 ring-slate-500/20'
  const label = LABELS[status] || status?.replace(/_/g, ' ')

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  )
}
