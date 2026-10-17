import { useState } from 'react'
import Modal from '../Modal'
import api from '../../lib/api'
import { useToast } from '../../hooks/useToast'

export default function RejectPartnerModal({ open, onClose, onRejected, partnerId }) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    setReason('')
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const { data } = await api.put(`/admin/partners/${partnerId}/verify`, {
        verification_status: 'rejected',
        rejection_reason: reason,
      })
      setReason('')
      onRejected()
      if (data.email_sent === false) {
        toast.error('Partner ditolak, tapi email pemberitahuan gagal dikirim. Kabari partner lewat WhatsApp.')
      } else {
        toast.success('Partner berhasil ditolak dan sudah diberi tahu lewat email.')
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menolak partner.'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Tolak Partner">
      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Alasan Penolakan</label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Alasan ini dikirim ke email partner. Jika partner tidak konfirmasi lewat WhatsApp dan tidak kamu terima
            ulang dalam 7 hari, akunnya dihapus otomatis.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Memproses...' : 'Tolak Partner'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
