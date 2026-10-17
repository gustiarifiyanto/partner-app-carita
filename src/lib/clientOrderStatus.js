// Label status yang ramah untuk client (istilah internal admin/partner disembunyikan).
export const CLIENT_ORDER_STATUS = {
  awaiting_payment: {
    label: 'Menunggu Pembayaran',
    className: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  },
  pending_approval: {
    label: 'Menunggu Konfirmasi',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  confirmed: {
    label: 'Sedang Dikerjakan',
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  completed: {
    label: 'Selesai',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  cancelled: {
    label: 'Dibatalkan',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
}

export function clientOrderStatus(status) {
  return CLIENT_ORDER_STATUS[status] || { label: status, className: 'bg-slate-100 text-slate-600 ring-slate-500/20' }
}
