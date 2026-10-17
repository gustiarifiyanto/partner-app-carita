import { useState } from 'react'
import { useToast } from '../../hooks/useToast'
import { usePaymentInfo } from '../../hooks/usePaymentInfo'
import api from '../../lib/api'
import { toFormData } from '../../lib/formData'
import { BankAccountsInfo, PaymentProofFields } from './PaymentParts'

// Form upload (ulang) bukti transfer untuk order yang sudah ada.
// `endpoint` mis. /client/orders/12/payments atau /partner/orders/12/payments.
export default function PaymentUploadForm({ endpoint, amount, onUploaded, submitLabel = 'Kirim Bukti Transfer' }) {
  const toast = useToast()
  const paymentInfo = usePaymentInfo()
  const [values, setValues] = useState({ payment_proof: null, sender_bank: '', sender_name: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!values.payment_proof) {
      setErrors({ payment_proof: ['Pilih file bukti transfer dulu'] })
      return
    }
    setErrors({})
    setError('')
    setSubmitting(true)

    try {
      const { data } = await api.post(endpoint, toFormData(values))
      toast.success(data.message)
      setValues({ payment_proof: null, sender_bank: '', sender_name: '' })
      onUploaded?.(data.data)
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors) {
        setErrors(err.response.data.errors)
      } else if (err.response?.status === 413) {
        setError('File terlalu besar untuk server.')
      } else {
        setError(err.response?.data?.message || 'Gagal mengirim bukti transfer.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <BankAccountsInfo paymentInfo={paymentInfo} amount={amount} />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <PaymentProofFields
        value={values}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
        errors={errors}
        maxMb={paymentInfo.proof_max_mb}
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? 'Mengirim...' : submitLabel}
      </button>
    </form>
  )
}
