import { useState } from 'react'
import CatalogPicker from '../catalog/CatalogPicker'
import { BankAccountsInfo, PaymentProofFields } from '../payments/PaymentParts'
import FormField from '../FormField'
import Modal from '../Modal'
import api from '../../lib/api'
import { fieldClass } from '../../lib/formStyles'
import { useCatalog } from '../../hooks/useCatalog'
import { usePaymentInfo } from '../../hooks/usePaymentInfo'
import { toFormData } from '../../lib/formData'
import { useToast } from '../../hooks/useToast'

const INITIAL_FORM = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  package_id: '',
  theme_id: '',
  payment_proof: null,
  sender_bank: '',
  sender_name: '',
  notes: '',
  send_email: true,
}

export default function CreatePartnerOrderModal({ open, onClose, onCreated }) {
  const toast = useToast()
  // Katalog baru dimuat saat modal pertama kali dibuka.
  const catalog = useCatalog(open)
  const paymentInfo = usePaymentInfo(open)
  const [form, setForm] = useState(INITIAL_FORM)
  const selectedPackage = catalog.packages.find((p) => String(p.id) === String(form.package_id))
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setErrors({})
    setGeneralError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setGeneralError('')
    setSubmitting(true)

    try {
      if (!form.payment_proof) {
        setErrors({ payment_proof: ['Bukti transfer wajib diupload'] })
        return
      }

      // Multipart karena ada file bukti transfer; field kosong tidak dikirim.
      const { data } = await api.post('/partner/orders', toFormData(form))
      setForm(INITIAL_FORM)
      // Parent menampilkan modal "Bagikan Akses Client" dari data ini.
      onCreated({ order: data.data, clientAccount: data.client_account })
      toast.success('Order berhasil dibuat.')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else {
        const message = err.response?.data?.message || 'Gagal membuat order.'
        setGeneralError(message)
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Buat Order">
      {generalError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{generalError}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Nama Customer" error={errors.customer_name}>
          <input
            value={form.customer_name}
            onChange={handleChange('customer_name')}
            className={fieldClass(errors.customer_name)}
            required
          />
        </FormField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField label="Email Customer" error={errors.customer_email} hint="Dipakai client untuk login">
            <input
              type="email"
              value={form.customer_email}
              onChange={handleChange('customer_email')}
              className={fieldClass(errors.customer_email)}
              required
            />
          </FormField>
          <FormField label="No. WhatsApp Customer" error={errors.customer_phone} hint="Untuk berbagi info akun via WA">
            <input
              type="tel"
              inputMode="tel"
              placeholder="08xxxxxxxxxx"
              value={form.customer_phone}
              onChange={handleChange('customer_phone')}
              className={fieldClass(errors.customer_phone)}
            />
          </FormField>
        </div>

        <div className="rounded-lg bg-violet-50 px-3 py-2.5 text-xs leading-relaxed text-violet-800">
          Akun client akan <strong>dibuat otomatis</strong> dari nama, email, dan nomor WA di atas. Kalau email sudah
          punya akun client, order langsung masuk ke akun tersebut.
        </div>

        <CatalogPicker
          catalog={catalog}
          packageId={form.package_id}
          themeId={form.theme_id}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          errors={errors}
        />

        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Pembayaran Client</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Order hanya dibuat kalau client sudah lunas. Transfer <strong>nominal penuh</strong> ke rekening admin,
              lalu upload buktinya. Komisi kamu dibayarkan terpisah.
            </p>
          </div>
          <BankAccountsInfo paymentInfo={paymentInfo} amount={selectedPackage?.price} />
          <PaymentProofFields
            value={form}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            errors={errors}
            maxMb={paymentInfo.proof_max_mb}
          />
        </div>

        <FormField label="Catatan">
          <textarea rows={2} value={form.notes} onChange={handleChange('notes')} className={fieldClass(false)} />
        </FormField>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.send_email}
            onChange={handleChange('send_email')}
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />
          <span>Kirim info login akun baru ke email client secara otomatis</span>
        </label>

        <div className="flex justify-end gap-2 pt-1">
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
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
