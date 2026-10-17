import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import Modal from '../Modal'

export default function DeleteOrderModal({ open, onClose, onDeleted, order }) {
  const toast = useToast()
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const orderNumber = order?.order_number ?? ''
  const canDelete = orderNumber !== '' && confirmText.trim().toUpperCase() === orderNumber.toUpperCase()

  const handleClose = () => {
    setConfirmText('')
    setError('')
    onClose()
  }

  const handleDelete = async () => {
    if (!canDelete) return

    setError('')
    setSubmitting(true)
    try {
      await api.delete(`/admin/orders/${order.id}`)
      toast.success(`Order ${orderNumber} berhasil dihapus.`)
      setConfirmText('')
      onDeleted()
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menghapus order.'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Hapus Order">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <div className="flex items-start gap-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
        <svg className="mt-0.5 h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <p>
          Tindakan ini <strong>permanen dan tidak bisa dibatalkan</strong>. Order <strong>{orderNumber}</strong>
          {order?.customer_name && <> atas nama {order.customer_name}</>} senilai{' '}
          {formatCurrency(order?.order_amount)} akan dihapus dari sistem.
        </p>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Ketik nomor order <span className="font-semibold text-slate-900">{orderNumber}</span> untuk konfirmasi
        </label>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={orderNumber}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || submitting}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
        </button>
      </div>
    </Modal>
  )
}
