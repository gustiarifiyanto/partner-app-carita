import { useEffect, useState } from 'react'
import CatalogPicker from '../catalog/CatalogPicker'
import FormField from '../FormField'
import Modal from '../Modal'
import { BankAccountsInfo, PaymentProofFields, PaymentRequestMessage } from '../payments/PaymentParts'
import api from '../../lib/api'
import { toFormData } from '../../lib/formData'
import { fieldClass } from '../../lib/formStyles'
import { useCatalog } from '../../hooks/useCatalog'
import { usePaymentInfo } from '../../hooks/usePaymentInfo'
import { useToast } from '../../hooks/useToast'

const INITIAL_FORM = {
  partner_id: '',
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

// Admin membuat order untuk client yang menghubungi admin langsung.
// Akun client dibuat otomatis; bukti transfer yang diupload admin langsung
// dianggap lunas sehingga order langsung masuk tahap pengerjaan.
export default function CreateOrderModal({ open, onClose, onCreated }) {
  const toast = useToast()
  const catalog = useCatalog(open)
  const paymentInfo = usePaymentInfo(open)
  const [form, setForm] = useState(INITIAL_FORM)
  const selectedPackage = catalog.packages.find((p) => String(p.id) === String(form.package_id))
  const selectedTheme = catalog.themes.find((t) => String(t.id) === String(form.theme_id))
  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [partners, setPartners] = useState([])

  useEffect(() => {
    if (!open) return
    api
      .get('/admin/partners', { params: { verification_status: 'verified', per_page: 100 } })
      .then(({ data }) => setPartners(data.data))
      .catch(() => setPartners([]))
  }, [open])

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

    if (!form.payment_proof) {
      setErrors({ payment_proof: ['Bukti transfer wajib diupload'] })
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/admin/orders', toFormData(form))
      setForm(INITIAL_FORM)
      onCreated({ order: data.data, clientAccount: data.client_account })
      toast.success('Order dibuat dan pembayaran tercatat lunas.')
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {})
      } else if (err.response?.status === 413) {
        setGeneralError('File bukti terlalu besar untuk server.')
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
    <Modal open={open} onClose={submitting ? () => {} : handleClose} title="Buat Order">
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
          <FormField label="No. WhatsApp Customer" error={errors.customer_phone}>
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
          Akun client <strong>dibuat otomatis</strong> dari data di atas. Kalau email sudah punya akun client, order
          langsung masuk ke akun tersebut.
        </div>

        <CatalogPicker
          catalog={catalog}
          packageId={form.package_id}
          themeId={form.theme_id}
          onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          errors={errors}
        />

        <FormField
          label="Partner (opsional)"
          error={errors.partner_id}
          hint="Kosongkan untuk client yang menghubungi admin langsung (tanpa komisi)"
        >
          <select value={form.partner_id} onChange={handleChange('partner_id')} className={fieldClass(errors.partner_id)}>
            <option value="">Tanpa Partner (Direct Sale)</option>
            {partners.map((partner) => (
              <option key={partner.id} value={partner.id}>
                {partner.company_name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Tagihan ke Client</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Salin pesan ini dan kirim ke client supaya transfer ke rekening admin.
            </p>
          </div>
          <BankAccountsInfo paymentInfo={paymentInfo} amount={selectedPackage?.price} />
          <PaymentRequestMessage
            paymentInfo={paymentInfo}
            customerName={form.customer_name}
            customerPhone={form.customer_phone}
            pkg={selectedPackage}
            theme={selectedTheme}
            proofRecipient="kami (Admin Carita Studio)"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Bukti Pembayaran</p>
            <p className="mt-0.5 text-xs text-slate-500">
              Disimpan untuk riwayat & laporan. Bukti yang diupload admin langsung dianggap lunas.
            </p>
          </div>
          <PaymentProofFields
            value={form}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
            errors={errors}
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
            disabled={submitting}
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
