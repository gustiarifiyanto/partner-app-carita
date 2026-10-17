import { useState } from 'react'
import ConfirmDialog from '../ConfirmDialog'
import FormField from '../FormField'
import Modal from '../Modal'
import { useToast } from '../../hooks/useToast'
import api from '../../lib/api'
import { formatCurrency } from '../../lib/format'
import { fieldClass } from '../../lib/formStyles'

// Tombol Terima / Tolak bukti transfer (admin). Terima = order lanjut dikerjakan.
export default function PaymentReviewActions({ payment, orderNumber, onDone, compact = false }) {
  const toast = useToast()
  const [confirmVerify, setConfirmVerify] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [busy, setBusy] = useState(false)

  if (payment.status !== 'waiting_verification') return null

  const verify = async () => {
    setBusy(true)
    try {
      const { data } = await api.put(`/admin/client-payments/${payment.id}/verify`)
      toast.success(data.message)
      setConfirmVerify(false)
      onDone?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menerima pembayaran.')
      setConfirmVerify(false)
    } finally {
      setBusy(false)
    }
  }

  const reject = async (e) => {
    e.preventDefault()
    setReasonError('')
    setBusy(true)
    try {
      const { data } = await api.put(`/admin/client-payments/${payment.id}/reject`, { reason })
      toast.success(data.message)
      setShowReject(false)
      setReason('')
      onDone?.()
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors?.reason) {
        setReasonError(err.response.data.errors.reason[0])
      } else {
        toast.error(err.response?.data?.message || 'Gagal menolak bukti bayar.')
      }
    } finally {
      setBusy(false)
    }
  }

  const size = compact ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirmVerify(true)}
          className={`rounded-lg bg-emerald-600 font-semibold text-white hover:bg-emerald-700 ${size}`}
        >
          Terima
        </button>
        <button
          type="button"
          onClick={() => setShowReject(true)}
          className={`rounded-lg border border-red-200 font-medium text-red-600 hover:bg-red-50 ${size}`}
        >
          Tolak
        </button>
      </div>

      <ConfirmDialog
        open={confirmVerify}
        onClose={() => setConfirmVerify(false)}
        onConfirm={verify}
        loading={busy}
        tone="emerald"
        title="Terima Pembayaran?"
        description={`Pastikan dana ${formatCurrency(payment.amount)} sudah masuk ke rekening${
          orderNumber ? ` untuk order ${orderNumber}` : ''
        }. Order akan langsung masuk tahap pengerjaan.`}
        confirmLabel="Ya, Terima"
        loadingLabel="Memproses..."
        icon={<path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />}
      />

      <Modal open={showReject} onClose={busy ? () => {} : () => setShowReject(false)} title="Tolak Bukti Transfer">
        <form onSubmit={reject} className="space-y-4">
          <FormField label="Alasan penolakan" error={reasonError} hint="Ditampilkan ke pengirim supaya bisa upload ulang">
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Mis. nominal tidak sesuai / bukti tidak terbaca"
              className={fieldClass(reasonError)}
              required
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReject(false)}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? 'Menolak...' : 'Tolak Bukti'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
